import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { prisma, Prisma } from '@/lib/db';
import { getRazorpay, formatCurrency } from '@/lib/razorpay';
import { resolvePrices } from '@/lib/pricing';
import { apiError, apiUnauthorized } from '@/lib/api-helpers';
import {
  normalizeCouponCode,
  isValidCoupon,
  applyCouponToCartItems,
  type ServerCartItem,
} from '@/lib/pricing/coupons';
import { getPrimaryProductImage } from '@/lib/shop/media-helpers';

/**
 * POST /api/checkout
 * Creates a Razorpay order for the items in the user's cart.
 * 
 * Uses payment_capture: 1 (auto-capture) — no manual capture flow.
 * Validates all prices server-side via resolvePrice() before order creation.
 */
export async function POST(request: Request) {
  try {
    // ── Early env var validation (fail fast with clear message) ──
    const enableMockEarly = !process.env.VERCEL && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT === 'true';
    if (!enableMockEarly) {
      const missingVars: string[] = [];
      if (!process.env.RAZORPAY_KEY_ID) missingVars.push('RAZORPAY_KEY_ID');
      if (!process.env.RAZORPAY_KEY_SECRET) missingVars.push('RAZORPAY_KEY_SECRET');
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) missingVars.push('NEXT_PUBLIC_RAZORPAY_KEY_ID');
      if (missingVars.length > 0) {
        console.error(`[CHECKOUT] Missing Razorpay env vars: ${missingVars.join(', ')}`);
        return apiError('CONFIG_ERROR', 'Razorpay environment variables are missing. Please contact support.', 500);
      }
    }

    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { items, addressId, shippingAddress, couponCode } = body;
    const variantInclude = {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          images: {
            select: { url: true, color: true, isPrimary: true },
            orderBy: { sortOrder: 'asc' as const },
          },
        },
      },
    };

    // Map items from body or read from DB cart
    let cartItems;
    if (items && Array.isArray(items) && items.length > 0) {
      cartItems = [];
      for (const item of items) {
        const variantById = item.variantId
          ? await prisma.productVariant.findUnique({
              where: { id: item.variantId },
              include: variantInclude,
            })
          : null;

        const variant =
          variantById && variantById.productId === item.productId
            ? variantById
            : await prisma.productVariant.findFirst({
              where: {
                productId: item.productId,
                size: item.size,
                color: item.color,
              },
              include: variantInclude,
            });

        if (!variant) {
          return apiError('VARIANT_NOT_FOUND', `Variant not found for product ${item.productId} (${item.size}/${item.color})`, 400);
        }

        cartItems.push({
          productId: item.productId,
          variantId: variant.id,
          quantity: item.quantity,
          product: variant.product,
          variant: {
            id: variant.id,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            sku: variant.sku,
          }
        });
      }
    } else {
      // Get the user's cart items with product details
      cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              images: {
                select: { url: true, color: true, isPrimary: true },
                orderBy: { sortOrder: 'asc' as const },
              },
            },
          },
          variant: {
            select: {
              id: true,
              size: true,
              color: true,
              stock: true,
              sku: true,
            },
          },
        },
      });
    }

    if (cartItems.length === 0) {
      return apiError('EMPTY_CART', 'Your cart is empty', 400);
    }

    // Validate all products are active
    const inactiveItems = cartItems.filter((item) => !item.product.isActive);
    if (inactiveItems.length > 0) {
      return apiError(
        'UNAVAILABLE_ITEMS',
        `Some items are no longer available: ${inactiveItems.map((i) => i.product.name).join(', ')}`,
        400
      );
    }

    // Validate stock availability
    for (const item of cartItems) {
      if (item.variant && item.variant.stock < item.quantity) {
        return apiError(
          'INSUFFICIENT_STOCK',
          `Only ${item.variant.stock} units of ${item.product.name} (${item.variant.size}/${item.variant.color}) available`,
          400
        );
      }
    }

    // Resolve server-side prices (prevents client-side price manipulation)
    const productIds = cartItems.map((item) => item.productId);
    const priceMap = await resolvePrices(productIds);

    // Fetch product categories for coupon logic
    const productCategories = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { slug: true } } },
    });
    const categoryMap = new Map(
      productCategories.map((p) => [p.id, p.category?.slug ?? ''])
    );

    // Helper: resolve best image for an order item based on variant color
    const resolveItemImage = (item: typeof cartItems[0]): string | null => {
      const images = (item.product as any).images as { url: string; color: string | null; isPrimary: boolean }[] | undefined;
      if (!images || images.length === 0) return null;

      const variantColor = item.variant?.color ?? null;

      // Priority 1: Image matching the selected variant/color
      if (variantColor) {
        const colorMatch = images.find(
          (img) => img.color && img.color.toLowerCase() === variantColor.toLowerCase()
        );
        if (colorMatch) return colorMatch.url;
      }

      // Priority 2: Primary image
      const primary = images.find((img) => img.isPrimary);
      if (primary) return primary.url;

      // Priority 3: First available image
      return getPrimaryProductImage(images);
    };

    // Calculate totals (all in paise)
    let subtotal = 0;
    const lineItems = cartItems.map((item) => {
      const resolved = priceMap.get(item.productId);
      if (!resolved) {
        throw new Error(`Price not found for product: ${item.productId}`);
      }
      const lineTotal = resolved.finalPrice * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        size: item.variant?.size ?? null,
        color: item.variant?.color ?? null,
        quantity: item.quantity,
        unitPrice: resolved.finalPrice,
        originalUnitPrice: resolved.finalPrice,
        totalPrice: lineTotal,
        imageUrl: resolveItemImage(item),
        categorySlug: categoryMap.get(item.productId) ?? '',
      };
    });

    // Apply coupon if provided (server-side calculation — never trust frontend)
    let discountAmount = 0;
    let discountCode: string | null = null;
    let finalTotal = subtotal;

    if (couponCode) {
      const code = normalizeCouponCode(couponCode);
      if (!isValidCoupon(code)) {
        return apiError('INVALID_COUPON', 'Invalid or expired coupon code', 400);
      }

      const serverItems: ServerCartItem[] = lineItems.map((li) => ({
        productId: li.productId,
        variantId: li.variantId,
        quantity: li.quantity,
        categorySlug: li.categorySlug,
        originalUnitPrice: li.originalUnitPrice,
      }));

      const couponResult = applyCouponToCartItems(code, serverItems);
      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        discountCode = couponResult.couponCode;
        finalTotal = couponResult.finalTotal;

        // Update line items with coupon-adjusted prices
        for (const couponItem of couponResult.items) {
          const li = lineItems.find(
            (l) => l.productId === couponItem.productId && l.variantId === couponItem.variantId
          );
          if (li) {
            li.unitPrice = couponItem.finalUnitPrice;
            li.totalPrice = couponItem.lineTotal;
          }
        }
      }
    }

    // Shipping fee and tax are now included in final price (0 extra)
    const shippingFee = 0;
    const tax = 0;
    // order.total = final amount the customer pays (source of truth)
    const total = finalTotal;

    // Save inline address first if provided
    let deliveryAddressId = addressId;
    if (deliveryAddressId) {
      // Verify the address belongs to the authenticated user
      const existingAddress = await prisma.address.findUnique({
        where: { id: deliveryAddressId },
        select: { userId: true },
      });
      if (!existingAddress || existingAddress.userId !== user.id) {
        return apiError('VALIDATION_ERROR', 'Invalid shipping address. Address not found or unauthorized.', 400);
      }
    } else if (shippingAddress) {
      // Validate shipping address fields on backend
      const { fullName, phone, line1, city, state, postalCode } = shippingAddress;
      if (!fullName?.trim() || !phone?.trim() || !line1?.trim() || !city?.trim() || !state?.trim() || !postalCode?.trim()) {
        return apiError('VALIDATION_ERROR', 'All required shipping address fields must be filled.', 400);
      }
      if (!/^\d{10}$/.test(phone.trim())) {
        return apiError('VALIDATION_ERROR', 'Invalid phone number. Must be 10 digits.', 400);
      }
      if (!/^\d{6}$/.test(postalCode.trim())) {
        return apiError('VALIDATION_ERROR', 'Invalid postal code. Must be 6 digits.', 400);
      }

      // Duplicate check
      const normalizeStr = (s: string | null | undefined) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizePhoneNum = (s: string | null | undefined) => (s || '').replace(/\s+/g, '');

      const isDuplicateAddress = (addr1: any, addr2: any) => {
        return (
          normalizeStr(addr1.fullName) === normalizeStr(addr2.fullName) &&
          normalizePhoneNum(addr1.phone) === normalizePhoneNum(addr2.phone) &&
          normalizeStr(addr1.line1) === normalizeStr(addr2.line1) &&
          normalizeStr(addr1.line2) === normalizeStr(addr2.line2) &&
          normalizeStr(addr1.city) === normalizeStr(addr2.city) &&
          normalizeStr(addr1.state) === normalizeStr(addr2.state) &&
          normalizePhoneNum(addr1.postalCode) === normalizePhoneNum(addr2.postalCode) &&
          normalizeStr(addr1.country || 'India') === normalizeStr(addr2.country || 'India')
        );
      };

      const existingAddresses = await prisma.address.findMany({ where: { userId: user.id } });
      const duplicate = existingAddresses.find(addr => isDuplicateAddress(addr, shippingAddress));

      if (duplicate) {
        deliveryAddressId = duplicate.id;
      } else {
        const savedAddress = await prisma.address.create({
          data: {
            userId: user.id,
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            line1: shippingAddress.line1.trim(),
            line2: shippingAddress.line2?.trim() || '',
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            country: shippingAddress.country || 'India',
            label: 'Shipping',
            isDefault: false
          }
        });
        deliveryAddressId = savedAddress.id;
      }
    }

    if (!deliveryAddressId) {
      return apiError('VALIDATION_ERROR', 'No delivery address provided', 400);
    }

    // ─── Atomic order number generation + order creation ───────────────
    // Uses OrderSequence table with atomic increment and P2002 retry.
    const MAX_RETRIES = 3;
    let order: { id: string; orderNumber: string; total: number } | null = null;
    let razorpayOrder: { id: string } | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Atomically increment the sequence and get the next value
        const updated = await prisma.orderSequence.update({
          where: { name: 'AUTHOR_ORDER' },
          data: { value: { increment: 1 } },
        });
        const orderNumber = `AUTH-${String(updated.value).padStart(6, '0')}`;

        // Create the Razorpay order with auto-capture, or fallback to mock in local sandbox
        const enableMock = !process.env.VERCEL && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT === 'true';

        if (enableMock) {
          // Mock order for test checkout sandbox
          razorpayOrder = {
            id: `order_MOCK_${Math.random().toString(36).substring(2, 15)}`,
          };
        } else {
          const razorpay = getRazorpay();
          razorpayOrder = await razorpay.orders.create({
            amount: total, // Already in paise
            currency: 'INR',
            receipt: orderNumber,
            payment_capture: 1 as any, // Auto-capture — [Audit #4]
            notes: {
              userId: user.id,
              orderNumber,
              ...(discountCode && {
                couponCode: discountCode,
                originalSubtotal: String(subtotal),
                discountAmount: String(discountAmount),
                finalTotal: String(total),
              }),
            },
          });
        }

        // Create the order in our database
        order = await prisma.order.create({
          data: {
            orderNumber,
            userId: user.id,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            subtotal,
            discount: discountAmount,
            discountCode,
            shippingFee,
            tax,
            total,
            addressId: deliveryAddressId,
            razorpayOrderId: razorpayOrder.id,
            items: {
              create: lineItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.productName,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                originalUnitPrice: item.originalUnitPrice,
                discountAmount: item.originalUnitPrice - item.unitPrice,
                totalPrice: item.totalPrice,
                imageUrl: item.imageUrl,
              })),
            },
            statusHistory: {
              create: {
                status: 'PENDING',
                note: discountCode
                  ? `Order created with coupon ${discountCode}, awaiting payment`
                  : 'Order created, awaiting payment',
              },
            },
          },
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        });

        break; // Success — exit retry loop
      } catch (err: any) {
        // P2002 = unique constraint violation on orderNumber — retry with next sequence
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < MAX_RETRIES - 1
        ) {
          console.warn(`[CHECKOUT] P2002 duplicate orderNumber on attempt ${attempt + 1}, retrying...`);
          continue;
        }
        throw err; // Re-throw non-retryable errors
      }
    }

    if (!order || !razorpayOrder) {
      return apiError('CHECKOUT_FAILED', 'Failed to create order after retries', 500);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: total,
        currency: 'INR',
        prefill: {
          name: user.name ?? '',
          email: user.email,
          contact: user.phone ?? '',
        },
      },
    });
  } catch (error: any) {
    console.error('[CHECKOUT_ERROR]', {
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      description: error?.error?.description,
      reason: error?.error?.reason,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    });
    // Distinguish Razorpay SDK errors from other failures
    const isRazorpayError = error?.message?.includes('razorpay') || error?.statusCode;
    const userMessage = isRazorpayError
      ? 'Payment gateway error. Please try again or contact support.'
      : 'Failed to create Razorpay order. Please try again.';
    return apiError('CHECKOUT_FAILED', userMessage, 500);
  }
}
