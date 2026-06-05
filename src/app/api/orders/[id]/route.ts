import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/[id]
 * Fetch customer order detail (authenticated and verified ownership)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              select: { size: true, color: true, colorHex: true },
            },
          },
        },
        address: true,
        billingAddress: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, invoiceUrl: true },
        },
        returnRequests: {
          include: {
            items: {
              include: {
                orderItem: {
                  select: { productName: true, size: true, color: true },
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

    // Verify ownership
    if (order.userId !== user.id) {
      return apiError('FORBIDDEN', 'You do not have permission to view this order', 403);
    }

    return apiSuccess(order);
  } catch (error) {
    console.error('[ORDER_DETAIL_GET_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch order details', 500);
  }
}
