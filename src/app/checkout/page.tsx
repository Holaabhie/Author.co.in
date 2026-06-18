"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useCartStore } from "@/lib/store/cart";
import { useUser } from "@/hooks/use-user";
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  Truck,
  ChevronRight,
  Loader2,
  Check,
  X,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

type CheckoutStep = "address" | "review" | "payment";

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function CheckoutPage() {
  const { items, getSubtotal, getTax, getTotal, clearCartAndStorage, couponCode, couponResult, getCouponDiscount } = useCartStore();
  const { user, loading: userLoading } = useUser();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [isProcessing, setIsProcessing] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Address Form State
  const [formAddress, setFormAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Inline validation errors state
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  // Mock payment modal state
  const [mockPaymentData, setMockPaymentData] = useState<any | null>(null);

  const subtotal = getSubtotal();
  const couponDiscount = getCouponDiscount();
  const tax = getTax();
  const total = getTotal();
  const shippingCost = subtotal >= 999 ? 0 : 99;

  // Fetch addresses on mount if user is loaded
  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else if (!userLoading) {
      setLoadingAddresses(false);
      setShowAddressForm(true);
    }
  }, [user, userLoading]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await fetch("/api/addresses");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAddresses(json.data);
        if (json.data.length > 0) {
          const def = json.data.find((a: any) => a.isDefault) || json.data[0];
          setSelectedAddressId(def.id);
          setShowAddressForm(false);
        } else {
          setShowAddressForm(true);
        }
      } else {
        setShowAddressForm(true);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setShowAddressForm(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formAddress.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    if (!formAddress.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formAddress.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits";
    }
    if (!formAddress.line1.trim()) {
      errors.line1 = "Address line 1 is required";
    }
    if (!formAddress.city.trim()) {
      errors.city = "City is required";
    }
    if (!formAddress.state.trim()) {
      errors.state = "State is required";
    }
    if (!formAddress.postalCode.trim()) {
      errors.postalCode = "PIN code is required";
    } else if (!/^\d{6}$/.test(formAddress.postalCode.trim())) {
      errors.postalCode = "PIN code must be exactly 6 digits";
    }
    setInlineErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showAddressForm) {
      if (!validateForm()) return;
    } else {
      if (!selectedAddressId) {
        setInlineErrors({ addressSelection: "Please select a shipping address" });
        return;
      }
    }
    setInlineErrors({});
    setStep("review");
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setInlineErrors({});
    try {
      const payload: any = {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      };

      // Include coupon code if applied (server recalculates everything)
      if (couponCode) {
        payload.couponCode = couponCode;
      }

      if (showAddressForm) {
        payload.shippingAddress = formAddress;
      } else {
        payload.addressId = selectedAddressId;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create checkout session");
      }

      const checkoutData = json.data;
      const rzpOrderId = checkoutData.razorpayOrderId;

      if (rzpOrderId.startsWith("order_MOCK_")) {
        // Show premium mock payment modal
        setMockPaymentData(checkoutData);
      } else {
        // Trigger Razorpay payment sheet
        const options = {
          key: checkoutData.razorpayKeyId,
          amount: checkoutData.amount,
          currency: checkoutData.currency,
          name: "AUTHOR",
          description: "Order Checkout",
          order_id: rzpOrderId,
          prefill: checkoutData.prefill,
          handler: async function (response: any) {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          theme: { color: "#C8956C" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error("Payment Failed");
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Server Error");
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (verifyPayload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Payment verification failed");
      }
      clearCartAndStorage();
      window.location.href = `/order-confirmation/${json.data.orderId}`;
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.message || "Payment Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMockPaymentSuccess = async () => {
    if (!mockPaymentData) return;
    setIsProcessing(true);
    try {
      await verifyPayment({
        razorpay_order_id: mockPaymentData.razorpayOrderId,
        razorpay_payment_id: "pay_MOCK_" + Math.random().toString(36).substring(2, 15),
        razorpay_signature: "mock_signature_123456",
      });
    } catch (err: any) {
      toast.error(err.message || "Payment Failed");
    } finally {
      setIsProcessing(false);
      setMockPaymentData(null);
    }
  };

  const getSelectedAddressDetails = () => {
    if (showAddressForm) {
      return formAddress;
    }
    const addr = addresses.find((a: any) => a.id === selectedAddressId);
    return addr || formAddress;
  };

  const activeAddr = getSelectedAddressDetails();

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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Mock Payment Modal Overlay */}
      <AnimatePresence>
        {mockPaymentData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMockPaymentData(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#0F0F0F] text-white border border-[#C8956C]/30 p-8 rounded-none shadow-2xl z-10 space-y-6"
            >
              <button
                onClick={() => setMockPaymentData(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center space-y-2">
                <span className="text-[9px] uppercase tracking-[0.3em] text-[#C8956C] font-semibold">Razorpay Test Mode</span>
                <h3 className="text-xl uppercase tracking-wider font-light text-neutral-200">Simulate Payment</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  This checkout is running in sandbox mode. Select an action below to complete checkout.
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-5 space-y-3">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Order Reference</span>
                  <span className="text-neutral-200 font-semibold">{mockPaymentData.orderNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Amount Due</span>
                  <span className="text-[#C8956C] font-bold">₹{(mockPaymentData.amount / 100).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleMockPaymentSuccess}
                  disabled={isProcessing}
                  className="w-full bg-[#C8956C] hover:bg-[#d4a07a] text-black py-3.5 text-xs uppercase tracking-[0.25em] font-bold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Authorize Success"
                  )}
                </button>
                <button
                  onClick={() => {
                    setMockPaymentData(null);
                    toast.error("Payment Cancelled");
                  }}
                  className="w-full border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white py-3.5 text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300"
                >
                  Cancel Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <div className="space-y-8">
                    <h2 className="heading-serif text-3xl">
                      Shipping Address
                    </h2>

                    {/* Address Selection from Saved Addresses */}
                    {!showAddressForm && addresses.length > 0 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                setInlineErrors({});
                              }}
                              className={`p-5 border cursor-pointer transition-all duration-300 relative text-left ${
                                selectedAddressId === addr.id
                                  ? "border-black bg-neutral-50/50"
                                  : "border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] uppercase tracking-[0.15em] font-bold bg-neutral-100 px-2 py-0.5">
                                  {addr.label}
                                </span>
                                {selectedAddressId === addr.id && (
                                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold mb-1">{addr.fullName}</p>
                              <p className="text-xs text-neutral-600 leading-relaxed">
                                {addr.line1}
                                {addr.line2 && <>, {addr.line2}</>}
                              </p>
                              <p className="text-xs text-neutral-600 leading-relaxed">
                                {addr.city}, {addr.state} — {addr.postalCode}
                              </p>
                              <p className="text-xs text-neutral-500 mt-2">Phone: {addr.phone}</p>
                            </div>
                          ))}
                        </div>

                        {inlineErrors.addressSelection && (
                          <p className="text-xs text-red-600 font-semibold">{inlineErrors.addressSelection}</p>
                        )}

                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setShowAddressForm(true);
                              setFormAddress({
                                fullName: "",
                                phone: "",
                                line1: "",
                                line2: "",
                                city: "",
                                state: "",
                                postalCode: "",
                              });
                            }}
                            className="border border-black px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-neutral-50"
                          >
                            + Add New Address
                          </button>
                          <button
                            onClick={handleAddressSubmit}
                            className="flex-1 bg-black text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-neutral-900"
                          >
                            Deliver to Selected Address
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Address Creation Form */}
                    {showAddressForm && (
                      <form onSubmit={handleAddressSubmit} className="space-y-5">
                        {addresses.length > 0 && (
                          <div className="text-left mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddressForm(false);
                                setInlineErrors({});
                              }}
                              className="text-xs text-neutral-500 hover:text-black underline uppercase tracking-widest font-bold"
                            >
                              ← Select from saved addresses
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block label-uppercase text-black/60 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={formAddress.fullName}
                              onChange={(e) => setFormAddress({ ...formAddress, fullName: e.target.value })}
                              className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            />
                            {inlineErrors.fullName && (
                              <p className="text-xs text-red-600 font-medium mt-1">{inlineErrors.fullName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block label-uppercase text-black/60 mb-2">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              value={formAddress.phone}
                              onChange={(e) => setFormAddress({ ...formAddress, phone: e.target.value })}
                              className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                              placeholder="10-digit number"
                            />
                            {inlineErrors.phone && (
                              <p className="text-xs text-red-600 font-medium mt-1">{inlineErrors.phone}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            Address Line 1 *
                          </label>
                          <input
                            type="text"
                            value={formAddress.line1}
                            onChange={(e) => setFormAddress({ ...formAddress, line1: e.target.value })}
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            placeholder="Flat/House number, Street name"
                          />
                          {inlineErrors.line1 && (
                            <p className="text-xs text-red-600 font-medium mt-1">{inlineErrors.line1}</p>
                          )}
                        </div>

                        <div>
                          <label className="block label-uppercase text-black/60 mb-2">
                            Address Line 2 (Optional)
                          </label>
                          <input
                            type="text"
                            value={formAddress.line2}
                            onChange={(e) => setFormAddress({ ...formAddress, line2: e.target.value })}
                            className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            placeholder="Landmark, locality etc."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div>
                            <label className="block label-uppercase text-black/60 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              value={formAddress.city}
                              onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })}
                              className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            />
                            {inlineErrors.city && (
                              <p className="text-xs text-red-600 font-medium mt-1">{inlineErrors.city}</p>
                            )}
                          </div>
                          <div>
                            <label className="block label-uppercase text-black/60 mb-2">
                              State *
                            </label>
                            <select
                              value={formAddress.state}
                              onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })}
                              className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            {inlineErrors.state && (
                              <p className="text-xs text-red-600 font-medium mt-1">{inlineErrors.state}</p>
                            )}
                          </div>
                          <div>
                            <label className="block label-uppercase text-black/60 mb-2">
                              PIN Code *
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={formAddress.postalCode}
                              onChange={(e) => setFormAddress({ ...formAddress, postalCode: e.target.value })}
                              className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                              placeholder="6 digits"
                            />
                            {inlineErrors.postalCode && (
                              <p className="text-xs text-red-600 font-medium mt-1">{inlineErrors.postalCode}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full btn-primary-light !bg-black !text-white hover:!bg-[#111] py-4 flex items-center justify-center gap-2 mt-8"
                        >
                          Continue to Review <ChevronRight className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {step === "review" && (
                  <div>
                    <h2 className="heading-serif text-3xl mb-8">
                      Review Order
                    </h2>

                    {/* Shipping Address Summary */}
                    <div className="bg-[#F5F5F5] p-6 mb-8 border border-black/5 text-left">
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
                      <p className="text-sm text-black/80 leading-relaxed font-semibold">
                        {activeAddr.fullName}
                      </p>
                      <p className="text-sm text-black/80 leading-relaxed">
                        {activeAddr.line1}
                        {activeAddr.line2 && <>, {activeAddr.line2}</>}<br />
                        {activeAddr.city}, {activeAddr.state} — {activeAddr.postalCode}<br />
                        Phone: {activeAddr.phone}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="border border-black/10 divide-y divide-black/10 text-left">
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
                        Your payment is processed securely via Razorpay. We never store your card details on our servers.
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
              <div className="bg-[#F5F5F5] border border-black/5 p-8 sticky top-32 text-left">
                <h3 className="text-xs label-uppercase tracking-widest font-semibold border-b border-black/10 pb-5 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 text-sm">
                  {couponDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60">Subtotal</span>
                        <span className="text-black/60">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Coupon ({couponCode})
                        </span>
                        <span>−₹{couponDiscount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-[#C8956C]">₹{total.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-black/60 text-right mt-2 border-t border-black/10 pt-4">
                    Inclusive of all charges.
                  </p>
                </div>

                <div className="mt-8 space-y-3 pt-6 border-t border-black/10 text-[10px] text-black/60 label-uppercase">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL encryption</span>
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
