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
    if (!user) {
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

    return apiSuccess(orders);
  } catch (error) {
    console.error('[ORDERS_GET_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch your orders', 500);
  }
}
