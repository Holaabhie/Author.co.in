import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { resolvePrices } from '@/lib/pricing';
import {
  normalizeCouponCode,
  isValidCoupon,
  applyCouponToCartItems,
  type ServerCartItem,
} from '@/lib/pricing/coupons';

/**
 * POST /api/coupons/apply
 *
 * Validates and applies a coupon code to the provided cart items.
 * Fetches product prices and categories from DB — never trusts frontend values.
 *
 * Body: { couponCode: string, items: [{ productId, variantId, quantity }] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const { couponCode, items } = body;

    if (!couponCode || typeof couponCode !== 'string') {
      return apiError('VALIDATION_ERROR', 'Coupon code is required', 400);
    }

    const code = normalizeCouponCode(couponCode);

    if (!isValidCoupon(code)) {
      return apiError('INVALID_COUPON', 'Invalid or expired coupon code', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiError('VALIDATION_ERROR', 'Cart items are required', 400);
    }

    // Fetch product details from DB (never trust frontend prices)
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: {
        id: true,
        category: { select: { slug: true } },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Resolve server-side prices
    const priceMap = await resolvePrices(productIds);

    // Build server cart items with DB-sourced prices and categories
    const serverItems: ServerCartItem[] = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return apiError(
          'PRODUCT_NOT_FOUND',
          `Product ${item.productId} not found or inactive`,
          400
        );
      }

      const resolved = priceMap.get(item.productId);
      if (!resolved) {
        return apiError(
          'PRICE_ERROR',
          `Could not resolve price for product ${item.productId}`,
          400
        );
      }

      serverItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        categorySlug: product.category?.slug ?? '',
        originalUnitPrice: resolved.finalPrice, // finalPrice from resolvePrices (considers flash sales, discountPrice)
      });
    }

    // Apply coupon logic server-side
    const result = applyCouponToCartItems(code, serverItems);

    if (!result.valid) {
      return apiError('INVALID_COUPON', 'Coupon could not be applied', 400);
    }

    return apiSuccess({
      valid: true,
      couponCode: result.couponCode,
      items: result.items.map((li) => ({
        productId: li.productId,
        variantId: li.variantId,
        categorySlug: li.categorySlug,
        quantity: li.quantity,
        originalUnitPrice: li.originalUnitPrice,
        finalUnitPrice: li.finalUnitPrice,
        discountPerUnit: li.discountPerUnit,
      })),
      originalSubtotal: result.originalSubtotal,
      discountAmount: result.discountAmount,
      finalTotal: result.finalTotal,
    });
  } catch (error) {
    console.error('[COUPON_APPLY_ERROR]', error);
    return apiError('COUPON_ERROR', 'Failed to apply coupon', 500);
  }
}
