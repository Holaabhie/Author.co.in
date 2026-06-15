'use client';

import { motion } from 'framer-motion';
import { Truck, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

export default function ShippingPage() {
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
              Shipping &amp; Delivery
            </h1>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mt-2 font-semibold">
              Premium Streetwear Handled with Precision
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shipping Details */}
      <section className="section-padding py-16 max-w-3xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-neutral-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Order Processing
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Please allow <strong>1–5 business days</strong> for our team to process and dispatch every order.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-neutral-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Delivery Timeline
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Once shipped, the package will be delivered within <strong>2–4 business days</strong> after fulfillment.
              All shipments are shipped via <strong>DDT Powered Delivery</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-neutral-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Delays &amp; Exceptions
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              The estimated shipping time may be subject to delays due to shipping destination, courier conditions, and national holidays.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-neutral-800" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Order Enquiries
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              We ask that you please allow up to <strong>15 business days</strong> before contacting us in regards to your order.
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-8 text-center space-y-2">
          <p className="text-[11px] text-neutral-400 font-sans tracking-wide">
            Need shipping assistance? Reach out to us at{' '}
            <a href="mailto:shopauthor.co@gmail.com" className="text-neutral-800 underline hover:opacity-85">shopauthor.co@gmail.com</a>
          </p>
          <p className="text-[11px] text-neutral-400 font-sans tracking-wide">
            WhatsApp:{' '}
            <a href="https://wa.me/919076252241" target="_blank" rel="noopener noreferrer" className="text-neutral-800 underline hover:opacity-85">+91 9076252241</a>
          </p>
        </div>
      </section>
    </div>
  );
}
