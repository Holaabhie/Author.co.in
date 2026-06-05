"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  FileText,
  Save,
  CheckCircle,
  Calendar,
  User,
  MapPin,
  Clock,
  Loader2,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  price: number;
  totalPrice: number;
  variant: {
    id: string;
    size: string;
    color: string;
    colorHex: string;
  } | null;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  trackingNumber: string | null;
  courierName: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: string;
    _count: { orders: number };
  } | null;
  items: OrderItem[];
  address: Address;
  billingAddress: Address | null;
  statusHistory: StatusHistory[];
  invoice: { id: string; invoiceNumber: string; pdfUrl: string | null } | null;
  returnRequests: any[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Editable fields
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
        setCourierName(json.data.courierName || "");
        setTrackingNumber(json.data.trackingNumber || "");
        setAdminNotes(json.data.adminNotes || "");
      } else {
        throw new Error(json.message || "Failed to load order detail");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load order");
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Save Tracking Info
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTracking(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierName: courierName || null,
          trackingNumber: trackingNumber || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Tracking information updated");
        loadOrder();
      } else {
        throw new Error(json.message || "Failed to update tracking info");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setUpdatingTracking(false);
    }
  };

  // Save Admin Notes
  const handleSaveNotes = async () => {
    setUpdatingNotes(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotes: adminNotes || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Admin notes updated");
        loadOrder();
      } else {
        throw new Error(json.message || "Failed to update admin notes");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setUpdatingNotes(false);
    }
  };

  // Update order status (sends to PUT /api/admin/orders)
  const handleStatusUpdate = async (newStatus: string) => {
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
      if (json.success) {
        toast.success(`Order status set to ${newStatus}`);
        loadOrder();
      } else {
        throw new Error(json.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    }
  };

  // Generate / Download invoice PDF
  const handleInvoiceDownload = async () => {
    setGeneratingInvoice(true);
    try {
      // Fetch pdf invoice endpoint.
      // Wait, is there a public invoice download route?
      // Yes, in public return/returns or we can call `/api/orders/[id]/invoice` or similar.
      // Let's call `/api/admin/orders/${orderId}/invoice` or generate one.
      // Let's check if the invoice PDF URL already exists.
      if (order?.invoice?.pdfUrl) {
        window.open(order.invoice.pdfUrl, "_blank");
        setGeneratingInvoice(false);
        return;
      }

      // If it doesn't exist, we can request generating it.
      // Let's send a POST/GET to generate/download invoice.
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${order?.orderNumber || "ORDER"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const err = await res.json();
        throw new Error(err.message || "Failed to generate invoice");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to retrieve invoice PDF");
    } finally {
      setGeneratingInvoice(false);
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

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
        <p className="text-sm text-author-mid uppercase tracking-wider font-heading">Loading order details...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-1.5 hover:bg-white/5 rounded text-author-mid hover:text-author-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-wider text-author-white">
                Order {order.orderNumber}
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded font-heading uppercase tracking-wider border font-semibold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-author-mid mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Quick status transitions */}
          {order.status === "PENDING" && (
            <button
              onClick={() => handleStatusUpdate("CONFIRMED")}
              className="bg-blue-600 text-white px-4 py-2 font-heading text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-colors rounded"
            >
              Confirm Order
            </button>
          )}
          {order.status === "CONFIRMED" && (
            <button
              onClick={() => handleStatusUpdate("PACKED")}
              className="bg-purple-600 text-white px-4 py-2 font-heading text-[10px] uppercase tracking-wider hover:bg-purple-700 transition-colors rounded"
            >
              Mark Packed
            </button>
          )}
          {order.status === "PACKED" && (
            <button
              onClick={() => handleStatusUpdate("SHIPPED")}
              className="bg-cyan-600 text-white px-4 py-2 font-heading text-[10px] uppercase tracking-wider hover:bg-cyan-700 transition-colors rounded"
            >
              Mark Shipped
            </button>
          )}
          {order.status === "SHIPPED" && (
            <button
              onClick={() => handleStatusUpdate("OUT_FOR_DELIVERY")}
              className="bg-indigo-600 text-white px-4 py-2 font-heading text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition-colors rounded"
            >
              Out For Delivery
            </button>
          )}
          {order.status === "OUT_FOR_DELIVERY" && (
            <button
              onClick={() => handleStatusUpdate("DELIVERED")}
              className="bg-green-600 text-white px-4 py-2 font-heading text-[10px] uppercase tracking-wider hover:bg-green-700 transition-colors rounded"
            >
              Mark Delivered
            </button>
          )}

          {/* Invoice */}
          <button
            onClick={handleInvoiceDownload}
            disabled={generatingInvoice}
            className="bg-author-cream text-author-black px-4 py-2 font-heading text-[10px] uppercase tracking-wider hover:bg-author-white transition-colors flex items-center gap-1.5 rounded disabled:opacity-50"
          >
            {generatingInvoice ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            Download Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="glass rounded-lg p-6 space-y-4">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white border-b border-white/5 pb-3">
              Order Items
            </h2>
            <div className="divide-y divide-white/5">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 text-sm first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/shop/${item.productSlug}`}
                      target="_blank"
                      className="font-heading text-xs uppercase tracking-wider text-author-cream hover:underline truncate block"
                    >
                      {item.productName}
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-author-mid font-heading uppercase tracking-wide">
                      {item.variant && (
                        <>
                          <span>Size: {item.variant.size}</span>
                          <span className="flex items-center gap-1.5">
                            Color: {item.variant.color}
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/10"
                              style={{ backgroundColor: item.variant.colorHex }}
                            />
                          </span>
                        </>
                      )}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-author-white">{formatPrice(item.totalPrice)}</p>
                    <p className="text-[10px] text-author-mid mt-0.5">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-white/5 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-author-mid">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-author-mid">
                <span>Shipping Fee</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-author-mid">
                <span>GST Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-white/5 pt-2 text-author-white">
                <span>Grand Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div className="glass p-6 rounded-lg space-y-3">
              <h3 className="font-heading text-xs uppercase tracking-wider text-author-mid flex items-center gap-1.5 border-b border-white/5 pb-2">
                <MapPin className="w-4 h-4 text-author-cream" /> Shipping Address
              </h3>
              <div className="text-xs text-author-white space-y-1">
                <p className="font-bold">{order.address.name}</p>
                <p>{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.state} — {order.address.postalCode}
                </p>
                <p>{order.address.country}</p>
                <p className="text-author-mid mt-2 font-mono">Phone: {order.address.phone}</p>
              </div>
            </div>

            {/* Billing Address */}
            <div className="glass p-6 rounded-lg space-y-3">
              <h3 className="font-heading text-xs uppercase tracking-wider text-author-mid flex items-center gap-1.5 border-b border-white/5 pb-2">
                <FileText className="w-4 h-4 text-author-cream" /> Billing Address
              </h3>
              {order.billingAddress ? (
                <div className="text-xs text-author-white space-y-1">
                  <p className="font-bold">{order.billingAddress.name}</p>
                  <p>{order.billingAddress.street}</p>
                  <p>
                    {order.billingAddress.city}, {order.billingAddress.state} — {order.billingAddress.postalCode}
                  </p>
                  <p>{order.billingAddress.country}</p>
                  <p className="text-author-mid mt-2 font-mono">Phone: {order.billingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-xs text-author-mid italic pt-2">Same as shipping address</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Customer details, Tracking, Admin Notes, Timeline */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="glass p-6 rounded-lg space-y-3">
            <h3 className="font-heading text-xs uppercase tracking-wider text-author-mid flex items-center gap-1.5 border-b border-white/5 pb-2">
              <User className="w-4 h-4 text-author-cream" /> Customer Info
            </h3>
            {order.user ? (
              <div className="text-xs text-author-white space-y-1.5">
                <p className="font-bold">{order.user.name || "N/A"}</p>
                <p className="text-author-mid">{order.user.email}</p>
                <p className="text-author-mid">Phone: {order.user.phone || "Not provided"}</p>
                <div className="border-t border-white/5 pt-2 mt-2 flex justify-between text-[10px] uppercase text-author-mid tracking-wider font-heading">
                  <span>Total Orders Placed</span>
                  <span className="font-bold text-author-white">{order.user._count.orders}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-author-mid italic">Guest checkout - No profile linked</p>
            )}
          </div>

          {/* Tracking Form */}
          <div className="glass p-6 rounded-lg space-y-3">
            <h3 className="font-heading text-xs uppercase tracking-wider text-author-mid flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Truck className="w-4 h-4 text-author-cream" /> Shipment Tracking
            </h3>
            <form onSubmit={handleSaveTracking} className="space-y-3">
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Courier Partner</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Delhivery, Bluedart"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-author-mid uppercase block mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="AWB Tracking #"
                  className="w-full bg-author-charcoal/50 border border-white/10 px-3 py-2 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded"
                />
              </div>
              <button
                type="submit"
                disabled={updatingTracking}
                className="w-full bg-author-cream text-author-black py-2 font-heading text-[10px] uppercase tracking-wider font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {updatingTracking ? (
                  <Loader2 className="w-3 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Update Tracking
              </button>
            </form>
          </div>

          {/* Admin Notes */}
          <div className="glass p-6 rounded-lg space-y-3">
            <h3 className="font-heading text-xs uppercase tracking-wider text-author-mid border-b border-white/5 pb-2">
              Internal Admin Notes
            </h3>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Customer requested call before delivery"
              className="w-full bg-author-charcoal/50 border border-white/10 p-3 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={updatingNotes}
              className="w-full bg-author-cream/10 text-author-cream border border-author-cream/20 py-2 font-heading text-[10px] uppercase tracking-wider font-semibold hover:bg-author-cream/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {updatingNotes ? (
                <Loader2 className="w-3 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Notes
            </button>
          </div>

          {/* Timeline */}
          <div className="glass p-6 rounded-lg space-y-3">
            <h3 className="font-heading text-xs uppercase tracking-wider text-author-mid flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Clock className="w-4 h-4 text-author-cream" /> Status History
            </h3>
            <div className="relative border-l border-white/5 pl-4 ml-2 space-y-4 pt-2">
              {order.statusHistory.map((history) => (
                <div key={history.id} className="relative text-xs">
                  {/* Bullet */}
                  <span className="absolute -left-[21px] top-0.5 bg-author-charcoal w-2.5 h-2.5 rounded-full border-2 border-author-cream" />
                  <p className="font-semibold text-author-white uppercase font-heading text-[10px] tracking-wider">
                    {history.status}
                  </p>
                  <p className="text-[10px] text-author-mid">
                    {new Date(history.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {history.notes && <p className="text-[10px] text-author-cream mt-0.5">{history.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
