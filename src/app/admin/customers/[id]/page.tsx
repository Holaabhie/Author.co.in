"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  User,
  ShoppingCart,
  MapPin,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
  _count: { items: number };
}

interface CustomerReturn {
  id: string;
  status: string;
  reason: string;
  refundAmount: number | null;
  createdAt: string;
  order: { orderNumber: string };
}

interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  isBlocked: boolean;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  addresses: {
    id: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[];
  orders: CustomerOrder[];
  returnRequests: CustomerReturn[];
  totalSpent: number;
  _count: {
    orders: number;
    reviews: number;
    wishlistItems: number;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/customers/${customerId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setCustomer(json.data);
        } else {
          throw new Error(json.message || "Failed to load customer");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Error loading customer");
      } finally {
        setLoading(false);
      }
    }
    if (customerId) fetchCustomer();
  }, [customerId]);

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
      SHIPPED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/10",
      DELIVERED: "bg-green-500/20 text-green-400 border-green-500/10",
      CANCELLED: "bg-red-500/20 text-red-400 border-red-500/10",
      PAID: "bg-green-500/20 text-green-400 border-green-500/10",
      APPROVED: "bg-green-500/20 text-green-400 border-green-500/10",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/10",
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

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-author-mid">Customer not found</p>
        <Link href="/admin/customers" className="text-author-cream text-sm hover:underline mt-2 inline-block">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-author-mid" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-author-cream/10 border border-author-cream/20 flex items-center justify-center text-lg font-heading font-bold text-author-cream">
            {(customer.name || customer.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-author-white">
              {customer.name || "Unnamed Customer"}
            </h1>
            <p className="text-author-mid text-sm">{customer.email}</p>
          </div>
          {customer.isBlocked && (
            <span className="text-[9px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/10 font-heading uppercase tracking-wider">
              Blocked
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column — Orders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Spent", value: formatPrice(customer.totalSpent) },
              { label: "Orders", value: customer._count.orders.toString() },
              { label: "Reviews", value: customer._count.reviews.toString() },
              { label: "Wishlist", value: customer._count.wishlistItems.toString() },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-lg p-4">
                <p className="text-lg font-heading font-bold text-author-white">{stat.value}</p>
                <p className="text-[10px] text-author-mid uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Order History */}
          <div className="glass rounded-lg overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Order History ({customer.orders.length})
              </h2>
            </div>
            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-author-mid">No orders placed</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-author-mid uppercase tracking-wider border-b border-white/5">
                      <th className="text-left p-4">Order #</th>
                      <th className="text-left p-4">Items</th>
                      <th className="text-left p-4">Total</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs text-author-cream hover:underline font-mono font-semibold"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="p-4 text-xs text-author-mid">{order._count.items}</td>
                        <td className="p-4 text-xs text-author-white font-semibold">{formatPrice(order.total)}</td>
                        <td className="p-4">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-author-mid">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Return Requests */}
          {customer.returnRequests.length > 0 && (
            <div className="glass rounded-lg overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Return Requests ({customer.returnRequests.length})
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {customer.returnRequests.map((ret) => (
                  <div key={ret.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-author-white font-semibold">
                        Order {ret.order.orderNumber}
                      </p>
                      <p className="text-[10px] text-author-mid mt-0.5 max-w-xs truncate">{ret.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading uppercase tracking-wider border ${getStatusColor(ret.status)}`}>
                        {ret.status}
                      </span>
                      {ret.refundAmount && (
                        <p className="text-[10px] text-author-mid mt-1">{formatPrice(ret.refundAmount)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Profile Info */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white mb-4">
              Contact Info
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-author-mid uppercase tracking-wider text-[10px]">Email</span>
                <p className="text-author-white mt-0.5">{customer.email}</p>
              </div>
              <div>
                <span className="text-author-mid uppercase tracking-wider text-[10px]">Phone</span>
                <p className="text-author-white mt-0.5">{customer.phone || "Not provided"}</p>
              </div>
              <div>
                <span className="text-author-mid uppercase tracking-wider text-[10px]">Member Since</span>
                <p className="text-author-white mt-0.5">
                  {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="glass rounded-lg p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" /> Addresses ({customer.addresses.length})
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-xs text-author-mid">No saved addresses</p>
            ) : (
              <div className="space-y-4">
                {customer.addresses.map((addr) => (
                  <div key={addr.id} className="text-xs text-author-mid space-y-0.5 border border-white/5 p-3 rounded-lg">
                    <p className="text-author-white font-semibold flex items-center gap-2">
                      {addr.fullName}
                      {addr.isDefault && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-author-cream/10 text-author-cream rounded-full border border-author-cream/20">
                          DEFAULT
                        </span>
                      )}
                    </p>
                    <p>{addr.phone}</p>
                    <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          {customer.internalNotes && (
            <div className="glass rounded-lg p-6">
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-author-white mb-4">
                Internal Notes
              </h2>
              <p className="text-xs text-author-mid whitespace-pre-wrap">{customer.internalNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
