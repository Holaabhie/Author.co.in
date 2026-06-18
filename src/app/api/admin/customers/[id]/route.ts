import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// ─── GET /api/admin/customers/[id] ─────────────────────────────────
// Customer detail with full order history
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        isBlocked: true,
        internalNotes: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            subtotal: true,
            discount: true,
            total: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        },
        returnRequests: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            reason: true,
            refundAmount: true,
            createdAt: true,
            order: { select: { orderNumber: true } },
          },
        },
        _count: {
          select: { orders: true, reviews: true, wishlistItems: true },
        },
      },
    });

    if (!customer) {
      return apiError('NOT_FOUND', 'Customer not found', 404);
    }

    // Compute total spent
    const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);

    return apiSuccess({
      ...customer,
      totalSpent,
    });
  } catch (error) {
    console.error('[ADMIN_CUSTOMER_DETAIL]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch customer details', 500);
  }
}

// ─── DELETE /api/admin/customers/[id] ──────────────────────────────
// Soft delete (archive) a customer. No Supabase Auth deletion.
// Blocks: SUPER_ADMIN users, self-deletion.
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;

    // Block self-deletion (correction #8)
    if (id === admin.id) {
      return apiError('FORBIDDEN', 'You cannot archive your own account', 403);
    }

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        deletedAt: true,
        userRoles: {
          select: { role: true },
        },
        orders: {
          where: { paymentStatus: 'PAID' },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!customer) {
      return apiError('NOT_FOUND', 'Customer not found', 404);
    }

    // Block deletion of SUPER_ADMIN (correction #8)
    const isSuperAdmin = customer.userRoles.some((r) => r.role === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      return apiError('FORBIDDEN', 'Cannot archive a SUPER_ADMIN user', 403);
    }

    if (customer.deletedAt) {
      return apiError('ALREADY_DELETED', 'Customer is already archived', 400);
    }

    const hasPaidOrders = customer.orders.length > 0;

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: admin.id,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: hasPaidOrders ? 'customer.archive' : 'customer.soft_delete',
      entity: 'User',
      entityId: id,
      payload: {
        customerName: customer.name,
        customerEmail: customer.email,
        hasPaidOrders,
      },
    });

    return apiSuccess({
      archived: true,
      customerEmail: customer.email,
      hasPaidOrders,
    });
  } catch (error) {
    console.error('[ADMIN_CUSTOMER_DELETE]', error);
    return apiError('INTERNAL_ERROR', 'Failed to archive customer', 500);
  }
}
