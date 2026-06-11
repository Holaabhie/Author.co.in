'use client';

import { motion } from 'framer-motion';
import { Truck, RotateCcw, ShieldCheck, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-white text-black font-sans">
      {/* Hero Header */}
      <section className="section-padding py-16 md:py-24 border-b border-black/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold">
              Our Story & Policies
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 mt-2">
              AUTHORing the Future of Streetwear
            </h1>
            <p className="text-sm md:text-base text-neutral-500 max-w-2xl mx-auto leading-relaxed mt-6">
              Founded in 2026, AUTHOR is a premium clothing label designed for the bold, the expressive, and the unapologetic. We write our story through the fabric we select, the silhouettes we shape, and the statements we make.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand Values & Story */}
      <section className="section-padding py-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-neutral-900 mb-6">
            The Philosophy
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed mb-4">
            We believe that clothing is the ultimate medium of self-authorship. Every piece we release is crafted with high-weight custom milled cotton, precise attention to drop-shoulder designs, and durable prints meant to last.
          </p>
          <p className="text-xs text-neutral-600 leading-relaxed">
            All our collections are limited-run runs. We design, prototype, and manufacture locally in India, keeping ethical practices and minimal waste at the core of our operations.
          </p>
        </div>
        <div className="bg-neutral-50 p-8 rounded-lg border border-neutral-100 space-y-6">
          <div className="flex gap-4 items-start">
            <Heart className="w-5 h-5 text-neutral-800 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">Premium Fabrics Only</h4>
              <p className="text-[10px] text-neutral-500 mt-1">Meticulously selected heavyweight loops-back terry and premium combed cotton.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <ShieldCheck className="w-5 h-5 text-neutral-800 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">Rigorous Quality Checks</h4>
              <p className="text-[10px] text-neutral-500 mt-1">Pre-shrunk, bio-washed, and color-tested to survive laundry cycles seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy details */}
      <section className="bg-neutral-50 border-y border-neutral-100 py-16">
        <div className="section-padding max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Shipping */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-150">
                <Truck className="w-5 h-5 text-neutral-800" />
              </div>
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-neutral-900">
                Shipping & Timelines
              </h3>
            </div>
            <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
              <p>• <strong>Free Shipping:</strong> Automatically applied to all orders above ₹4,000.</p>
              <p>• <strong>Processing Times:</strong> Orders are processed and handed over to premium air couriers (DHL / Blue Dart) within 24–48 hours.</p>
              <p>• <strong>Delivery Window:</strong> 2–5 business days across major metro cities in India; 5–7 days for tier 2/3 locations.</p>
            </div>
          </div>

          {/* Returns */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-150">
                <RotateCcw className="w-5 h-5 text-neutral-800" />
              </div>
              <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-neutral-900">
                Returns & Exchanges
              </h3>
            </div>
            <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
              <p>• <strong>7-Day Window:</strong> File return requests directly from your customer account dashboard within 7 days of delivery.</p>
              <p>• <strong>Hassle-Free Pickup:</strong> Once approved, our logistics partner will arrange a reverse pickup from your address.</p>
              <p>• <strong>Condition:</strong> Items must be unworn, unwashed, and returned with original tags intact.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
