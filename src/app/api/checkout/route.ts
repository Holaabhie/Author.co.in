import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/db';
import { getRazorpay, formatCurrency } from '@/lib/razorpay';
import { resolvePrices } from '@/lib/pricing';
import { apiError, apiUnauthorized } from '@/lib/api-helpers';

/**
 * POST /api/checkout
 * Creates a Razorpay order for the items in the user's cart.
 * 
 * Uses payment_capture: 1 (auto-capture) — no manual capture flow.
 * Validates all prices server-side via resolvePrice() before order creation.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { items, addressId, shippingAddress } = body;
    const variantInclude = {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
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
        totalPrice: lineTotal,
      };
    });

    // Shipping fee calculation (free above ₹4000 = 400000 paise)
    const FREE_SHIPPING_THRESHOLD = 400000; // ₹4000 in paise
    const STANDARD_SHIPPING = 9900; // ₹99 in paise
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

    // Tax calculation (18% GST — will be split to CGST/SGST or IGST in invoice)
    const taxRate = 0.18;
    const tax = Math.round(subtotal * taxRate);

    const total = subtotal + shippingFee + tax;

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

    if (!deliveryAddressId) {
      return apiError('VALIDATION_ERROR', 'No delivery address provided', 400);
    }

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `AUTH-${String(orderCount + 1).padStart(6, '0')}`;

    // Create the Razorpay order with auto-capture, or fallback to mock in local sandbox environment
    let razorpayOrder;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'rzp_test_...' || keySecret === 'your-key-secret') {
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
        payment_capture: true, // Auto-capture — [Audit #4]
        notes: {
          userId: user.id,
          orderNumber,
        },
      });
    }

    // Create the order in our database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
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
            totalPrice: item.totalPrice,
          })),
        },
        statusHistory: {
          create: {
            status: 'PENDING',
            note: 'Order created, awaiting payment',
          },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
      },
    });

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
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error);
    return apiError('CHECKOUT_FAILED', 'Failed to create checkout session', 500);
  }
}
