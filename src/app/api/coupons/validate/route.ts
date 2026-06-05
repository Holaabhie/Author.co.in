import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-user';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';

/**
 * POST /api/coupons/validate
 * 
 * Validates a coupon code against the current cart.
 * Body: { code, subtotal (paise) }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const { code, subtotal } = await request.json();

    if (!code || typeof subtotal !== 'number') {
      return apiError('VALIDATION_ERROR', 'Coupon code and subtotal are required', 400);
    }

    const coupon = await prisma.couponCode.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        usageRecords: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    });

    if (!coupon) {
      return apiError('INVALID_COUPON', 'Invalid coupon code', 400);
    }

    // Check if active
    if (!coupon.isActive) {
      return apiError('COUPON_INACTIVE', 'This coupon is no longer active', 400);
    }

    // Check expiry
    const now = new Date();
    if (coupon.startsAt > now) {
      return apiError('COUPON_NOT_STARTED', 'This coupon is not yet active', 400);
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return apiError('COUPON_EXPIRED', 'This coupon has expired', 400);
    }

    // Check total usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return apiError('COUPON_EXHAUSTED', 'This coupon has reached its usage limit', 400);
    }

    // Check per-customer limit
    if (coupon.perCustomerLimit && coupon.usageRecords.length >= coupon.perCustomerLimit) {
      return apiError('COUPON_ALREADY_USED', 'You have already used this coupon', 400);
    }

    // Check first-order-only
    if (coupon.firstOrderOnly) {
      const orderCount = await prisma.order.count({
        where: { userId: user.id, paymentStatus: 'PAID' },
      });
      if (orderCount > 0) {
        return apiError('FIRST_ORDER_ONLY', 'This coupon is only for first-time orders', 400);
      }
    }

    // Check minimum order value
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      const minInRupees = (coupon.minOrderValue / 100).toLocaleString('en-IN');
      return apiError(
        'MIN_ORDER_NOT_MET',
        `Minimum order value of ₹${minInRupees} required`,
        400
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'FREE_SHIPPING') {
      // Free shipping — discount amount is 0, but flag it
      discount = 0;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    return apiSuccess({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount, // Calculated discount in paise
      description: coupon.description,
      freeShipping: coupon.discountType === 'FREE_SHIPPING',
    });
  } catch (error) {
    console.error('[COUPON_VALIDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to validate coupon', 500);
  }
}
