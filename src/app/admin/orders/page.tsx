"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface Order {
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const statuses = [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PACKED", label: "Packed" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "OUT_FOR_DELIVERY", label: "Out For Delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
  ];

  async function fetchOrders() {
    setLoading(true);
    try {
      const statusParam = status === "all" ? "" : `&status=${status}`;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/orders?page=${page}&pageSize=10${statusParam}${searchParam}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalOrders(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load orders");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Update order status inline
  async function handleStatusChange(orderId: string, newStatus: string) {
    const originalStatus = orders.find((o) => o.id === orderId)?.status;
    if (!originalStatus || originalStatus === newStatus) return;

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`/api/admin/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to update order status");
      }
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update order status");
      // Rollback UI update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: originalStatus } : o))
      );
    }
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
          Orders
        </h1>
        <p className="text-author-mid text-sm mt-1">
          {totalOrders} customer orders placed
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px gap-6">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setStatus(s.value);
              setPage(1);
            }}
            className={`pb-3 text-xs uppercase tracking-wider font-heading border-b-2 transition-colors whitespace-nowrap ${
              status === s.value
                ? "border-author-cream text-author-cream font-semibold"
                : "border-transparent text-author-mid hover:text-author-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders by Order Number (e.g. AUTH-00123)..."
          className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
        />
      </div>

      {/* Orders Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Orders Found</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              No orders found matching your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Order Number</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Items Count</th>
                  <th className="text-left p-4">Total Amount</th>
                  <th className="text-left p-4">Order Status</th>
                  <th className="text-left p-4">Payment</th>
                  <th className="text-left p-4">Order Date</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {orders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs font-semibold text-author-cream">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-author-white">
                          {order.user?.name || "Guest Checkout"}
                        </div>
                        <div className="text-[10px] text-author-mid">{order.user?.email}</div>
                      </td>
                      <td className="p-4 text-xs text-author-white font-medium">
                        {order._count.items} item(s)
                      </td>
                      <td className="p-4 font-semibold text-author-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`text-[10px] px-2 py-0.5 rounded font-heading uppercase tracking-wider font-semibold border bg-author-charcoal border-white/10 text-author-white focus:outline-none`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PACKED">Packed</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
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
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5 text-xs text-author-mid bg-author-black/10">
            <div>
              Showing page {page} of {totalPages} ({totalOrders} orders)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4 text-author-white" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4 text-author-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
