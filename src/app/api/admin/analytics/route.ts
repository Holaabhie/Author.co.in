import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';

// ─── Period helpers ────────────────────────────────────────────────

function getPeriodDays(period: string): number {
  switch (period) {
    case '7d':  return 7;
    case '30d': return 30;
    case '90d': return 90;
    default:    return 30;
  }
}

function getDateRange(period: string): { from: Date; to: Date } {
  const days = getPeriodDays(period);
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

// ─── GET /api/admin/analytics ──────────────────────────────────────
// Returns dashboard metrics: totalRevenue, totalOrders, averageOrderValue,
// totalCustomers, topProducts, recentOrders, conversionRate
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '30d';
    const { from, to } = getDateRange(period);

    // Run all queries in parallel for performance
    const [
      revenueResult,
      orderStats,
      previousPeriodRevenue,
      totalCustomers,
      newCustomers,
      topProducts,
      recentOrders,
      productViewCount,
      orderCountForConversion,
      statusBreakdown,
    ] = await Promise.all([
      // Total revenue (from PAID orders in period)
      prisma.order.aggregate({
        where: {
          createdAt: { gte: from, lte: to },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
        _count: true,
      }),

      // Total orders in period (all statuses)
      prisma.order.aggregate({
        where: {
          createdAt: { gte: from, lte: to },
        },
        _count: true,
        _sum: { total: true },
      }),

      // Previous period revenue for comparison
      (() => {
        const days = getPeriodDays(period);
        const prevFrom = new Date(from);
        prevFrom.setDate(prevFrom.getDate() - days);
        return prisma.order.aggregate({
          where: {
            createdAt: { gte: prevFrom, lt: from },
            paymentStatus: 'PAID',
          },
          _sum: { total: true },
          _count: true,
        });
      })(),

      // Total customers (all time)
      prisma.user.count(),

      // New customers in period
      prisma.user.count({
        where: { createdAt: { gte: from, lte: to } },
      }),

      // Top products by sales (in period)
      prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: {
            createdAt: { gte: from, lte: to },
            paymentStatus: 'PAID',
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),

      // Recent orders
      prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),

      // Product views in period (for conversion rate)
      prisma.productView.count({
        where: { viewedAt: { gte: from, lte: to } },
      }),

      // Orders placed in period (for conversion rate)
      prisma.order.count({
        where: { createdAt: { gte: from, lte: to } },
      }),

      // Order status breakdown
      prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: true,
      }),
    ]);

    // Compute metrics
    const totalRevenue = revenueResult._sum.total ?? 0;
    const totalOrders = orderStats._count ?? 0;
    const averageOrderValue = totalOrders > 0
      ? Math.round((orderStats._sum.total ?? 0) / totalOrders)
      : 0;

    const previousRevenue = previousPeriodRevenue._sum.total ?? 0;
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 10000) / 100
      : totalRevenue > 0 ? 100 : 0;

    const previousOrderCount = previousPeriodRevenue._count ?? 0;
    const orderGrowth = previousOrderCount > 0
      ? Math.round(((totalOrders - previousOrderCount) / previousOrderCount) * 10000) / 100
      : totalOrders > 0 ? 100 : 0;

    // Conversion rate: orders / product views
    const conversionRate = productViewCount > 0
      ? Math.round((orderCountForConversion / productViewCount) * 10000) / 100
      : 0;

    // Format top products
    const formattedTopProducts = topProducts.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      unitsSold: p._sum.quantity ?? 0,
      revenue: p._sum.totalPrice ?? 0,
    }));

    // Format status breakdown
    const formattedStatusBreakdown = statusBreakdown.reduce(
      (acc, s) => {
        acc[s.status] = s._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const dashboard = {
      period,
      dateRange: { from: from.toISOString(), to: to.toISOString() },

      // Core metrics
      totalRevenue,
      revenueGrowth,
      totalOrders,
      orderGrowth,
      averageOrderValue,
      totalCustomers,
      newCustomers,
      conversionRate,

      // Breakdown
      orderStatusBreakdown: formattedStatusBreakdown,
      topProducts: formattedTopProducts,
      recentOrders,
    };

    return apiSuccess(dashboard);
  } catch (error) {
    console.error('[ADMIN_ANALYTICS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch analytics', 500);
  }
}
