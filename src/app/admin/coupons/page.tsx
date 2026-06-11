"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Percent,
  IndianRupee,
  Truck,
  Calendar,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string | null;
  _count: {
    usageRecords: number;
    orders: number;
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCoupons, setTotalCoupons] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("0");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perCustomerLimit, setPerCustomerLimit] = useState("1");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const typeParam = discountType ? `&discountType=${discountType}` : "";
      const activeParam = isActiveFilter === "all" ? "" : `&isActive=${isActiveFilter}`;

      const res = await fetch(`/api/admin/coupons?page=${page}&pageSize=10${searchParam}${typeParam}${activeParam}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setCoupons(json.data);
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalCoupons(json.meta.total || 0);
        }
      } else {
        throw new Error(json.message || "Failed to load coupons");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error fetching coupons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoupons();
  }, [page, discountType, isActiveFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchCoupons();
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setType("PERCENTAGE");
    setValue("");
    setMinOrder("0");
    setMaxDiscount("");
    setUsageLimit("");
    setPerCustomerLimit("1");
    setFirstOrderOnly(false);
    
    // Set startsAt to today's date formatted as YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    setStartsAt(today);
    setExpiresAt("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || "");
    setType(coupon.discountType);
    
    // Convert to readable rates (Fixed rate comes from paise, min order comes from paise)
    setValue(coupon.discountType === "PERCENTAGE" ? coupon.discountValue.toString() : (coupon.discountValue / 100).toString());
    setMinOrder((coupon.minOrderValue / 100).toString());
    setMaxDiscount(coupon.maxDiscount ? (coupon.maxDiscount / 100).toString() : "");
    setUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : "");
    setPerCustomerLimit(coupon.perCustomerLimit ? coupon.perCustomerLimit.toString() : "");
    setIsActive(coupon.isActive);
    
    setStartsAt(coupon.startsAt ? new Date(coupon.startsAt).toISOString().split("T")[0] : "");
    setExpiresAt(coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "");
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Code is required");
    if (!value || parseFloat(value) <= 0) return toast.error("Discount value must be positive");

    setSaving(true);

    // Convert Rupees/Percentage inputs to correct database format (in paise if currency)
    const discountValNum = parseFloat(value);
    const discountValue = type === "PERCENTAGE" ? discountValNum : Math.round(discountValNum * 100);
    const minOrderValue = Math.round((parseFloat(minOrder) || 0) * 100);
    const maxDiscountVal = maxDiscount ? Math.round(parseFloat(maxDiscount) * 100) : null;
    const usageLimitVal = usageLimit ? parseInt(usageLimit) : null;
    const perCustomerLimitVal = perCustomerLimit ? parseInt(perCustomerLimit) : null;

    const payload = {
      id: editingCoupon?.id,
      code: code.toUpperCase().trim(),
      description: description.trim() || null,
      discountType: type,
      discountValue,
      minOrderValue,
      maxDiscount: maxDiscountVal,
      usageLimit: usageLimitVal,
      perCustomerLimit: perCustomerLimitVal,
      firstOrderOnly,
      startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive,
    };

    try {
      const method = editingCoupon ? "PUT" : "POST";
      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        throw new Error(json.message || "Failed to save coupon");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this coupon?")) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        /* success toast removed */
        fetchCoupons();
      } else {
        throw new Error(json.message || "Failed to deactivate coupon");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    }
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
            Coupons
          </h1>
          <p className="text-author-mid text-sm mt-1">
            {totalCoupons} coupon codes for checkout discounts
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-author-cream text-author-black px-6 py-2.5 font-heading text-xs uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Coupon
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
            placeholder="Search coupons by code or description..."
            className="w-full bg-author-charcoal/50 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 transition-colors rounded"
          />
        </div>

        {/* Type Filter */}
        <select
          value={discountType}
          onChange={(e) => {
            setDiscountType(e.target.value);
            setPage(1);
          }}
          className="bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
        >
          <option value="">All Discount Types</option>
          <option value="PERCENTAGE">Percentage (%)</option>
          <option value="FIXED">Fixed Amount (₹)</option>
          <option value="FREE_SHIPPING">Free Shipping</option>
        </select>

        {/* Active Filter */}
        <select
          value={isActiveFilter}
          onChange={(e) => {
            setIsActiveFilter(e.target.value);
            setPage(1);
          }}
          className="bg-author-charcoal/50 border border-white/10 px-4 py-2.5 text-sm text-author-white focus:outline-none focus:border-author-cream/40 rounded transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Coupons Table */}
      <div className="glass rounded-lg overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
            <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-author-mid mx-auto opacity-50" />
            <h3 className="font-heading text-lg font-bold text-author-white uppercase tracking-wider">No Coupons Found</h3>
            <p className="text-xs text-author-mid max-w-sm mx-auto">
              We couldn&apos;t find any coupons. Try creating a new discount code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5 bg-author-black/20">
                  <th className="text-left p-4">Code</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Value</th>
                  <th className="text-left p-4">Min Order</th>
                  <th className="text-left p-4">Usage (Used/Limit)</th>
                  <th className="text-left p-4">Validity Period</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {coupons.map((coupon, i) => {
                    const hasExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                    return (
                      <motion.tr
                        key={coupon.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-heading text-xs font-bold uppercase tracking-wider text-author-white">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-[10px] text-author-mid mt-0.5 max-w-[200px] truncate">
                              {coupon.description}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-1.5 text-xs text-author-white">
                            {coupon.discountType === "PERCENTAGE" && <Percent className="w-3.5 h-3.5 text-author-cream" />}
                            {coupon.discountType === "FIXED" && <IndianRupee className="w-3.5 h-3.5 text-blue-400" />}
                            {coupon.discountType === "FREE_SHIPPING" && <Truck className="w-3.5 h-3.5 text-green-400" />}
                            <span className="text-[10px] uppercase font-heading tracking-wider">
                              {coupon.discountType.replace("_", " ")}
                            </span>
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-author-white text-xs">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${coupon.discountValue}%`
                            : coupon.discountType === "FREE_SHIPPING"
                            ? "Free"
                            : formatPrice(coupon.discountValue)}
                        </td>
                        <td className="p-4 text-xs text-author-white">
                          {coupon.minOrderValue > 0 ? formatPrice(coupon.minOrderValue) : "No Min"}
                        </td>
                        <td className="p-4 text-xs text-author-white font-mono">
                          {coupon._count.usageRecords} / {coupon.usageLimit || "∞"}
                        </td>
                        <td className="p-4 text-[10px] text-author-mid font-mono">
                          <div>S: {new Date(coupon.startsAt).toLocaleDateString()}</div>
                          <div>E: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider font-semibold border ${
                              !coupon.isActive
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : hasExpired
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                : "bg-green-500/10 text-green-400 border-green-500/20"
                            }`}
                          >
                            {!coupon.isActive ? "Inactive" : hasExpired ? "Expired" : "Active"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(coupon)}
                              className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded text-red-400/70 hover:text-red-400 transition-colors"
                              title="Deactivate"
                              disabled={!coupon.isActive}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
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
              Showing page {page} of {totalPages} ({totalCoupons} coupons)
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

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  {editingCoupon ? "Edit Coupon Code" : "Create Coupon Code"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-4 overflow-y-auto py-4 pr-1 text-xs">
                {/* Code & Description */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AUTHOR15"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                      disabled={!!editingCoupon}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Discount Type *</label>
                    <select
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value as any);
                        setValue("");
                      }}
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-author-mid uppercase block mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 15% off on orders above ₹2,000"
                    className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                  />
                </div>

                {/* Values & Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">
                      {type === "PERCENTAGE"
                        ? "Discount Percentage (%) *"
                        : type === "FREE_SHIPPING"
                        ? "Discount Value (Set to 0)"
                        : "Discount Value (INR ₹) *"}
                    </label>
                    <input
                      type="number"
                      required={type !== "FREE_SHIPPING"}
                      disabled={type === "FREE_SHIPPING"}
                      value={type === "FREE_SHIPPING" ? "0" : value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={type === "PERCENTAGE" ? "15" : "500"}
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      placeholder="0"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Max Discount (₹) (For % type)</label>
                    <input
                      type="number"
                      disabled={type !== "PERCENTAGE"}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Usage Limit (Global)</label>
                    <input
                      type="number"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="Unlimited if empty"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Usage Limit (Per Customer)</label>
                    <input
                      type="number"
                      value={perCustomerLimit}
                      onChange={(e) => setPerCustomerLimit(e.target.value)}
                      placeholder="1"
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-author-mid">
                      <input
                        type="checkbox"
                        checked={firstOrderOnly}
                        onChange={(e) => setFirstOrderOnly(e.target.checked)}
                        className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      />
                      First Order Only
                    </label>
                  </div>
                </div>

                {/* Dates & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Starts At *</label>
                    <input
                      type="date"
                      required
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-author-mid uppercase block mb-1">Expires At</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-author-charcoal border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-author-white font-semibold">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded bg-author-charcoal border-white/10 text-author-cream focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    Coupon Active & Claimable
                  </label>
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/5 border border-white/10 py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-white/10 transition-colors rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-author-cream text-author-black py-2.5 font-heading text-xs uppercase tracking-wider font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-1 rounded disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-3 animate-spin" />}
                    Save Coupon
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
