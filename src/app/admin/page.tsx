"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

interface TopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
  _count: {
    items: number;
  };
}

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  conversionRate: number;
  orderStatusBreakdown: Record<string, number>;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
          setIsFallback(false);
        } else {
          throw new Error(result.message || "Failed to fetch analytics");
        }
      } catch (err: any) {
        console.error(err);
        setIsFallback(true);
        // Load mock data for fallback UI
        setData({
          totalRevenue: 4528400,
          revenueGrowth: 12.5,
          totalOrders: 156,
          orderGrowth: 8.2,
          averageOrderValue: 29028,
          totalCustomers: 1247,
          newCustomers: 45,
          conversionRate: 3.2,
          orderStatusBreakdown: { PENDING: 12, CONFIRMED: 45, DELIVERED: 99 },
          topProducts: [
            { productId: "p1", productName: "Signature Cotton Tee", unitsSold: 84, revenue: 1671600 },
            { productId: "p2", productName: "Heavyweight Box Hoodie", unitsSold: 52, revenue: 2074800 },
            { productId: "p3", productName: "Tailored Lounge Pants", unitsSold: 35, revenue: 1046500 },
          ],
          recentOrders: [
            {
              id: "ord-1",
              orderNumber: "AUTH-00214",
              status: "CONFIRMED",
              paymentStatus: "PAID",
              total: 899800,
              createdAt: new Date().toISOString(),
              user: { name: "Aarav Sharma", email: "aarav@example.com" },
              _count: { items: 2 }
            },
            {
              id: "ord-2",
              orderNumber: "AUTH-00213",
              status: "DELIVERED",
              paymentStatus: "PAID",
              total: 449900,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              user: { name: "Riya Patel", email: "riya@example.com" },
              _count: { items: 1 }
            },
            {
              id: "ord-3",
              orderNumber: "AUTH-00212",
              status: "PENDING",
              paymentStatus: "PENDING",
              total: 299900,
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              user: { name: "Kabir Mehta", email: "kabir@example.com" },
              _count: { items: 1 }
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [period]);

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/10",
      CONFIRMED: "bg-blue-500/20 text-blue-400 border border-blue-500/10",
      PACKED: "bg-purple-500/20 text-purple-400 border border-purple-500/10",
      SHIPPED: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/10",
      OUT_FOR_DELIVERY: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/10",
      DELIVERED: "bg-green-500/20 text-green-400 border border-green-500/10",
      CANCELLED: "bg-red-500/20 text-red-400 border border-red-500/10",
      REFUNDED: "bg-orange-500/20 text-orange-400 border border-orange-500/10",
    };
    return colors[status] || "bg-white/10 text-author-mid";
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 border border-white/5 rounded p-6 space-y-4" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-96 bg-white/5 border border-white/5 rounded" />
          <div className="h-96 bg-white/5 border border-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(data.totalRevenue),
      change: `${data.revenueGrowth >= 0 ? "+" : ""}${data.revenueGrowth}%`,
      trend: data.revenueGrowth >= 0 ? "up" : "down",
      icon: IndianRupee,
      color: "bg-author-cream/10 text-author-cream border border-author-cream/20",
    },
    {
      label: "Total Orders",
      value: data.totalOrders.toLocaleString(),
      change: `${data.orderGrowth >= 0 ? "+" : ""}${data.orderGrowth}%`,
      trend: data.orderGrowth >= 0 ? "up" : "down",
      icon: ShoppingCart,
      color: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    {
      label: "Average Order Value",
      value: formatPrice(data.averageOrderValue),
      change: "Stable",
      trend: "up",
      icon: BarChart3,
      color: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    },
    {
      label: "Total Customers",
      value: data.totalCustomers.toLocaleString(),
      change: `+${data.newCustomers} new`,
      trend: "up",
      icon: Users,
      color: "bg-green-500/10 text-green-400 border border-green-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {isFallback && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-3 text-sm text-yellow-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Using sample data. Set up and seed the database to view real-time shop metrics.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Dashboard
          </h1>
          <p className="text-author-mid text-sm mt-1">
            Performance overview for the brand Author
          </p>
        </div>
        <div className="flex bg-author-charcoal border border-white/10 p-1 rounded-lg self-start sm:self-auto">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-heading uppercase tracking-wider rounded-md transition-colors ${
                period === p
                  ? "bg-author-cream text-author-black font-semibold"
                  : "text-author-mid hover:text-author-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 rounded-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-heading ${
                  stat.trend === "up" ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="font-heading text-2xl font-bold text-author-white">{stat.value}</p>
            <p className="text-xs text-author-mid mt-1 uppercase tracking-wider">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs text-author-cream hover:underline flex items-center gap-1 font-heading uppercase tracking-wider"
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5">
                    <th className="text-left p-4">Order#</th>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Total</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Payment</th>
                    <th className="text-left p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-author-mid text-sm">
                        No orders recorded in this period
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-mono text-xs font-semibold">
                          <Link href={`/admin/orders/${order.id}`} className="text-author-cream hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="text-xs font-medium text-author-white">
                            {order.user?.name || "Guest User"}
                          </div>
                          <div className="text-[10px] text-author-mid">{order.user?.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-author-white">
                          {formatPrice(order.total)}
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider ${getStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-author-mid">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="glass p-6 rounded-lg h-64 flex flex-col items-center justify-center border border-white/5">
            <BarChart3 className="w-10 h-10 text-author-mid mb-2 opacity-50" />
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
              Revenue Analytics Trend
            </h3>
            <p className="text-xs text-author-mid mt-1 uppercase tracking-wider">
              Interactive Charts coming soon
            </p>
          </div>
        </div>

        {/* Right Sidebar - Top Products & Low Stock Alerts */}
        <div className="space-y-6">
          {/* Top Products */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-4 mb-4">
              Top Selling Products
            </h2>
            <div className="space-y-4">
              {data.topProducts.length === 0 ? (
                <p className="text-xs text-author-mid text-center py-4">No product sales in this period</p>
              ) : (
                data.topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-heading text-sm font-bold text-author-cream w-4">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-author-white truncate max-w-[150px] uppercase tracking-wider text-[11px]">
                          {product.productName}
                        </p>
                        <p className="text-[10px] text-author-mid mt-0.5">{product.unitsSold} units sold</p>
                      </div>
                    </div>
                    <span className="font-semibold text-author-white">
                      {formatPrice(product.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversions Card */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-4 mb-4">
              Store Conversion
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-author-mid uppercase tracking-wider">Conversion Rate</span>
                <span className="text-lg font-heading font-bold text-author-cream">{data.conversionRate}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div
                  className="bg-author-cream h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.conversionRate * 10, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-author-mid uppercase tracking-wider">
                Ratio of purchases to total catalog views.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
