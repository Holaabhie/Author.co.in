import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// ─── GET /api/admin/customers ──────────────────────────────────────
// List customers with search, pagination, order count and total spent.
// Supports CSV export when ?format=csv (max 10,000 rows with date range filtering)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const search = searchParams.get('search')?.trim() ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    const isBlocked = searchParams.get('isBlocked');
    const showDeleted = searchParams.get('showDeleted') === 'true';

    // Build where clause
    const where: Record<string, unknown> = {};

    // Exclude archived customers by default (correction #11)
    if (!showDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    if (isBlocked !== null && isBlocked !== undefined) {
      where.isBlocked = isBlocked === 'true';
    }

    // ─── CSV EXPORT ────────────────────────────────────────────
    if (format === 'csv') {
      const MAX_CSV_ROWS = 10_000;

      const customers = await prisma.user.findMany({
        where,
        take: MAX_CSV_ROWS,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isBlocked: true,
          createdAt: true,
          orders: {
            select: { total: true },
          },
        },
      });

      // Build CSV content
      const csvHeaders = ['ID', 'Name', 'Email', 'Phone', 'Blocked', 'Order Count', 'Total Spent (Paise)', 'Joined'];
      const csvRows = customers.map((c) => {
        const orderCount = c.orders.length;
        const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
        return [
          c.id,
          `"${(c.name ?? '').replace(/"/g, '""')}"`,
          c.email,
          c.phone ?? '',
          c.isBlocked ? 'Yes' : 'No',
          orderCount,
          totalSpent,
          c.createdAt.toISOString(),
        ].join(',');
      });

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      // Stream as CSV response
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="customers_export_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // ─── JSON PAGINATED RESPONSE ───────────────────────────────
    const { page, pageSize, skip } = parsePagination(searchParams);
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const allowedSortFields = ['createdAt', 'name', 'email'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [safeSortBy]: sortOrder },
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
          _count: {
            select: { orders: true, reviews: true },
          },
          orders: {
            select: { total: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Compute totalSpent per customer
    const customersWithStats = customers.map((c) => {
      const totalSpent = c.orders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        image: c.image,
        isBlocked: c.isBlocked,
        internalNotes: c.internalNotes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        orderCount: c._count.orders,
        reviewCount: c._count.reviews,
        totalSpent,
      };
    });

    return apiSuccess(customersWithStats, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[ADMIN_CUSTOMERS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch customers', 500);
  }
}
