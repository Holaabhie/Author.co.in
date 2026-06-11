"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  isBlocked: boolean;
  createdAt: string;
  orderCount: number;
  reviewCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function fetchCustomers() {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(
        `/api/admin/customers?page=${page}&pageSize=20&sortBy=${sortBy}&sortOrder=${sortOrder}${searchParam}`
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
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-author-white">
            Customers
          </h1>
          <p className="text-author-mid text-sm mt-1">
            {totalCustomers} registered customers
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-author-mid" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Users className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Customers Found</h3>
            <p className="text-xs text-author-mid">No customers match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4 cursor-pointer" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">
                      Name <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left p-4 cursor-pointer" onClick={() => toggleSort("email")}>
                    <span className="flex items-center gap-1">
                      Email <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Orders</th>
                  <th className="text-left p-4">Total Spent</th>
                  <th className="text-left p-4 cursor-pointer" onClick={() => toggleSort("createdAt")}>
                    <span className="flex items-center gap-1">
                      Joined <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {customers.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="w-8 h-8 rounded-full bg-author-cream/10 border border-author-cream/20 flex items-center justify-center text-xs font-heading font-bold text-author-cream">
                          {(c.name || c.email)[0].toUpperCase()}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="text-xs font-semibold text-author-white hover:text-author-cream transition-colors uppercase tracking-wider"
                        >
                          {c.name || "—"}
                        </Link>
                        {c.isBlocked && (
                          <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/10">
                            BLOCKED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-author-mid">{c.email}</td>
                      <td className="p-4 text-xs text-author-mid">{c.phone || "—"}</td>
                      <td className="p-4 text-xs text-author-white font-semibold">{c.orderCount}</td>
                      <td className="p-4 text-xs text-author-white font-semibold">{formatPrice(c.totalSpent)}</td>
                      <td className="p-4 text-xs text-author-mid">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
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
              Page {page} of {totalPages} ({totalCustomers} customers)
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
