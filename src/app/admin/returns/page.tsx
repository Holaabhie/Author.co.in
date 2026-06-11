"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface ReturnItem {
  id: string;
  quantity: number;
  reason: string | null;
  orderItem: {
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl: string | null;
    size: string | null;
    color: string | null;
  };
}

interface ReturnRequest {
  id: string;
  status: string;
  reason: string;
  note: string | null;
  adminNote: string | null;
  refundAmount: number | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: ReturnItem[];
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReturns, setTotalReturns] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statuses = [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "RECEIVED", label: "Received" },
    { value: "REFUNDED", label: "Refunded" },
  ];

  async function fetchReturns() {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? "" : `&status=${statusFilter}`;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/returns?page=${page}&pageSize=20${statusParam}${searchParam}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setReturns(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalReturns(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load returns");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching returns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchReturns();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Approve / Reject with optimistic UI
  async function handleAction(returnId: string, action: "APPROVED" | "REJECTED") {
    const original = returns.find((r) => r.id === returnId);
    if (!original) return;

    // Optimistic update
    setReturns((prev) =>
      prev.map((r) => (r.id === returnId ? { ...r, status: action } : r))
    );
    setActionLoading(returnId);

    try {
      const res = await fetch("/api/admin/returns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnId, status: action }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || `Failed to ${action.toLowerCase()} return`);
      }
      /* success toast removed */
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Action failed");
      // Rollback
      setReturns((prev) =>
        prev.map((r) => (r.id === returnId ? { ...r, status: original.status } : r))
      );
    } finally {
      setActionLoading(null);
    }
  }

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/10",
      APPROVED: "bg-green-500/20 text-green-400 border border-green-500/10",
      REJECTED: "bg-red-500/20 text-red-400 border border-red-500/10",
      RECEIVED: "bg-blue-500/20 text-blue-400 border border-blue-500/10",
      REFUNDED: "bg-gray-500/20 text-gray-400 border border-gray-500/10",
    };
    return colors[status] || "bg-white/10 text-author-mid";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
          Returns
        </h1>
        <p className="text-author-mid text-sm mt-1">
          {totalReturns} return requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px gap-6">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`pb-3 text-xs uppercase tracking-wider font-heading border-b-2 transition-colors whitespace-nowrap ${
              statusFilter === s.value
                ? "border-author-cream text-author-cream font-semibold"
                : "border-transparent text-author-mid hover:text-author-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number, customer name, or reason..."
          className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Returns Found</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">No return requests match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Return ID</th>
                  <th className="text-left p-4">Order</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Reason</th>
                  <th className="text-left p-4">Items</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {returns.map((ret, i) => (
                    <motion.tr
                      key={ret.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-mono text-[10px] text-author-mid">
                        {ret.id.slice(0, 8)}...
                      </td>
                      <td className="p-4">
                        <Link href={`/admin/orders/${ret.order.id}`} className="text-xs text-author-cream hover:underline font-mono font-semibold">
                          {ret.order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-author-white">{ret.user.name || "Unknown"}</div>
                        <div className="text-[10px] text-author-mid">{ret.user.email}</div>
                      </td>
                      <td className="p-4 text-xs text-author-white max-w-[200px] truncate">
                        {ret.reason}
                      </td>
                      <td className="p-4 text-xs text-author-mid">
                        {ret.items.length} item(s)
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider font-semibold ${getStatusColor(ret.status)}`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-author-mid">
                        {new Date(ret.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        {ret.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAction(ret.id, "APPROVED")}
                              disabled={actionLoading === ret.id}
                              className="p-1.5 hover:bg-green-500/10 rounded text-green-400/70 hover:text-green-400 transition-colors disabled:opacity-30"
                              title="Approve"
                            >
                              {actionLoading === ret.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleAction(ret.id, "REJECTED")}
                              disabled={actionLoading === ret.id}
                              className="p-1.5 hover:bg-red-500/10 rounded text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-30"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-author-mid uppercase tracking-wider">
                            {ret.status === "APPROVED" ? "Approved" : ret.status === "REJECTED" ? "Rejected" : "—"}
                          </span>
                        )}
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
              Showing page {page} of {totalPages} ({totalReturns} returns)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-author-white" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-author-charcoal border border-white/10 rounded hover:bg-white/5 transition-colors disabled:opacity-30"
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
