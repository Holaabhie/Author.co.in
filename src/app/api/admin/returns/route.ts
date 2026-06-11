import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// ─── GET /api/admin/returns ────────────────────────────────────────
// List all return requests with order info, customer, items
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);
    const status = searchParams.get('status') ?? undefined;
    const search = searchParams.get('search')?.trim() ?? '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              orderItem: {
                select: {
                  productName: true,
                  quantity: true,
                  unitPrice: true,
                  imageUrl: true,
                  size: true,
                  color: true,
                },
              },
            },
          },
        },
      }),
      prisma.returnRequest.count({ where }),
    ]);

    return apiSuccess(returns, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[ADMIN_RETURNS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch returns', 500);
  }
}

// ─── PUT /api/admin/returns ────────────────────────────────────────
// Approve or reject a return request
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'OPERATIONS']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { returnId, status, adminNote, refundAmount } = body;

    if (!returnId) {
      return apiError('VALIDATION_ERROR', 'returnId is required', 400);
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'];
    if (!status || !validStatuses.includes(status)) {
      return apiError('VALIDATION_ERROR', `status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const existing = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { order: { select: { orderNumber: true } } },
    });

    if (!existing) {
      return apiError('NOT_FOUND', 'Return request not found', 404);
    }

    const updated = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status,
        ...(adminNote !== undefined && { adminNote: adminNote?.trim() ?? null }),
        ...(refundAmount !== undefined && { refundAmount }),
      },
      include: {
        order: { select: { id: true, orderNumber: true } },
        user: { select: { name: true, email: true } },
        items: {
          include: {
            orderItem: {
              select: { productName: true, quantity: true },
            },
          },
        },
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: `return.${status.toLowerCase()}`,
      entity: 'ReturnRequest',
      entityId: returnId,
      payload: {
        orderNumber: existing.order.orderNumber,
        previousStatus: existing.status,
        newStatus: status,
        adminNote,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('[ADMIN_RETURNS_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update return request', 500);
  }
}
