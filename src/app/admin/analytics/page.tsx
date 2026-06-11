"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  RevenueChart,
  OrderStatusChart,
  CustomerGrowthChart,
} from "@/components/admin/AdminCharts";

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
  topProducts: {
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
  }[];
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  useEffect(() => {
    async function fetchChart() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics/chart?period=${period}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setChartData(json.data);
        }
      } catch (err) {
        console.error(err);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    }
    fetchChart();
  }, [period]);

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      label: "Revenue",
      value: formatPrice(data.totalRevenue),
      change: `${data.revenueGrowth >= 0 ? "+" : ""}${data.revenueGrowth}%`,
      trend: data.revenueGrowth >= 0,
      icon: IndianRupee,
      color: "bg-author-cream/10 text-author-cream border-author-cream/20",
    },
    {
      label: "Orders",
      value: data.totalOrders.toLocaleString(),
      change: `${data.orderGrowth >= 0 ? "+" : ""}${data.orderGrowth}%`,
      trend: data.orderGrowth >= 0,
      icon: ShoppingCart,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      label: "Avg. Order Value",
      value: formatPrice(data.averageOrderValue),
      change: "—",
      trend: true,
      icon: BarChart3,
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      label: "Customers",
      value: data.totalCustomers.toLocaleString(),
      change: `+${data.newCustomers} new`,
      trend: true,
      icon: Users,
      color: "bg-green-500/10 text-green-400 border-green-500/20",
    },
  ];

  // Generate mock customer growth data from chart data
  const customerGrowthData = chartData
    .filter((_, i) => i % (period === "7d" ? 1 : period === "90d" ? 7 : 3) === 0)
    .map((d) => ({
      date: d.date,
      customers: Math.max(1, Math.floor(d.orders * 0.7)),
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Analytics
          </h1>
          <p className="text-author-mid text-sm mt-1">Performance insights for Author Co</p>
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
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg border ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-heading flex items-center gap-1 ${
                card.trend ? "text-green-400" : "text-red-400"
              }`}>
                {card.trend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.change}
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-author-white">{card.value}</p>
            <p className="text-xs text-author-mid mt-1 uppercase tracking-wider">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
              Revenue Over Time
            </h2>
          </div>
          <div className="p-4">
            {chartLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-author-cream animate-spin" />
              </div>
            ) : (
              <RevenueChart data={chartData} />
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="glass rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
              Orders by Status
            </h2>
          </div>
          <div className="p-4 flex items-center">
            <div className="flex-1">
              <OrderStatusChart data={data.orderStatusBreakdown} />
            </div>
            <div className="flex-1 space-y-2">
              {Object.entries(data.orderStatusBreakdown).map(([status, count]) => {
                const statusColors: Record<string, string> = {
                  PENDING: "bg-yellow-500",
                  CONFIRMED: "bg-blue-500",
                  PACKED: "bg-purple-500",
                  SHIPPED: "bg-cyan-500",
                  DELIVERED: "bg-green-500",
                  CANCELLED: "bg-red-500",
                };
                return (
                  <div key={status} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status] || "bg-gray-500"}`} />
                    <span className="text-author-mid flex-1">{status.replace(/_/g, " ")}</span>
                    <span className="text-author-white font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="glass rounded-lg overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
              Customer Growth
            </h2>
          </div>
          <div className="p-4">
            <CustomerGrowthChart data={customerGrowthData} />
          </div>
        </div>

        {/* Conversion Rate Card — Issue 3: (totalOrders / totalCustomers) × 100 */}
        <div className="glass rounded-lg p-6">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white mb-6">
            Conversion Metrics
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-author-mid uppercase tracking-wider">Conversion Rate</span>
                <span className="text-3xl font-heading font-bold text-author-cream">{data.conversionRate}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(data.conversionRate * 10, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-author-cream h-2 rounded-full"
                />
              </div>
              <p className="text-[10px] text-author-mid mt-2 uppercase tracking-wider">
                Orders ÷ Total Customers × 100
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-2xl font-heading font-bold text-author-white">{data.totalOrders}</p>
                <p className="text-[10px] text-author-mid uppercase tracking-wider">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-bold text-author-white">{data.totalCustomers}</p>
                <p className="text-[10px] text-author-mid uppercase tracking-wider">Total Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="glass rounded-lg overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white">
            Top Selling Products
          </h2>
        </div>
        {data.topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-author-mid">No sales data for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5">
                  <th className="text-left p-4">#</th>
                  <th className="text-left p-4">Product</th>
                  <th className="text-right p-4">Units Sold</th>
                  <th className="text-right p-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, i) => (
                  <motion.tr
                    key={product.productId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-heading font-bold text-author-cream text-lg">{i + 1}</td>
                    <td className="p-4 text-xs font-semibold text-author-white uppercase tracking-wider">{product.productName}</td>
                    <td className="p-4 text-right text-xs text-author-mid">{product.unitsSold}</td>
                    <td className="p-4 text-right text-xs text-author-white font-semibold">{formatPrice(product.revenue)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
