import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
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
