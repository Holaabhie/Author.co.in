"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";

interface ReceiptItem {
  id: string;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number | null;
  discountAmount: number | null;
  totalPrice: number;
}

interface ReceiptOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shippingFee: number;
  tax: number;
  total: number;
  paidAt: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  items: ReceiptItem[];
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
  coupon: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

interface AdminOrderReceiptProps {
  order: ReceiptOrder;
}

/**
 * Admin Order Receipt / Bill — printable with @media print CSS.
 * Styled with AUTHOR luxury minimal design for clean print output.
 */
export default function AdminOrderReceipt({ order }: AdminOrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .admin-receipt, .admin-receipt * { visibility: visible; }
          .admin-receipt { 
            position: absolute; left: 0; top: 0; width: 100%;
            background: white !important; color: black !important;
            padding: 24px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div ref={receiptRef} className="admin-receipt bg-author-black border border-white/10 rounded-lg p-8 mt-6">
        {/* Print Button */}
        <div className="no-print flex justify-end mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-author-cream text-author-black text-xs font-heading uppercase tracking-wider font-bold rounded hover:bg-author-cream/90 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>

        {/* Receipt Header */}
        <div className="text-center border-b border-white/10 pb-6 mb-6 print:border-black/20">
          <h2 className="font-heading text-3xl font-bold tracking-[0.3em] text-author-cream print:text-black">
            AUTHOR
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-author-mid mt-2 print:text-gray-600">
            Order Receipt
          </p>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-author-mid/60 block print:text-gray-500">
                Order Number
              </span>
              <span className="text-author-white font-mono font-bold print:text-black">
                {order.orderNumber}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-author-mid/60 block print:text-gray-500">
                Order Date
              </span>
              <span className="text-author-white print:text-black">
                {formatDate(order.createdAt)}
              </span>
            </div>
            {order.paidAt && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-author-mid/60 block print:text-gray-500">
                  Payment Date
                </span>
                <span className="text-author-white print:text-black">
                  {formatDate(order.paidAt)}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-author-mid/60 block print:text-gray-500">
                Order Status
              </span>
              <span className="text-author-white font-bold uppercase print:text-black">
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-author-mid/60 block print:text-gray-500">
                Payment Status
              </span>
              <span className="text-author-white font-bold uppercase print:text-black">
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Address */}
        <div className="grid grid-cols-2 gap-6 mb-6 border-t border-white/10 pt-6 text-xs print:border-black/20">
          <div>
            <h4 className="text-[9px] uppercase tracking-wider text-author-mid/60 font-bold mb-2 print:text-gray-500">
              Customer Details
            </h4>
            <div className="space-y-1 text-author-white print:text-black">
              <p className="font-semibold">{order.user?.name || "Guest Checkout"}</p>
              <p className="text-author-mid print:text-gray-600">{order.user?.email}</p>
              {order.user?.phone && (
                <p className="text-author-mid font-mono print:text-gray-600">{order.user.phone}</p>
              )}
            </div>
          </div>
          {order.address && (
            <div>
              <h4 className="text-[9px] uppercase tracking-wider text-author-mid/60 font-bold mb-2 print:text-gray-500">
                Shipping Address
              </h4>
              <div className="space-y-0.5 text-author-mid print:text-gray-700">
                <p className="text-author-white font-semibold print:text-black">{order.address.fullName}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city}, {order.address.state} — {order.address.postalCode}</p>
                <p>{order.address.country}</p>
                <p className="font-mono mt-1">{order.address.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="border-t border-white/10 pt-6 mb-6 print:border-black/20">
          <h4 className="text-[9px] uppercase tracking-wider text-author-mid/60 font-bold mb-3 print:text-gray-500">
            Order Items
          </h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-author-mid/60 text-[9px] uppercase tracking-wider print:border-black/20 print:text-gray-500">
                <th className="text-left pb-2">Product</th>
                <th className="text-center pb-2">Variant</th>
                <th className="text-center pb-2">Qty</th>
                <th className="text-right pb-2">Unit Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const hasDiscount = item.originalUnitPrice && item.discountAmount && item.discountAmount > 0;
                return (
                  <tr key={item.id} className="border-b border-white/5 print:border-black/10">
                    <td className="py-3 text-author-white font-medium uppercase tracking-wider print:text-black">
                      {item.productName}
                    </td>
                    <td className="py-3 text-center text-author-mid print:text-gray-600">
                      {[item.size, item.color].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="py-3 text-center text-author-white print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-author-white print:text-black">
                      {hasDiscount ? (
                        <span>
                          <span className="line-through text-author-mid/40 mr-1 print:text-gray-400">
                            {formatPrice(item.originalUnitPrice!)}
                          </span>
                          {formatPrice(item.unitPrice)}
                        </span>
                      ) : (
                        formatPrice(item.unitPrice)
                      )}
                    </td>
                    <td className="py-3 text-right text-author-white font-semibold print:text-black">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-white/10 pt-4 space-y-2 text-xs print:border-black/20">
          {order.discount > 0 && (
            <>
              <div className="flex justify-between text-author-mid print:text-gray-600">
                <span>Original Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-green-400 print:text-green-600">
                <span>
                  Coupon Discount
                  {order.discountCode && ` (${order.discountCode})`}
                  {order.coupon && ` — ${order.coupon.code}`}
                </span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            </>
          )}
          {order.shippingFee > 0 && (
            <div className="flex justify-between text-author-mid print:text-gray-600">
              <span>Shipping</span>
              <span>{formatPrice(order.shippingFee)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between text-author-mid print:text-gray-600">
              <span>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-author-cream border-t border-white/10 pt-3 mt-3 print:text-black print:border-black/20">
            <span>TOTAL PAID</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Payment Info */}
        {(order.razorpayOrderId || order.razorpayPaymentId) && (
          <div className="border-t border-white/10 mt-6 pt-4 text-xs text-author-mid print:border-black/20 print:text-gray-600">
            <h4 className="text-[9px] uppercase tracking-wider text-author-mid/60 font-bold mb-2 print:text-gray-500">
              Payment Details
            </h4>
            {order.razorpayOrderId && (
              <p>Razorpay Order ID: <span className="font-mono text-author-white print:text-black">{order.razorpayOrderId}</span></p>
            )}
            {order.razorpayPaymentId && (
              <p>Razorpay Payment ID: <span className="font-mono text-author-white print:text-black">{order.razorpayPaymentId}</span></p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
