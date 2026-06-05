"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  Truck,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

type CheckoutStep = "address" | "review" | "payment";

export default function CheckoutPage() {
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [isProcessing, setIsProcessing] = useState(false);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const shippingCost = subtotal >= 999 ? 0 : 99;

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.postalCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep("review");
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // In production, this would create a Stripe checkout session
      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearCart();
      window.location.href = "/checkout/success?order=ORD" + Date.now();
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-white text-black light-page">
        <div className="text-center">
          <h1 className="heading-serif text-3xl font-bold mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-black/60 mb-8">Add some items to get started.</p>
          <Link href="/shop" className="btn-outline-dark inline-block">
            <span>Shop Collection</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-white text-black light-page">
      <div className="section-padding py-8 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-16 border-b border-black/10 pb-8">
            {[
              { key: "address", label: "Address", icon: MapPin },
              { key: "review", label: "Review", icon: ShieldCheck },
              { key: "payment", label: "Payment", icon: CreditCard },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 text-xs label-uppercase tracking-wider transition-colors ${
                    step === s.key
                      ? "text-black font-semibold"
                      : (s.key === "address" && step !== "address") ||
                        (s.key === "review" && step === "payment")
                      ? "text-green-600"
                      : "text-black/40"
                  }`}
                >
                  {(s.key === "address" && step !== "address") ||
                  (s.key === "review" && step === "payment") ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                  <span className="hidden sm:block">{s.label}</span>
                </div>
                {i < 2 && (
                  <ChevronRight className="w-4 h-4 text-black/20 mx-2" />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {step === "address" && (
                  <div>
                    <h2 className="heading-serif text-3xl mb-8">
                      Shipping Address
                    </h2>
                    <form onSubmit={handleAddressSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={address.fullName}
                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                            required
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            value={address.phone}
                            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                            required
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            placeholder="+91"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block label-uppercase text-black/60 mb-2">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={address.line1}
                          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                          required
                          className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          placeholder="Street address, apartment, etc."
                        />
                      </div>

                      <div>
                        <label className="block label-uppercase text-black/60 mb-2">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={address.line2}
                          onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                          className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          placeholder="Landmark (optional)"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            required
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            value={address.state}
                            onChange={(e) => setAddress({ ...address, state: e.target.value })}
                            required
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            value={address.postalCode}
                            onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                            required
                            maxLength={6}
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full btn-primary-light !bg-black !text-white hover:!bg-[#111] py-4 flex items-center justify-center gap-2 mt-8"
                      >
                        Continue to Review <ChevronRight className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {step === "review" && (
                  <div>
                    <h2 className="heading-serif text-3xl mb-8">
                      Review Order
                    </h2>

                    {/* Shipping Address Summary */}
                    <div className="bg-[#F5F5F5] p-6 mb-8 border border-black/5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs label-uppercase tracking-wider font-semibold flex items-center gap-2">
                          <Truck className="w-4 h-4 text-black" />
                          Shipping To
                        </h3>
                        <button
                          onClick={() => setStep("address")}
                          className="text-xs text-black/60 hover:text-black underline underline-offset-4"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-black/80 leading-relaxed">
                        {address.fullName}<br />
                        {address.line1}
                        {address.line2 && <>, {address.line2}</>}<br />
                        {address.city}, {address.state} — {address.postalCode}<br />
                        Phone: {address.phone}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="border border-black/10 divide-y divide-black/10">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 p-5">
                          <div className="relative w-16 h-20 flex-shrink-0 bg-[#F5F5F5] overflow-hidden">
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-sm font-medium tracking-wide truncate">
                              {item.name}
                            </h4>
                            <p className="text-[10px] label-uppercase text-black/60 mt-1.5">
                              {item.color} / {item.size} × {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium flex items-center">
                            ₹{((item.salePrice ?? item.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep("payment")}
                      className="w-full btn-primary-light !bg-black !text-white hover:!bg-[#111] py-4 flex items-center justify-center gap-2 mt-8"
                    >
                      Proceed to Payment <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {step === "payment" && (
                  <div>
                    <h2 className="heading-serif text-3xl mb-8">
                      Payment
                    </h2>

                    <div className="bg-[#F5F5F5] border border-black/5 p-10 text-center">
                      <ShieldCheck className="w-12 h-12 text-black mx-auto mb-6" />
                      <h3 className="heading-serif text-2xl mb-3">
                        Secure Payment
                      </h3>
                      <p className="text-sm text-black/70 mb-8 max-w-sm mx-auto leading-relaxed">
                        Your payment is processed securely. We never store your card details on our servers.
                      </p>

                      <div className="flex items-center justify-center gap-4 mb-10">
                        {["Visa", "Mastercard", "UPI", "Amex"].map((method) => (
                          <span
                            key={method}
                            className="text-[10px] px-3 py-1.5 bg-white border border-black/10 text-black/80 label-uppercase tracking-wider"
                          >
                            {method}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="w-full btn-primary-light !bg-black !text-white hover:!bg-[#111] py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Pay ₹{total.toLocaleString()}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-[#F5F5F5] border border-black/5 p-8 sticky top-32">
                <h3 className="text-xs label-uppercase tracking-widest font-semibold border-b border-black/10 pb-5 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-black/70">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="text-black">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>GST (18%)</span>
                    <span className="text-black">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600 font-medium label-uppercase">FREE</span>
                      ) : (
                        <span className="text-black">₹{shippingCost}</span>
                      )}
                    </span>
                  </div>
                  <div className="border-t border-black/10 pt-5 mt-6">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Total</span>
                      <span className="font-medium">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3 pt-6 border-t border-black/10 text-[10px] text-black/60 label-uppercase">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-black" />
                    <span>Free shipping on orders ₹999+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
