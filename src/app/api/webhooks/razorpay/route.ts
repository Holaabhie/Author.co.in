import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { confirmStock } from '@/lib/stock';

/**
 * POST /api/webhooks/razorpay
 * 
 * Razorpay webhook handler with:
 * - crypto.timingSafeEqual signature verification
 * - Idempotency via webhook_log table
 * - Auto-capture mode (payment.captured is the definitive event)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // ─── Signature Verification ─────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // ─── Parse Event ────────────────────────────────────────────
    const event = JSON.parse(body);
    const eventType = event.event;
    const eventId = event.payload?.payment?.entity?.id ?? event.payload?.order?.entity?.id ?? `evt_${Date.now()}`;

    // ─── Idempotency Check ──────────────────────────────────────
    const existing = await prisma.webhookLog.findUnique({
      where: { eventId },
    });

    if (existing) {
      // Already processed — return 200 to acknowledge
      return NextResponse.json({ status: 'already_processed' });
    }

    // Log the webhook
    const log = await prisma.webhookLog.create({
      data: {
        provider: 'razorpay',
        eventType,
        eventId,
        payload: event,
        status: 'PROCESSING',
      },
    });

    // ─── Event Handlers ─────────────────────────────────────────
    try {
      switch (eventType) {
        case 'payment.captured': {
          await handlePaymentCaptured(event);
          break;
        }
        case 'payment.failed': {
          await handlePaymentFailed(event);
          break;
        }
        case 'order.paid': {
          // Alternative event — handled same as payment.captured
          await handleOrderPaid(event);
          break;
        }
        default: {
          console.info(`[WEBHOOK] Unhandled event type: ${eventType}`);
        }
      }

      // Mark as processed
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } catch (processingError) {
      // Mark as failed but still return 200 to prevent retries
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
        },
      });
      console.error('[WEBHOOK] Processing error:', processingError);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[WEBHOOK] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── Event Handlers ───────────────────────────────────────────────

async function handlePaymentCaptured(event: Record<string, unknown>) {
  const payment = (event.payload as Record<string, Record<string, unknown>>)?.payment?.entity as Record<string, unknown>;
  if (!payment) return;

  const razorpayOrderId = payment.order_id as string;
  const razorpayPaymentId = payment.id as string;

  // Find the order by Razorpay order ID
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
    include: {
      items: {
        select: { variantId: true, quantity: true },
      },
    },
  });

  if (!order) {
    console.error(`[WEBHOOK] Order not found for razorpayOrderId: ${razorpayOrderId}`);
    return;
  }

  // Update order to CONFIRMED + PAID
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        razorpayPaymentId,
      },
    });

    // Add status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        note: `Payment captured: ${razorpayPaymentId}`,
      },
    });

    // Confirm stock reservations (remove from reservedStock)
    for (const item of order.items) {
      if (item.variantId) {
        await confirmStock(item.variantId, item.quantity);
      }
    }

    // Clear the user's cart
    await tx.cartItem.deleteMany({
      where: { userId: order.userId },
    });
  });

  console.info(`[WEBHOOK] Order ${order.orderNumber} confirmed — payment ${razorpayPaymentId}`);
}

async function handlePaymentFailed(event: Record<string, unknown>) {
  const payment = (event.payload as Record<string, Record<string, unknown>>)?.payment?.entity as Record<string, unknown>;
  if (!payment) return;

  const razorpayOrderId = payment.order_id as string;

  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
  });

  if (!order) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: `Payment failed: ${(payment.error_description as string) ?? 'Unknown error'}`,
      },
    });
  });

  console.info(`[WEBHOOK] Payment failed for order ${order.orderNumber}`);
}

async function handleOrderPaid(event: Record<string, unknown>) {
  const orderEntity = (event.payload as Record<string, Record<string, unknown>>)?.order?.entity as Record<string, unknown>;
  if (!orderEntity) return;

  const razorpayOrderId = orderEntity.id as string;
  
  // Check if already handled by payment.captured
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
  });

  if (!order) return;
  if (order.paymentStatus === 'PAID') return; // Already processed

  // Same logic as payment.captured
  const fakeEvent = {
    payload: {
      payment: {
        entity: {
          order_id: razorpayOrderId,
          id: `fallback_${Date.now()}`,
        },
      },
    },
  };
  await handlePaymentCaptured(fakeEvent);
}
