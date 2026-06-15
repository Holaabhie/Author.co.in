'use client';

import { motion } from 'framer-motion';
import { RotateCcw, ShieldCheck, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

export default function ReturnsPage() {
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
              Customer Support
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-[0.15em] text-neutral-900 mt-2">
              Return &amp; Exchange Policy
            </h1>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mt-2 font-semibold">
              Thoughtfully Curated · Limited Quantities
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policy Details */}
      <section className="section-padding py-16 max-w-3xl mx-auto space-y-12">
        {/* Exchange Policy */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Exchange Policy
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            Exchanges can be requested within <strong>3 days</strong> of the delivery date.
          </p>
          <div className="space-y-2">
            <p className="text-xs text-neutral-600 leading-relaxed font-sans font-semibold">
              Items are eligible for exchange only if:
            </p>
            <ul className="space-y-1.5 pl-4">
              <li className="text-xs text-neutral-600 leading-relaxed font-sans list-disc">
                The garment is unworn and unused
              </li>
              <li className="text-xs text-neutral-600 leading-relaxed font-sans list-disc">
                All original tags, labels, and security tags are intact
              </li>
              <li className="text-xs text-neutral-600 leading-relaxed font-sans list-disc">
                The product is returned in its original condition and packaging
              </li>
            </ul>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            We do not cover your shipping costs back to us.
          </p>
        </div>

        <div className="border-t border-neutral-100" />

        {/* What Can You Exchange For */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              What Can You Exchange For?
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            You may exchange your item for:
          </p>
          <ul className="space-y-1.5 pl-4">
            <li className="text-xs text-neutral-600 leading-relaxed font-sans list-disc">
              A different size, or
            </li>
            <li className="text-xs text-neutral-600 leading-relaxed font-sans list-disc">
              Another product of your choice, subject to availability
            </li>
          </ul>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            All exchanges are subject to stock availability.
          </p>
        </div>

        <div className="border-t border-neutral-100" />

        {/* Important Notes */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Important Notes
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            <strong>All sales at Author.Co are final</strong> due to limited inventory.
          </p>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            We do not offer returns. To maintain the highest standards of quality control and efficient pricing, all sales are final. Each item undergoes a thorough quality check before dispatch.
          </p>
        </div>

        <div className="border-t border-neutral-100" />

        {/* Damaged or Incorrect Products */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Damaged or Incorrect Products
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            In the rare event that you receive a damaged or incorrect product, our support team will promptly resolve the issue. Please contact us within <strong>48 hours</strong> of delivery, and we&apos;ll be happy to assist you.
          </p>
        </div>

        <div className="border-t border-neutral-100" />

        {/* Need Help */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Need Help?
            </h2>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Email:{' '}
              <a href="mailto:shopauthor.co@gmail.com" className="text-neutral-800 underline hover:opacity-85">shopauthor.co@gmail.com</a>
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              WhatsApp:{' '}
              <a href="https://wa.me/919076252241" target="_blank" rel="noopener noreferrer" className="text-neutral-800 underline hover:opacity-85">+91 9076252241</a>
            </p>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
            Our customer support team will assist you and may request additional details to process your request.
          </p>
        </div>
      </section>
    </div>
  );
}
