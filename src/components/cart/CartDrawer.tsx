"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
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
  const freeShippingThreshold = 999;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 99;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

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
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-heading text-lg font-semibold uppercase tracking-wider">
                  Cart
                </span>
                {itemCount > 0 && (
                  <span className="text-xs bg-author-cream text-author-black px-2 py-0.5 font-heading font-semibold">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            {items.length > 0 && amountToFreeShipping > 0 && (
              <div className="px-6 py-3 bg-author-black/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-author-mid">
                    ₹{amountToFreeShipping.toLocaleString()} away from free shipping
                  </span>
                  <span className="text-xs text-author-cream">🚚</span>
                </div>
                <div className="w-full h-1 bg-author-grey rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-author-cream rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {items.length > 0 && subtotal >= freeShippingThreshold && (
              <div className="px-6 py-2 bg-green-500/10 text-green-400 text-xs text-center font-heading uppercase tracking-wider">
                ✓ You&apos;ve unlocked free shipping!
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <ShoppingBag className="w-16 h-16 text-author-grey mb-4" />
                  <p className="font-heading text-lg font-semibold uppercase tracking-wider mb-2">
                    Your cart is empty
                  </p>
                  <p className="text-author-mid text-sm mb-8">
                    Looks like you haven&apos;t added anything yet.
                  </p>
                  <button
                    onClick={closeCart}
                    className="btn-primary"
                  >
                    <span>
                      <Link href="/shop">Start Shopping</Link>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {items.map((item) => {
                    const effectivePrice = item.salePrice ?? item.price;
                    return (
                      <motion.div
                        key={`${item.productId}-${item.size}-${item.color}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="flex gap-4 p-6"
                      >
                        {/* Image */}
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="relative w-20 h-24 flex-shrink-0 bg-author-black overflow-hidden"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="font-heading text-xs uppercase tracking-wider text-author-white/90 hover:text-author-white transition-colors line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div
                              className="w-3 h-3 rounded-full border border-white/20"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span className="text-[10px] text-author-mid uppercase">
                              {item.color} / {item.size}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity */}
                            <div className="flex items-center border border-white/10">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.size,
                                    item.color,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/5 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 h-7 flex items-center justify-center text-xs font-heading border-x border-white/10">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.size,
                                    item.color,
                                    item.quantity + 1
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/5 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Price */}
                            <span className="font-heading text-sm font-semibold text-author-cream">
                              ₹{(effectivePrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() =>
                            removeItem(item.productId, item.size, item.color)
                          }
                          className="p-1 self-start text-author-mid hover:text-red-400 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {items.length > 0 && (
              <div className="border-t border-white/5 p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-author-mid">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-author-mid">
                    <span>GST (18%)</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-author-mid">
                    <span>Shipping</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-400">FREE</span>
                      ) : (
                        `₹${shippingCost}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-heading font-semibold text-base pt-2 border-t border-white/5">
                    <span>Total</span>
                    <span className="text-author-cream">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full bg-author-cream text-author-black py-4 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-2"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full text-center text-xs text-author-mid hover:text-author-white transition-colors uppercase tracking-wider font-heading py-2"
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
