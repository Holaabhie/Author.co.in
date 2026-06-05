"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Percent,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Loader2,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

interface TopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
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
}

export default function AdminAnalyticsPage() {
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
        // Load mock data
        setData({
          totalRevenue: 6428400,
          revenueGrowth: 14.2,
          totalOrders: 234,
          orderGrowth: 9.5,
          averageOrderValue: 27471,
          totalCustomers: 1548,
          newCustomers: 72,
          conversionRate: 4.1,
          orderStatusBreakdown: {
            PENDING: 15,
            CONFIRMED: 62,
            PACKED: 24,
            SHIPPED: 45,
            DELIVERED: 78,
            CANCELLED: 10,
          },
          topProducts: [
            { productId: "p1", productName: "Signature Cotton Tee", unitsSold: 120, revenue: 239880 },
            { productId: "p2", productName: "Heavyweight Box Hoodie", unitsSold: 85, revenue: 339915 },
            { productId: "p3", productName: "Tailored Lounge Pants", unitsSold: 64, revenue: 191936 },
            { productId: "p4", productName: "Author Oversized Jacket", unitsSold: 42, revenue: 209958 },
            { productId: "p5", productName: "Classic Ribbed Beanie", unitsSold: 30, revenue: 29970 },
          ],
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

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 border border-white/5 rounded p-6" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white/5 border border-white/5 rounded" />
          <div className="h-96 bg-white/5 border border-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Compute status chart variables
  const statusValues = Object.entries(data.orderStatusBreakdown);
  const maxStatusCount = Math.max(...statusValues.map(([_, count]) => count), 1);

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
      label: "Store Conversion Rate",
      value: `${data.conversionRate}%`,
      change: "Active",
      trend: "up",
      icon: Percent,
      color: "bg-green-500/10 text-green-400 border border-green-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {isFallback && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-3 text-sm text-yellow-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>Using sample data. Set up database connectivity to see live stats.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Analytics
          </h1>
          <p className="text-author-mid text-sm mt-1">
            Brand performance statistics and order distributions
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown Chart */}
        <div className="glass p-6 rounded-lg space-y-4">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
            Orders by Status
          </h2>
          {statusValues.length === 0 ? (
            <p className="text-xs text-author-mid text-center py-12">No orders recorded in this period</p>
          ) : (
            <div className="space-y-4 pt-2">
              {statusValues.map(([status, count]) => {
                const percent = Math.round((count / maxStatusCount) * 100);
                return (
                  <div key={status} className="space-y-1 text-xs">
                    <div className="flex justify-between font-heading tracking-wide uppercase text-[10px]">
                      <span className="text-author-white font-medium">{status}</span>
                      <span className="text-author-cream font-bold">{count} orders</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="bg-author-cream h-2 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Products List */}
        <div className="glass p-6 rounded-lg space-y-4">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
            Top 10 Selling Products
          </h2>
          <div className="divide-y divide-white/5">
            {data.topProducts.length === 0 ? (
              <p className="text-xs text-author-mid text-center py-12">No sales recorded</p>
            ) : (
              data.topProducts.map((product, index) => (
                <div key={product.productId} className="py-3 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-sm font-semibold text-author-cream">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-heading uppercase tracking-wide text-author-white font-medium text-[11px]">
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
      </div>
    </div>
  );
}
