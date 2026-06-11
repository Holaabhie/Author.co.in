"use client";

// Issue 6 fix: Recharts must be in "use client" components.
// This file exports all chart wrappers used across admin pages.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

// ─── Revenue Line Chart ────────────────────────────────────────────
interface RevenueChartProps {
  data: { date: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatRevenue = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C8BFB6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C8BFB6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#6B6B6B", fontSize: 10 }}
          stroke="rgba(255,255,255,0.05)"
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => formatRevenue(v / 100)}
          tick={{ fill: "#6B6B6B", fontSize: 10 }}
          stroke="rgba(255,255,255,0.05)"
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#141414",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#F5F0EB",
          }}
          formatter={(value: any, name: any) => {
            if (name === "revenue") return [`₹${(value / 100).toLocaleString("en-IN")}`, "Revenue"];
            return [value, "Orders"];
          }}
          labelFormatter={(label) => formatDate(label)}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#C8BFB6"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Orders Status Donut Chart ─────────────────────────────────────
interface StatusChartProps {
  data: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#EAB308",
  CONFIRMED: "#3B82F6",
  PACKED: "#A855F7",
  SHIPPED: "#06B6D4",
  OUT_FOR_DELIVERY: "#6366F1",
  DELIVERED: "#22C55E",
  CANCELLED: "#EF4444",
  REFUNDED: "#F97316",
};

export function OrderStatusChart({ data }: StatusChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
    fill: STATUS_COLORS[name] || "#6B6B6B",
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-author-mid text-xs">
        No order data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#141414",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#F5F0EB",
          }}
          formatter={(value: any, name: any) => [value, name.replace(/_/g, " ")]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Customer Growth Chart ─────────────────────────────────────────
interface GrowthChartProps {
  data: { date: string; customers: number }[];
}

export function CustomerGrowthChart({ data }: GrowthChartProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "#6B6B6B", fontSize: 10 }}
          stroke="rgba(255,255,255,0.05)"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#6B6B6B", fontSize: 10 }}
          stroke="rgba(255,255,255,0.05)"
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#141414",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#F5F0EB",
          }}
          formatter={(value: any) => [value, "New Customers"]}
          labelFormatter={(label) => formatDate(label)}
        />
        <Bar dataKey="customers" fill="#C8BFB6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
