import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

// ─── GET /api/admin/orders ─────────────────────────────────────────
// List orders with filters: status, dateRange, search by orderNumber
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status') ?? undefined;
    const paymentStatus = searchParams.get('paymentStatus') ?? undefined;
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'total', 'orderNumber', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              imageUrl: true,
              size: true,
              color: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return apiSuccess(orders, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[ADMIN_ORDERS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch orders', 500);
  }
}

// ─── PUT /api/admin/orders ─────────────────────────────────────────
// Update order status with history entry
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'OPERATIONS']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { orderId, status, note } = body;

    if (!orderId) {
      return apiError('VALIDATION_ERROR', 'orderId is required');
    }
    if (!status) {
      return apiError('VALIDATION_ERROR', 'status is required');
    }

    // Validate status enum
    const validStatuses = [
      'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED',
    ];
    if (!validStatuses.includes(status)) {
      return apiError('VALIDATION_ERROR', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Check order exists
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Order not found', 404);
    }

    // Update order and create status history entry in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note: note?.trim() ?? null,
          changedBy: admin.id,
        },
      });

      return order;
    });

    // Revalidate if needed
    revalidateContent('product');

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'order.update_status',
      entity: 'Order',
      entityId: orderId,
      payload: {
        orderNumber: existing.orderNumber,
        previousStatus: existing.status,
        newStatus: status,
        note,
      },
    });

    return apiSuccess(updatedOrder);
  } catch (error) {
    console.error('[ADMIN_ORDERS_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update order status', 500);
  }
}
