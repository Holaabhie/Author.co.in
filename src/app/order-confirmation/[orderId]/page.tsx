"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Package, Calendar, ArrowRight, FileText } from "lucide-react";
import { AuthorLoader } from "@/components/ui/AuthorLoader";

interface OrderItem {
  id: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  address?: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
  } | null;
}

function AnimatedCheck() {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[72px] h-[72px]"
      aria-hidden="true"
    >
      <motion.circle
        cx="36"
        cy="36"
        r="33"
        stroke="#C8956C"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      />
      <motion.path
        d="M22 36.5L31.5 46L50 27"
        stroke="#C8956C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.65 }}
      />
    </svg>
  );
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load order details");
        return res.json();
      })
      .then((resJson) => {
        if (resJson.success) {
          setOrder(resJson.data);
        } else {
          setError(resJson.message || "Order not found");
        }
      })
      .catch((err) => {
        console.error("Error fetching order:", err);
        setError("We couldn't load your order details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return <AuthorLoader fullscreen />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white section-padding">
        <div className="max-w-md w-full text-center border border-neutral-800 p-10 bg-[#0F0F0F]">
          <h2 className="text-lg uppercase tracking-wider text-red-500 mb-4">Error Loading Order</h2>
          <p className="text-sm text-neutral-400 mb-8">{error || "Order not found."}</p>
          <Link
            href="/shop"
            className="inline-block border border-[#C8956C] text-[#C8956C] hover:bg-[#C8956C] hover:text-black transition-all duration-300 py-3.5 px-8 text-[10px] uppercase tracking-[0.2em] font-bold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Estimated delivery: +5 days
  const deliveryDate = new Date(order.createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const estimatedDelivery = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 md:pt-32 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        
        {/* Animated Checkmark and Title */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="mb-6">
            <AnimatedCheck />
          </div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.3 }}
            className="text-[10px] uppercase tracking-[0.4em] text-[#C8956C] font-bold mb-2"
          >
            Order Confirmed
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.3 }}
            className="text-xl md:text-3xl font-light uppercase tracking-wider text-neutral-200 mt-2"
          >
            Thank you for your order
          </motion.h1>
          <p className="text-[11px] text-neutral-500 tracking-wider mt-2">
            A confirmation email has been sent to your registered address.
          </p>
        </div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="border border-neutral-800 bg-[#0F0F0F] p-6 md:p-8 space-y-6 mb-8"
        >
          {/* Header row */}
          <div className="flex justify-between items-center pb-4 border-b border-neutral-800/60">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500">Order Number</span>
              <p className="text-sm font-bold text-neutral-200 tracking-wider mt-1">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500">Status</span>
              <p className="text-xs font-bold text-green-500 uppercase tracking-widest mt-1">Paid</p>
            </div>
          </div>

          {/* Delivery estimate */}
          <div className="flex items-start gap-4">
            <Calendar className="w-5 h-5 text-neutral-400 mt-0.5" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500">Estimated Delivery</span>
              <p className="text-xs text-neutral-200 font-semibold mt-1">{estimatedDelivery}</p>
            </div>
          </div>

          {/* Shipping address */}
          {order.address && (
            <div className="flex items-start gap-4 pt-2">
              <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500">Shipping Address</span>
                <div className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  <p className="font-semibold text-neutral-100">{order.address.fullName}</p>
                  <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                  <p>{order.address.city}, {order.address.state} — {order.address.postalCode}</p>
                  <p className="text-neutral-500 mt-1">Phone: {order.address.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Items Summary */}
          <div className="pt-4 border-t border-neutral-800/60">
            <span className="text-[9px] uppercase tracking-wider text-neutral-500 block mb-3">Items Ordered</span>
            <div className="divide-y divide-neutral-800/40">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between text-xs">
                  <div>
                    <span className="text-neutral-200 uppercase font-semibold tracking-wide">{item.productName}</span>
                    <span className="block text-[10px] text-neutral-500 uppercase mt-1">
                      {item.color} / {item.size} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold text-neutral-200">
                    ₹{(item.totalPrice / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-4 border-t border-neutral-800/60 space-y-2 text-xs">
            <div className="flex justify-between items-baseline pt-3 text-sm">
              <span className="uppercase tracking-wider font-semibold">Total Paid</span>
              <span className="text-base text-[#C8956C] font-bold">
                ₹{(order.total / 100).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-neutral-500 text-right mt-1">
              Inclusive of all charges.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.3 }}
          className="space-y-4"
        >
          <Link
            href="/shop"
            className="w-full bg-[#C8956C] hover:bg-[#d4a07a] text-black py-4 text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-300 flex items-center justify-center gap-2"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={`/api/orders/${orderId}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full border border-neutral-800 hover:border-[#C8956C] text-neutral-400 hover:text-[#C8956C] py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> Download Invoice
          </a>
          <Link
            href="/account?tab=orders"
            className="w-full border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-center"
          >
            Track Order / View History
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
