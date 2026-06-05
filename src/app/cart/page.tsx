"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTax, getTotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();
  const shippingCost = subtotal >= 999 ? 0 : 99;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 section-padding bg-white text-black light-page">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-black/20 mx-auto mb-6" />
          <h1 className="heading-serif text-3xl md:text-5xl mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-black/60 text-sm mb-10">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link href="/shop" className="btn-outline-dark inline-block">
            <span>Explore Collection</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 bg-white text-black light-page">
      <div className="section-padding py-12 md:py-20 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="label-uppercase text-black/40">
              Shopping
            </span>
            <h1 className="heading-serif text-4xl md:text-6xl mt-3">
              Cart ({itemCount})
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="section-padding py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="divide-y divide-black/10">
                {items.map((item) => {
                  const effectivePrice = item.salePrice ?? item.price;
                  return (
                    <motion.div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-4 md:gap-8 py-8"
                    >
                      <Link
                        href={`/product/${item.slug}`}
                        className="relative w-28 h-36 md:w-36 md:h-48 flex-shrink-0 bg-[#F5F5F5] overflow-hidden group"
                      >
                        <Image 
                          src={item.image} 
                          alt={item.name} 
                          fill 
                          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105" 
                          sizes="144px" 
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/product/${item.slug}`}>
                              <h3 className="text-sm md:text-base tracking-wide text-black hover:text-black/70 transition-colors line-clamp-2">
                                {item.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-3">
                              <div
                                className="w-3.5 h-3.5 rounded-full border border-black/10"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <span className="text-xs text-black/50 label-uppercase">
                                {item.color} / {item.size}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-sm font-medium text-black">
                                ₹{effectivePrice.toLocaleString()}
                              </span>
                              {item.salePrice && (
                                <span className="text-[10px] text-black/40 line-through">
                                  ₹{item.price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="hidden md:block text-right">
                            <span className="text-base font-medium">
                              ₹{(effectivePrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 md:border-none">
                          <div className="flex items-center bg-[#F5F5F5]">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.size, item.color, item.quantity - 1)
                              }
                              className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-black/70" />
                            </button>
                            <span className="w-10 text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.size, item.color, item.quantity + 1)
                              }
                              className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-black/70" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="text-xs text-black/40 hover:text-black transition-colors uppercase tracking-wider underline underline-offset-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs text-black/60 hover:text-black transition-colors mt-8 uppercase tracking-[0.15em] font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <div>
              <div className="bg-[#F5F5F5] p-8 lg:p-10 sticky top-32">
                <h3 className="label-uppercase tracking-[0.2em] mb-8 font-bold text-black border-b border-black/10 pb-4">
                  Order Summary
                </h3>

                <div className="space-y-4 text-sm mb-8">
                  <div className="flex justify-between text-black/70">
                    <span>Subtotal</span>
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
                        <span className="text-black font-medium text-xs tracking-wider uppercase">Free</span>
                      ) : (
                        <span className="text-black">₹{shippingCost}</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="border-t border-black/10 pt-4 mt-6">
                    <div className="flex justify-between text-base">
                      <span className="font-medium text-black">Total</span>
                      <span className="font-medium text-black">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full block btn-primary-light !bg-black !text-white hover:!bg-[#111] text-center"
                >
                  <span>Checkout</span>
                </Link>

                {subtotal < 999 && (
                  <p className="text-[10px] uppercase tracking-wider text-black/60 text-center mt-6">
                    Add <span className="font-medium text-black">₹{(999 - subtotal).toLocaleString()}</span> more for free shipping
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
