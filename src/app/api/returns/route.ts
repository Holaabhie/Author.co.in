import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { getCurrentUser } from '@/lib/auth/get-user';
import { apiSuccess, apiError, apiUnauthorized, parsePagination, paginationMeta } from '@/lib/api-helpers';

/**
 * GET /api/returns
 * List return requests — for admin (all) or for user (own)
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const isAdmin = sp.get('admin') === 'true';

  if (isAdmin) {
    const admin = await requireRole([
      'SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'VIEWER',
    ]);
    if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

    const { page, pageSize, skip } = parsePagination(sp);
    const status = sp.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { name: true, email: true } },
          items: {
            include: {
              orderItem: { select: { productName: true, size: true, color: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.returnRequest.count({ where }),
    ]);

    return apiSuccess(returns, paginationMeta(page, pageSize, total));
  }

  // User view — own returns
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();

  const returns = await prisma.returnRequest.findMany({
    where: { userId: user.id },
    include: {
      order: { select: { orderNumber: true } },
      items: {
        include: {
          orderItem: { select: { productName: true, size: true, color: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(returns);
}

/**
 * POST /api/returns
 * Create a return request (user-facing)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiUnauthorized();

    const { orderId, reason, note, items } = await request.json();

    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return apiError('VALIDATION_ERROR', 'orderId, reason, and items are required', 400);
    }

    // Verify the order belongs to the user and is delivered
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      select: { status: true, createdAt: true },
    });

    if (!order) {
      return apiError('NOT_FOUND', 'Order not found', 404);
    }

    if (order.status !== 'DELIVERED') {
      return apiError('INVALID_STATUS', 'Returns can only be filed for delivered orders', 400);
    }

    // Check 7-day return window
    const daysSinceOrder = Math.floor(
      (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceOrder > 7) {
      return apiError('RETURN_WINDOW_EXPIRED', 'Return window (7 days) has expired', 400);
    }

    // Check for existing return request
    const existing = await prisma.returnRequest.findFirst({
      where: { orderId, userId: user.id, status: { not: 'REJECTED' } },
    });
    if (existing) {
      return apiError('DUPLICATE', 'A return request already exists for this order', 409);
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        userId: user.id,
        reason,
        note: note || null,
        status: 'PENDING',
        items: {
          create: items.map((item: { orderItemId: string; quantity: number; reason?: string }) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return apiSuccess(returnRequest);
  } catch (error) {
    console.error('[RETURN_CREATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create return request', 500);
  }
}

/**
 * PUT /api/returns
 * Update return request status (admin only)
 */
export async function PUT(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { id, status, adminNote, refundAmount } = await request.json();

    if (!id || !status) {
      return apiError('VALIDATION_ERROR', 'id and status are required', 400);
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return apiError('VALIDATION_ERROR', `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const returnRequest = await prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || undefined,
        refundAmount: refundAmount || undefined,
      },
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { name: true, email: true } },
        items: true,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'return.update_status',
      entity: 'ReturnRequest',
      entityId: id,
      payload: { status, refundAmount },
    });

    return apiSuccess(returnRequest);
  } catch (error) {
    console.error('[RETURN_UPDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update return request', 500);
  }
}
