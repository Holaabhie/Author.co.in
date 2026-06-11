import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// ─── GET /api/admin/orders/export ──────────────────────────────────
// Export orders as CSV. Protected with requireRole (Issue 2).
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'OPERATIONS']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const MAX_EXPORT_ROWS = 10_000;

    const orders = await prisma.order.findMany({
      where,
      take: MAX_EXPORT_ROWS,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            size: true,
            color: true,
          },
        },
        address: {
          select: {
            fullName: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
      },
    });

    // Build CSV
    const csvHeaders = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Status',
      'Payment Status',
      'Subtotal (₹)',
      'Discount (₹)',
      'Shipping (₹)',
      'Tax (₹)',
      'Total (₹)',
      'Items',
      'Shipping Address',
      'Tracking Number',
      'Courier',
    ];

    const csvRows = orders.map((o) => {
      const itemsStr = o.items
        .map((i) => `${i.productName} x${i.quantity} (${i.size || '-'}/${i.color || '-'})`)
        .join('; ');

      const addressStr = o.address
        ? `${o.address.fullName}, ${o.address.line1}${o.address.line2 ? ', ' + o.address.line2 : ''}, ${o.address.city}, ${o.address.state} ${o.address.postalCode}`
        : '';

      return [
        o.orderNumber,
        o.createdAt.toISOString(),
        `"${(o.user?.name ?? '').replace(/"/g, '""')}"`,
        o.user?.email ?? '',
        o.user?.phone ?? '',
        o.status,
        o.paymentStatus,
        (o.subtotal / 100).toFixed(2),
        (o.discount / 100).toFixed(2),
        (o.shippingFee / 100).toFixed(2),
        (o.tax / 100).toFixed(2),
        (o.total / 100).toFixed(2),
        `"${itemsStr.replace(/"/g, '""')}"`,
        `"${addressStr.replace(/"/g, '""')}"`,
        o.trackingNumber ?? '',
        o.courierName ?? '',
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[ADMIN_ORDERS_EXPORT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to export orders', 500);
  }
}
