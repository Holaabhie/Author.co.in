"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getItemCount,
    getSubtotal,
    getTax,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();
  const shippingCost = subtotal >= 999 ? 0 : 99;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-author-charcoal z-[90] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-7 border-b border-white/5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-[18px] h-[18px] text-author-mid" strokeWidth={1.2} />
                <span
                  className="text-[11px] uppercase tracking-[0.25em] text-author-white/80"
                  style={{ fontWeight: 300 }}
                >
                  Shopping Bag
                </span>
                {itemCount > 0 && (
                  <span
                    className="text-[10px] text-author-mid tracking-[0.15em] ml-1"
                    style={{ fontWeight: 300 }}
                  >
                    ({itemCount})
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-white/5 transition-colors"
                aria-label="Close cart"
              >
                <X className="w-[18px] h-[18px] text-author-mid" strokeWidth={1.2} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <ShoppingBag className="w-10 h-10 text-author-grey mb-8" strokeWidth={1} />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-author-white/60 mb-2"
                    style={{ fontWeight: 300 }}
                  >
                    Your bag is empty
                  </p>
                  <p
                    className="text-[10px] text-author-mid/50 mb-10 tracking-[0.1em]"
                    style={{ fontWeight: 300 }}
                  >
                    Nothing here yet — go explore.
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="inline-block border border-white/15 text-author-white/70 hover:text-author-white hover:border-white/30 transition-all duration-500 py-3.5 px-10 text-[10px] uppercase tracking-[0.25em]"
                    style={{ fontWeight: 300 }}
                  >
                    Browse Collection
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {items.map((item) => {
                    const effectivePrice = item.salePrice ?? item.price;
                    return (
                      <motion.div
                        key={item.variantId}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="flex gap-5 px-8 py-6"
                      >
                        {/* Image */}
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="relative w-[72px] h-[92px] flex-shrink-0 bg-author-black/40 overflow-hidden"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="72px"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Product Name — tracked uppercase, lightweight */}
                            <Link
                              href={`/product/${item.slug}`}
                              onClick={closeCart}
                              className="block text-[10px] uppercase tracking-[0.15em] text-author-white/80 hover:text-author-white transition-colors line-clamp-2 leading-relaxed"
                              style={{ fontWeight: 400, fontFamily: "var(--font-barlow-condensed), sans-serif" }}
                            >
                              {item.name}
                            </Link>
                            {/* Variant — smaller, muted */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div
                                  className="w-2.5 h-2.5 rounded-full border border-white/10"
                                  style={{ backgroundColor: item.colorHex }}
                              />
                              <span
                                className="text-[9px] text-author-mid/60 uppercase tracking-[0.1em]"
                                style={{ fontWeight: 300 }}
                              >
                                {item.color} / {item.size}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity stepper — minimal, no fill */}
                            <div className="flex items-center border border-white/[0.08]">
                              <button
                                onClick={() =>
                                  updateQuantity(item.variantId, item.quantity - 1)
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/[0.03] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-2.5 h-2.5 text-author-mid/60" strokeWidth={1.2} />
                              </button>
                              <span
                                className="w-7 h-7 flex items-center justify-center text-[10px] border-x border-white/[0.08] text-author-white/70 relative overflow-hidden"
                              >
                                <AnimatePresence mode="popLayout" initial={false}>
                                  <motion.span
                                    key={item.quantity}
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -12, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute"
                                    style={{ fontWeight: 300 }}
                                  >
                                    {item.quantity}
                                  </motion.span>
                                </AnimatePresence>
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.variantId, item.quantity + 1)
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/[0.03] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-2.5 h-2.5 text-author-mid/60" strokeWidth={1.2} />
                              </button>
                            </div>

                            {/* Price — right-aligned, serif, lightweight */}
                            <span
                              className="text-[11px] text-author-white/70"
                              style={{ fontWeight: 300, fontFamily: "var(--font-barlow-condensed), sans-serif" }}
                            >
                              ₹{(effectivePrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="p-1 self-start text-author-mid/30 hover:text-author-mid/60 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.2} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary — editorial, lightweight */}
            {items.length > 0 && (
              <div className="border-t border-white/[0.06] px-8 py-7 space-y-5">
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span
                      className="text-[9px] uppercase tracking-[0.12em] text-author-mid/50"
                      style={{ fontWeight: 300 }}
                    >
                      Subtotal
                    </span>
                    <span
                      className="text-[11px] text-author-white/60"
                      style={{ fontWeight: 300, fontFamily: "var(--font-barlow-condensed), sans-serif" }}
                    >
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-[9px] uppercase tracking-[0.12em] text-author-mid/50"
                      style={{ fontWeight: 300 }}
                    >
                      GST (18%)
                    </span>
                    <span
                      className="text-[11px] text-author-white/60"
                      style={{ fontWeight: 300, fontFamily: "var(--font-barlow-condensed), sans-serif" }}
                    >
                      ₹{tax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-[9px] uppercase tracking-[0.12em] text-author-mid/50"
                      style={{ fontWeight: 300 }}
                    >
                      Shipping
                    </span>
                    <span
                      className="text-[11px] text-author-white/60"
                      style={{ fontWeight: 300, fontFamily: "var(--font-barlow-condensed), sans-serif" }}
                    >
                      {shippingCost === 0 ? (
                        <span className="text-author-white/40 uppercase tracking-[0.1em] text-[9px]">Complimentary</span>
                      ) : (
                        `₹${shippingCost}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-3 border-t border-white/[0.05]">
                    <span
                      className="text-[10px] uppercase tracking-[0.12em] text-author-white/60"
                      style={{ fontWeight: 400 }}
                    >
                      Total
                    </span>
                    <span
                      className="text-[14px] text-author-white/90"
                      style={{ fontWeight: 400, fontFamily: "var(--font-barlow-condensed), sans-serif" }}
                    >
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full bg-author-white/[0.08] hover:bg-author-white/[0.12] text-author-white/80 hover:text-author-white py-4 text-[10px] uppercase tracking-[0.25em] transition-all duration-500 flex items-center justify-center"
                  style={{ fontWeight: 400 }}
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full text-center text-[9px] text-author-mid/40 hover:text-author-mid/60 transition-colors uppercase tracking-[0.2em] py-1"
                  style={{ fontWeight: 300 }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
