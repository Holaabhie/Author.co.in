import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-user';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';

/**
 * POST /api/checkout/verify
 * 
 * Called from the client after Razorpay payment completion.
 * Verifies the payment signature and returns order details.
 * 
 * The actual order confirmation happens via the webhook (payment.captured),
 * but this endpoint provides immediate feedback to the user.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return apiError('VALIDATION_ERROR', 'Missing payment verification fields', 400);
    }

    // Verify the signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return apiError('CONFIG_ERROR', 'Payment configuration error', 500);
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(razorpay_signature),
      Buffer.from(generatedSignature)
    );

    if (!isValid) {
      return apiError('PAYMENT_VERIFICATION_FAILED', 'Payment verification failed', 400);
    }

    // Find the order (may already be confirmed via webhook)
    const order = await prisma.order.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return apiError('ORDER_NOT_FOUND', 'Order not found', 404);
    }

    // If webhook hasn't fired yet, update the payment ID
    if (order.paymentStatus === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayPaymentId: razorpay_payment_id },
      });
    }

    return apiSuccess({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus === 'PAID' ? 'PAID' : 'PROCESSING',
    });
  } catch (error) {
    console.error('[CHECKOUT_VERIFY_ERROR]', error);
    return apiError('VERIFICATION_FAILED', 'Failed to verify payment', 500);
  }
}
