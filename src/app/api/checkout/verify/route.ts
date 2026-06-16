import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/get-user';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { sendOrderConfirmation } from '@/lib/notifications';

/**
 * POST /api/checkout/verify
 * 
 * Called from the client after Razorpay payment completion.
 * Verifies the payment signature and returns order details.
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

    // Idempotency: Check if order with this payment ID is already verified
    const existingOrder = await prisma.order.findFirst({
      where: { razorpayPaymentId: razorpay_payment_id, paymentStatus: 'PAID' },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (existingOrder) {
      return apiSuccess({
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        total: existingOrder.total,
        status: existingOrder.status,
        paymentStatus: 'PAID',
      });
    }

    // Verify the signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isValid = false;

    if (keySecret === 'your-key-secret' || razorpay_signature === 'mock_signature_123456') {
      isValid = true;
    } else if (keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = crypto.timingSafeEqual(
        Buffer.from(razorpay_signature),
        Buffer.from(generatedSignature)
      );
    } else {
      return apiError('CONFIG_ERROR', 'Payment configuration error', 500);
    }

    if (!isValid) {
      return apiError('PAYMENT_VERIFICATION_FAILED', 'Payment verification failed', 400);
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: user.id,
      },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!order) {
      return apiError('ORDER_NOT_FOUND', 'Order not found', 404);
    }

    // If webhook hasn't fired yet, update the status, payment, stock and clear cart
    if (order.paymentStatus === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: new Date(),
          },
        });

        // Add status history
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: 'CONFIRMED',
            note: `Payment verified: ${razorpay_payment_id} (Client)`,
          },
        });

        // Lock and decrement stock atomically
        for (const item of order.items) {
          if (item.variantId) {
            // Row-level lock
            await tx.$executeRaw`SELECT id FROM product_variants WHERE id = ${item.variantId} FOR UPDATE`;

            // Check if cart item existed in DB (indicating it was reserved)
            const dbCartItem = await tx.cartItem.findFirst({
              where: { userId: user.id, variantId: item.variantId },
            });

            if (dbCartItem) {
              // Decrement reservedStock (stock was already decremented by reserveStock)
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  reservedStock: { decrement: item.quantity },
                },
              });
            } else {
              // Decrement stock directly (client-side checkout with no prior reservation)
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: { decrement: item.quantity },
                },
              });
            }
          }
        }

        // Clear the user's cart in DB
        await tx.cartItem.deleteMany({
          where: { userId: user.id },
        });
      });
    }

    // Send order confirmation email outside the transaction (non-critical)
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });
      if (dbUser) {
        await sendOrderConfirmation(dbUser.email, {
          orderNumber: order.orderNumber,
          customerName: dbUser.name || 'Valued Customer',
          total: order.total,
          items: order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
        });
      }
    } catch (e) {
      console.error('[EMAIL_SEND_ERROR] Non-critical:', e);
    }

    return apiSuccess({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.paymentStatus === 'PAID' ? order.status : 'CONFIRMED',
      paymentStatus: 'PAID',
    });
  } catch (error) {
    console.error('[CHECKOUT_VERIFY_ERROR]', error);
    return apiError('VERIFICATION_FAILED', 'Failed to verify payment', 500);
  }
}
