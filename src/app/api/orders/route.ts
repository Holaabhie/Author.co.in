import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

/**
 * GET /api/orders
 * Fetch authenticated customer's order history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    console.log('[ORDERS_API] getCurrentUser result:', user ? { id: user.id, email: user.email } : null);

    if (!user) {
      console.warn('[ORDERS_API] No authenticated user — returning 401');
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: { select: { items: true } },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
          take: 2, // Take first 2 items to show a quick summary
        },
      },
    });

    console.log('[ORDERS_API] Found', orders.length, 'orders for user', user.id);
    return apiSuccess(orders);
  } catch (error: any) {
    console.error('[ORDERS_GET_ERROR]', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
    });
    return apiError('INTERNAL_ERROR', 'Failed to fetch your orders', 500);
  }
}
