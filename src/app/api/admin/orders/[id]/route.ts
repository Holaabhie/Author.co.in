import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/admin/orders/[id] ────────────────────────────────────
// Full order detail with items, user info, address, status history, payment info
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        },
        items: {
          include: {
            product: {
              select: { id: true, slug: true, isActive: true },
            },
            variant: {
              select: { id: true, size: true, color: true, colorHex: true },
            },
          },
        },
        address: true,
        billingAddress: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
        invoice: true,
        returnRequests: {
          include: {
            items: {
              include: {
                orderItem: {
                  select: { id: true, productName: true, quantity: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return apiError('NOT_FOUND', 'Order not found', 404);
    }

    // Compute payment info summary
    const paymentInfo = {
      paymentStatus: order.paymentStatus,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      tax: order.tax,
      total: order.total,
    };

    return apiSuccess({
      ...order,
      paymentInfo,
    });
  } catch (error) {
    console.error('[ADMIN_ORDER_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch order details', 500);
  }
}

// ─── PUT /api/admin/orders/[id] ────────────────────────────────────
// Update order: tracking number, courier name, admin notes
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'OPERATIONS']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;
    const body = await request.json();

    const { trackingNumber, courierName, adminNotes } = body;

    // Check order exists
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Order not found', 404);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber?.trim() ?? null }),
        ...(courierName !== undefined && { courierName: courierName?.trim() ?? null }),
        ...(adminNotes !== undefined && { adminNotes: adminNotes?.trim() ?? null }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    // Revalidate
    revalidateContent('product');

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'order.update_details',
      entity: 'Order',
      entityId: id,
      payload: {
        orderNumber: existing.orderNumber,
        updatedFields: Object.keys(body),
      },
    });

    return apiSuccess(updatedOrder);
  } catch (error) {
    console.error('[ADMIN_ORDER_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update order', 500);
  }
}
