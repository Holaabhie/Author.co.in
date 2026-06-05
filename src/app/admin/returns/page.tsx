"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Undo2,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  FileText,
  Save,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ReturnItem {
  id: string;
  orderItemId: string;
  quantity: number;
  reason: string | null;
  orderItem: {
    productName: string;
    size: string;
    color: string;
  };
}

interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUNDED";
  adminNote: string | null;
  refundAmount: number | null; // in paise
  createdAt: string;
  updatedAt: string;
  order: {
    orderNumber: string;
  };
  user: {
    name: string | null;
    email: string;
  };
  items: ReturnItem[];
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReturns, setTotalReturns] = useState(0);

  // Modal State
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [refundAmountRs, setRefundAmountRs] = useState("");

  const statuses = [
    { value: "all", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "RECEIVED", label: "Received" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "REJECTED", label: "Rejected" },
  ];

  async function fetchReturns() {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? "" : `&status=${statusFilter}`;
      const res = await fetch(`/api/returns?admin=true&page=${page}&pageSize=10${statusParam}`);
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
      toast.error(err.message || "Error fetching return requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter]);

  const handleOpenDetailModal = (ret: ReturnRequest) => {
    setSelectedReturn(ret);
    setNewStatus(ret.status);
    setAdminNote(ret.adminNote || "");
    setRefundAmountRs(ret.refundAmount ? (ret.refundAmount / 100).toString() : "");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    setUpdating(true);
    // Convert Rupees input to paise
    const refundAmount = refundAmountRs ? Math.round(parseFloat(refundAmountRs) * 100) : null;

    try {
      const res = await fetch("/api/returns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReturn.id,
          status: newStatus,
          adminNote: adminNote.trim() || null,
          refundAmount,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Return status updated successfully");
        setSelectedReturn(null);
        fetchReturns();
      } else {
        throw new Error(json.message || "Failed to update return");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error updating return request");
    } finally {
      setUpdating(false);
    }
  };

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
      APPROVED: "bg-blue-500/20 text-blue-400 border border-blue-500/10",
      RECEIVED: "bg-purple-500/20 text-purple-400 border border-purple-500/10",
      REFUNDED: "bg-green-500/20 text-green-400 border border-green-500/10",
      REJECTED: "bg-red-500/20 text-red-400 border border-red-500/10",
    };
    return colors[status] || "bg-white/10 text-author-mid";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white flex items-center gap-2">
            <Undo2 className="w-6 h-6 text-author-cream" /> Return Requests
          </h1>
          <p className="text-author-mid text-sm mt-1">
            {totalReturns} return requests filed by customers (7-day window)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px gap-6">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setStatusFilter(s.value);
              setPage(1);
            }}
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

      {/* Returns Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading returns...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Return Requests</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              No return requests recorded in this status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Return ID</th>
                  <th className="text-left p-4">Order#</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Reason</th>
                  <th className="text-left p-4">Refund Amount</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date Filed</th>
                  <th className="text-right p-4"></th>
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
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => handleOpenDetailModal(ret)}
                    >
                      <td className="p-4 font-mono text-xs font-semibold text-author-cream">
                        {ret.id.slice(0, 8)}...
                      </td>
                      <td className="p-4 font-mono text-xs text-author-white">
                        {ret.order.orderNumber}
                      </td>
                      <td className="p-4 text-xs text-author-white font-medium">
                        {ret.user.name || "Guest Checkout"}
                      </td>
                      <td className="p-4 text-xs text-author-white max-w-xs truncate" title={ret.reason}>
                        {ret.reason}
                      </td>
                      <td className="p-4 text-xs text-author-white font-semibold">
                        {ret.refundAmount ? formatPrice(ret.refundAmount) : <span className="text-author-mid italic">Pending</span>}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider ${getStatusColor(ret.status)}`}>
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
                        <button
                          className="text-xs text-author-cream hover:underline font-heading uppercase tracking-wider"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetailModal(ret);
                          }}
                        >
                          Manage
                        </button>
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
              Showing page {page} of {totalPages} ({totalReturns} requests)
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

      {/* Return Request Management Modal */}
      <AnimatePresence>
        {selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReturn(null)}
              className="absolute inset-0 bg-author-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass bg-author-charcoal/95 border border-white/10 rounded-lg p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-author-white">
                  Manage Return Request
                </h2>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4 overflow-y-auto py-4 pr-1 text-xs">
                {/* Info Card */}
                <div className="bg-white/5 p-4 rounded border border-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-author-mid">Return ID:</span>
                    <span className="font-mono text-author-white font-bold">{selectedReturn.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-author-mid">Order Number:</span>
                    <span className="font-mono text-author-cream font-bold">{selectedReturn.order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-author-mid">Customer:</span>
                    <span className="text-author-white font-semibold">
                      {selectedReturn.user.name} ({selectedReturn.user.email})
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                    <span className="text-author-mid">Reason for Return:</span>
                    <span className="text-author-white font-semibold">{selectedReturn.reason}</span>
                  </div>
                  {selectedReturn.note && (
                    <div className="border-t border-white/5 pt-2 mt-2">
                      <span className="text-author-mid block mb-0.5">Customer Notes:</span>
                      <span className="text-author-white italic bg-author-black/20 p-2 rounded block">
                        "{selectedReturn.note}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Items to Return */}
                <div className="space-y-2">
                  <h3 className="font-heading text-[10px] uppercase tracking-wider text-author-cream border-b border-white/5 pb-1">
                    Items Filed for Return
                  </h3>
                  <div className="divide-y divide-white/5">
                    {selectedReturn.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between">
                        <div>
                          <p className="font-heading uppercase tracking-wider font-semibold text-author-white text-[11px]">
                            {item.orderItem.productName}
                          </p>
                          <p className="text-[10px] text-author-mid mt-0.5">
                            Size: {item.orderItem.size} | Color: {item.orderItem.color}
                          </p>
                        </div>
                        <span className="text-xs text-author-white font-mono font-semibold">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update status actions */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Update Status *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved (Return Label Sent)</option>
                      <option value="RECEIVED">Received (Item Inspected)</option>
                      <option value="REFUNDED">Refunded</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Refund Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={refundAmountRs}
                      onChange={(e) => setRefundAmountRs(e.target.value)}
                      placeholder="INR Amount"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Admin Resolution Note</label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Provide reason for approval/rejection or refund notes..."
                    className="w-full bg-author-charcoal border border-white/10 p-3 text-xs text-author-white focus:outline-none rounded resize-none"
                  />
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedReturn(null)}
                    className="flex-1 bg-white/5 border border-white/10 py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition-colors rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-author-cream text-author-black py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-1 rounded disabled:opacity-50"
                  >
                    {updating && <Loader2 className="w-3 animate-spin" />}
                    Save Resolution
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
