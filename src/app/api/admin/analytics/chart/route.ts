import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// ─── GET /api/admin/analytics/chart ────────────────────────────────
// Daily revenue data for Recharts line chart.
// Returns array of { date, revenue, orders } for the period.
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '30d';

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    // Get all paid orders in period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from },
        paymentStatus: 'PAID',
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by day
    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    // Pre-fill all days with zero
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { revenue: 0, orders: 0 });
    }

    // Fill in actual data
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
      existing.revenue += order.total;
      existing.orders += 1;
      dailyMap.set(key, existing);
    }

    // Convert to array
    const chartData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    return apiSuccess(chartData);
  } catch (error) {
    console.error('[ADMIN_ANALYTICS_CHART]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch chart data', 500);
  }
}
