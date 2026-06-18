"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Download,
  RefreshCw,
  Trash2,
  Archive,
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
    phone: string | null;
  } | null;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl: string | null;
    size: string | null;
    color: string | null;
  }[];
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

  // Expandable details states
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const initialLoadTimeRef = useRef(new Date());
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; orderNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const archiveParam = showArchived ? `&showDeleted=true` : "";
      
      const [res, pendingRes] = await Promise.all([
        fetch(`/api/admin/orders?page=${page}&pageSize=10${statusParam}${searchParam}${archiveParam}`),
        fetch(`/api/admin/orders?pageSize=1&status=PENDING`),
      ]);
      
      const json = await res.json();
      const pendingJson = await pendingRes.json();

      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalOrders(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load orders");
      }

      if (pendingJson.success && pendingJson.meta) {
        setPendingCount(pendingJson.meta.total || 0);
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
  }, [page, status, showArchived]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Auto-poll every 15 seconds so new orders appear automatically
  const fetchRef = useRef(fetchOrders);
  fetchRef.current = fetchOrders;
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRef.current();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleRow = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

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
      /* success toast removed */
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
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
              Orders
            </h1>
            {pendingCount > 0 && (
              <span className="bg-author-cream text-author-black text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {pendingCount} PENDING
              </span>
            )}
          </div>
          <p className="text-author-mid text-sm mt-1">
            {totalOrders} customer orders placed
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => { fetchOrders(); /* success toast removed */ }}
            className="flex items-center gap-2 px-4 py-2 bg-author-charcoal border border-white/10 text-author-white text-xs font-heading uppercase tracking-wider rounded hover:bg-white/5 transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={async () => {
              try {
                const statusParam = status !== "all" ? `?status=${status}` : "";
                const res = await fetch(`/api/admin/orders/export${statusParam}`);
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                /* success toast removed */
              } catch (err) {
                toast.error("Failed to export orders");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-author-charcoal border border-white/10 text-author-white text-xs font-heading uppercase tracking-wider rounded hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
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
            className={`pb-3 text-xs uppercase tracking-wider font-heading border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              status === s.value
                ? "border-author-cream text-author-cream font-semibold"
                : "border-transparent text-author-mid hover:text-author-white"
            }`}
          >
            <span>{s.label}</span>
            {s.value === "PENDING" && pendingCount > 0 && (
              <span className="bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders by Order Number (e.g. AUTH-00123)..."
            className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
          />
        </div>
        <button
          onClick={() => { setShowArchived(!showArchived); setPage(1); }}
          className={`flex items-center gap-2 px-3 py-2.5 text-[10px] uppercase tracking-wider font-heading font-semibold rounded border transition-colors whitespace-nowrap ${
            showArchived
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-author-charcoal/50 border-white/10 text-author-mid hover:text-author-white"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          {showArchived ? "Showing Archived" : "Show Archived"}
        </button>
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
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Products</th>
                  <th className="text-left p-4">Total Amount</th>
                  <th className="text-left p-4">Order Status</th>
                  <th className="text-left p-4">Payment</th>
                  <th className="text-left p-4">Order Date</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {orders.map((order, i) => {
                    const isNew = new Date(order.createdAt) > initialLoadTimeRef.current;
                    const isExpanded = !!expandedOrderIds[order.id];
                    return (
                      <React.Fragment key={order.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                            isNew
                              ? "border-l-2 border-l-author-cream bg-author-cream/[0.03] animate-pulse"
                              : ""
                          } ${isExpanded ? "bg-white/[0.02]" : ""}`}
                          onClick={() => toggleRow(order.id)}
                        >
                          <td className="p-4 font-mono text-xs font-semibold text-author-cream">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="p-4">
                            <div className="text-xs font-semibold text-author-white">
                              {order.user?.name || "Guest Checkout"}
                            </div>
                            <div className="text-[10px] text-author-mid">{order.user?.email}</div>
                          </td>
                          <td className="p-4 text-xs text-author-white font-mono">
                            {order.address?.phone || order.user?.phone || "N/A"}
                          </td>
                          <td className="p-4">
                            <div className="text-[10px] text-author-mid max-w-[200px]">
                              {order.items && order.items.length > 0
                                ? order.items
                                    .map((item: any) => `${item.productName} × ${item.quantity}`)
                                    .join(", ")
                                : `${order._count.items} item(s)`}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-author-white">
                            {formatPrice(order.total)}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
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
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                                title="View Details Page"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteConfirm({ id: order.id, orderNumber: order.orderNumber })}
                                className="p-1.5 hover:bg-red-500/10 rounded text-author-mid hover:text-red-400 transition-colors"
                                title="Archive Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expandable Order Details Row */}
                        {isExpanded && (
                          <tr className="bg-author-charcoal/20 border-b border-white/5">
                          <td colSpan={9} className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-author-mid text-left">
                                
                                {/* Customer Details */}
                                <div className="space-y-3 border-r border-white/5 pr-6">
                                  <h4 className="font-heading font-bold uppercase tracking-wider text-author-white text-[10px]">Customer Details</h4>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-author-mid/50 font-medium">Name</span>
                                    <span className="text-author-white font-medium">{order.user?.name || "Guest Checkout"}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-author-mid/50 font-medium">Email</span>
                                    <span className="text-author-white font-mono">{order.user?.email}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] uppercase tracking-wider text-author-mid/50 font-medium">Phone</span>
                                    <span className="text-author-white font-mono">{order.user?.phone || "N/A"}</span>
                                  </div>
                                  <div className="pt-2">
                                    <span className="block text-[9px] uppercase tracking-wider text-author-mid/50 font-medium">Payment Status</span>
                                    <span className={`inline-block text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                      order.paymentStatus === "PAID"
                                        ? "bg-green-500/20 text-green-400 border border-green-500/10"
                                        : order.paymentStatus === "FAILED"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/10"
                                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/10"
                                    }`}>
                                      {order.paymentStatus}
                                    </span>
                                  </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-3 border-r border-white/5 pr-6">
                                  <h4 className="font-heading font-bold uppercase tracking-wider text-author-white text-[10px]">Shipping Address</h4>
                                  {order.address ? (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-author-white">{order.address.fullName}</p>
                                      <p>{order.address.line1}</p>
                                      {order.address.line2 && <p>{order.address.line2}</p>}
                                      <p>{order.address.city}, {order.address.state} — {order.address.postalCode}</p>
                                      <p>Country: {order.address.country}</p>
                                      <p className="font-medium pt-1">Contact Phone: {order.address.phone}</p>
                                    </div>
                                  ) : (
                                    <p className="text-author-mid/40 italic">No shipping address provided</p>
                                  )}
                                </div>

                                {/* Order Items Grid */}
                                <div className="space-y-3">
                                  <h4 className="font-heading font-bold uppercase tracking-wider text-author-white text-[10px]">Items Summary</h4>
                                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-2">
                                    {order.items && order.items.length > 0 ? (
                                      order.items.map((item) => (
                                        <div key={item.id} className="flex gap-3 items-center border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                                          <div className="relative w-8 h-10 bg-black/40 overflow-hidden flex-shrink-0">
                                            {item.imageUrl ? (
                                              <img src={item.imageUrl} alt={item.productName} className="object-cover w-full h-full" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-[6px] text-author-mid uppercase">IMG</div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-author-white uppercase truncate text-[10px] tracking-wide">
                                              {item.productName}
                                            </p>
                                            <p className="text-[9px] text-author-mid/60 mt-0.5">
                                              Size: {item.size || "N/A"} | Color: {item.color || "N/A"} | Qty: {item.quantity}
                                            </p>
                                          </div>
                                          <div className="text-right flex-shrink-0">
                                            <span className="font-mono text-author-white text-[10px]">
                                              ₹{(item.totalPrice / 100).toLocaleString("en-IN")}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-author-mid/40 italic">No items found for this order</p>
                                    )}
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
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

    {/* Archive Confirmation Modal */}
    <AnimatePresence>
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-lg p-6 max-w-sm w-full mx-4 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider mb-2">
              Archive Order
            </h3>
            <p className="text-sm text-author-mid mb-6">
              Are you sure you want to archive order <strong className="text-author-white">{deleteConfirm.orderNumber}</strong>? This will hide it from the default order list.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-heading uppercase tracking-wider text-author-mid hover:text-author-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${deleteConfirm.id}`, { method: "DELETE" });
                    const json = await res.json();
                    if (json.success) {
                      setOrders((prev) => prev.filter((o) => o.id !== deleteConfirm.id));
                      toast.success(`Order ${deleteConfirm.orderNumber} archived`);
                    } else {
                      toast.error(json.message || "Failed to archive order");
                    }
                  } catch {
                    toast.error("Failed to archive order");
                  } finally {
                    setDeleting(false);
                    setDeleteConfirm(null);
                  }
                }}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-heading uppercase tracking-wider rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Archive
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
