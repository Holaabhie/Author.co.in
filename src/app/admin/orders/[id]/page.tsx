"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
  size: string | null;
  color: string | null;
  product: {
    id: string;
    slug: string;
    isActive: boolean;
    images?: { url: string; color: string | null; isPrimary: boolean }[];
  } | null;
  variant: { id: string; size: string; color: string; colorHex: string } | null;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  changedBy: string | null;
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
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
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
  statusHistory: StatusHistoryEntry[];
  coupon: {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

const ORDER_STATUSES = [
  "PENDING", "CONFIRMED", "PACKED", "SHIPPED",
  "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
];

/** Resolve display image for an order item — snapshot first, then product fallback */
function resolveItemDisplayImage(item: OrderItem): string | null {
  if (item.imageUrl) return item.imageUrl;

  // Fallback: resolve from product images (for old orders with null imageUrl)
  const images = item.product?.images;
  if (!images || images.length === 0) return null;

  const itemColor = item.color || item.variant?.color;
  if (itemColor) {
    const colorMatch = images.find(
      (img) => img.color && img.color.toLowerCase() === itemColor.toLowerCase()
    );
    if (colorMatch) return colorMatch.url;
  }

  const primary = images.find((img) => img.isPrimary);
  if (primary) return primary.url;

  return images[0]?.url ?? null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrder(json.data);
        } else {
          throw new Error(json.message || "Failed to load order");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Error loading order");
      } finally {
        setLoading(false);
      }
    }
    if (orderId) fetchOrder();
  }, [orderId]);

  async function handleStatusChange(newStatus: string) {
    if (!order || order.status === newStatus) return;

    const previousStatus = order.status;
    setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
    setStatusUpdating(true);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to update status");
      /* success toast removed */

      // Refresh to get updated status history
      const refreshRes = await fetch(`/api/admin/orders/${orderId}`);
      const refreshJson = await refreshRes.json();
      if (refreshJson.success) setOrder(refreshJson.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
      setOrder((prev) => prev ? { ...prev, status: previousStatus } : prev);
    } finally {
      setStatusUpdating(false);
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
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/10",
      CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/10",
      PACKED: "bg-purple-500/20 text-purple-400 border-purple-500/10",
      SHIPPED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/10",
      OUT_FOR_DELIVERY: "bg-indigo-500/20 text-indigo-400 border-indigo-500/10",
      DELIVERED: "bg-green-500/20 text-green-400 border-green-500/10",
      CANCELLED: "bg-red-500/20 text-red-400 border-red-500/10",
      REFUNDED: "bg-orange-500/20 text-orange-400 border-orange-500/10",
      PAID: "bg-green-500/20 text-green-400 border-green-500/10",
      FAILED: "bg-red-500/20 text-red-400 border-red-500/10",
    };
    return colors[status] || "bg-white/10 text-author-mid";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-author-cream animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-author-mid">Order not found</p>
        <Link href="/admin/orders" className="text-author-cream text-sm hover:underline mt-2 inline-block">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-author-mid" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-author-white">
              {order.orderNumber}
            </h1>
            <p className="text-author-mid text-sm mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.status !== "SHIPPED" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
            <button
              onClick={() => handleStatusChange("SHIPPED")}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-heading uppercase tracking-wider rounded hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
            >
              <Truck className="w-4 h-4" /> Mark Shipped
            </button>
          )}
          {order.status === "SHIPPED" && (
            <button
              onClick={() => handleStatusChange("DELIVERED")}
              disabled={statusUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-heading uppercase tracking-wider rounded hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Mark Delivered
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="glass rounded-lg overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="relative w-16 h-20 flex-shrink-0 bg-author-black overflow-hidden rounded border border-white/10">
                    {(() => {
                      const displayImage = resolveItemDisplayImage(item);
                      return displayImage ? (
                        <Image
                          src={displayImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-author-mid uppercase font-heading">
                          No Img
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-author-white uppercase tracking-wider truncate">
                      {item.productName}
                    </p>
                    <p className="text-[10px] text-author-mid mt-0.5">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && " · "}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-[10px] text-author-mid mt-0.5">
                      Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-author-white">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="p-6 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-xs text-author-mid">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-green-400">
                  <span>Discount {order.coupon && `(${order.coupon.code})`}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              {order.shippingFee > 0 && (
                <div className="flex justify-between text-xs text-author-mid">
                  <span>Shipping</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-xs text-author-mid">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-author-white pt-2 border-t border-white/5">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4" /> Status Timeline
            </h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-xs text-author-mid">No status changes recorded</p>
            ) : (
              <div className="space-y-4">
                {order.statusHistory.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                      i === 0 ? "bg-author-cream" : "bg-white/20"
                    }`} />
                    <div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider border ${getStatusColor(entry.status)}`}>
                        {entry.status.replace(/_/g, " ")}
                      </span>
                      {entry.note && (
                        <p className="text-xs text-author-mid mt-1">{entry.note}</p>
                      )}
                      <p className="text-[10px] text-author-mid/60 mt-1">
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white mb-4">
              Order Status
            </h2>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className="w-full bg-author-charcoal border border-white/10 px-3 py-2.5 text-xs text-author-white focus:outline-none focus:border-author-cream/40 rounded disabled:opacity-50"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-author-mid uppercase tracking-wider">Payment</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider border ${getStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>

            {order.razorpayPaymentId && (
              <div className="mt-3 text-[10px] text-author-mid">
                <p>Payment ID: <span className="text-author-white font-mono">{order.razorpayPaymentId}</span></p>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2 mb-4">
              <User className="w-4 h-4" /> Customer
            </h2>
            {order.user ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-author-white">{order.user.name || "Guest"}</p>
                <p className="text-xs text-author-mid">{order.user.email}</p>
                {order.user.phone && <p className="text-xs text-author-mid">{order.user.phone}</p>}
                <p className="text-[10px] text-author-mid mt-2">
                  {order.user._count.orders} total orders · Joined {new Date(order.user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              </div>
            ) : (
              <p className="text-xs text-author-mid">Guest checkout</p>
            )}
          </div>

          {/* Shipping Address */}
          {order.address && (
            <div className="glass rounded-lg p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h2>
              <div className="text-xs text-author-mid space-y-1">
                <p className="text-author-white font-semibold">{order.address.fullName}</p>
                <p>{order.address.phone}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
                <p>{order.address.country}</p>
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {(order.trackingNumber || order.courierName) && (
            <div className="glass rounded-lg p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4" /> Tracking
              </h2>
              <div className="text-xs text-author-mid space-y-1">
                {order.courierName && <p>Courier: <span className="text-author-white">{order.courierName}</span></p>}
                {order.trackingNumber && <p>Tracking: <span className="text-author-white font-mono">{order.trackingNumber}</span></p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
