"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  User,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  isBlocked: boolean;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  reviewCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const fromParam = dateFrom ? `&dateFrom=${dateFrom}` : "";
      const toParam = dateTo ? `&dateTo=${dateTo}` : "";

      const res = await fetch(
        `/api/admin/customers?page=${page}&pageSize=10${searchParam}${fromParam}${toParam}`
      );
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalCustomers(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load customers");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [page, dateFrom, dateTo]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Export CSV
  const handleExportCSV = () => {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    const fromParam = dateFrom ? `&dateFrom=${dateFrom}` : "";
    const toParam = dateTo ? `&dateTo=${dateTo}` : "";
    
    // Redirect to download endpoint
    window.open(`/api/admin/customers?format=csv${searchParam}${fromParam}${toParam}`, "_blank");
    toast.success("CSV export initiated");
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Customers
          </h1>
          <p className="text-author-mid text-sm mt-1">
            {totalCustomers} registered customer profiles
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-author-charcoal/30 p-4 border border-white/5 rounded-lg">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
          />
        </div>

        {/* Date From */}
        <div className="relative">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            placeholder="Joined From"
            className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2 text-sm text-author-white focus:outline-none focus:border-author-cream/40 rounded text-author-mid"
          />
        </div>

        {/* Date To */}
        <div className="relative">
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            placeholder="Joined To"
            className="w-full bg-author-charcoal/50 border border-white/10 px-4 py-2 text-sm text-author-white focus:outline-none focus:border-author-cream/40 rounded text-author-mid"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Customers Found</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              We couldn't find any customers matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Joined Date</th>
                  <th className="text-left p-4">Orders</th>
                  <th className="text-left p-4">Total Spent</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {customers.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-author-cream/10 flex items-center justify-center text-author-cream font-heading uppercase text-xs">
                            {c.name ? c.name.slice(0, 2) : <User className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading text-xs uppercase tracking-wider text-author-white truncate max-w-[150px]">
                              {c.name || "Anonymous Guest"}
                            </p>
                            <p className="text-[10px] text-author-mid">{c.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-author-white font-medium">{c.email}</p>
                        {c.phone && <p className="text-[10px] text-author-mid font-mono mt-0.5">{c.phone}</p>}
                      </td>
                      <td className="p-4 text-xs text-author-mid">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-xs text-author-white font-semibold">
                        {c.orderCount} orders
                      </td>
                      <td className="p-4 text-xs text-author-white font-semibold">
                        {formatPrice(c.totalSpent)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider font-semibold border ${
                            c.isBlocked
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-green-500/10 text-green-400 border-green-500/20"
                          }`}
                        >
                          {c.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          className="text-xs text-author-cream hover:underline font-heading uppercase tracking-wider"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                        >
                          View Details
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
              Showing page {page} of {totalPages} ({totalCustomers} profiles)
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

      {/* Details Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-author-black"
            />
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass bg-author-charcoal/95 border border-white/10 rounded-lg p-6 shadow-2xl space-y-6 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-author-cream/10 flex items-center justify-center text-author-cream font-heading uppercase text-sm font-semibold">
                    {selectedCustomer.name ? selectedCustomer.name.slice(0, 2) : "G"}
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-author-white">
                      {selectedCustomer.name || "Guest Checkout"}
                    </h2>
                    <p className="text-[10px] text-author-mid uppercase tracking-wide font-heading">
                      Profile ID: {selectedCustomer.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded">
                    <p className="text-[10px] text-author-mid uppercase tracking-wider font-heading mb-1">
                      Account Registered
                    </p>
                    <p className="text-author-white font-medium">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded">
                    <p className="text-[10px] text-author-mid uppercase tracking-wider font-heading mb-1">
                      Total Revenue Generated
                    </p>
                    <p className="text-author-white font-bold text-sm">
                      {formatPrice(selectedCustomer.totalSpent)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading text-[10px] uppercase tracking-wider text-author-cream border-b border-white/5 pb-1">
                    Contact Details
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-author-mid">Email Address</span>
                      <span className="text-author-white font-mono">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-author-mid">Phone Number</span>
                      <span className="text-author-white font-mono">{selectedCustomer.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading text-[10px] uppercase tracking-wider text-author-cream border-b border-white/5 pb-1">
                    Engagement Stats
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-author-mid">Orders Placed</span>
                      <span className="text-author-white font-semibold">{selectedCustomer.orderCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-author-mid">Reviews Submitted</span>
                      <span className="text-author-white font-semibold">{selectedCustomer.reviewCount}</span>
                    </div>
                  </div>
                </div>

                {selectedCustomer.internalNotes && (
                  <div className="space-y-2">
                    <h3 className="font-heading text-[10px] uppercase tracking-wider text-author-cream border-b border-white/5 pb-1">
                      Internal Notes
                    </h3>
                    <p className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded text-[11px] text-yellow-200">
                      {selectedCustomer.internalNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-4 flex gap-3">
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(selectedCustomer.email)}`}
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 bg-author-cream text-author-black py-2.5 font-heading text-xs uppercase tracking-[0.15em] font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-1.5 rounded"
                >
                  <ShoppingBag className="w-4 h-4" /> View Orders
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
