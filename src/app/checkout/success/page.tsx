'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';

interface OrderResult {
  orderId: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderNumber = searchParams.get('order');
    if (orderNumber) {
      setOrder({
        orderId: '',
        orderNumber,
        total: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-author-cream" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-16 section-padding">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-8"
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider mb-3">
            Order Confirmed
          </h1>
          <p className="text-author-mid text-sm mb-8">
            Thank you for your purchase! Your order has been confirmed.
          </p>

          {order?.orderNumber && (
            <div className="glass p-6 mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-author-mid mb-1">Order Number</p>
              <p className="font-heading text-xl font-bold text-author-cream tracking-wider">
                {order.orderNumber}
              </p>
            </div>
          )}

          <div className="glass p-6 mb-8 text-left space-y-4">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-author-cream mt-0.5" />
              <div>
                <p className="text-sm font-medium">What happens next?</p>
                <p className="text-xs text-author-mid mt-1">
                  You&apos;ll receive an email confirmation with your order details.
                  We&apos;ll notify you when your order ships with tracking information.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account?tab=orders"
              className="bg-author-cream text-author-black px-8 py-3.5 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-author-white transition-colors flex items-center justify-center gap-2"
            >
              View Orders <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/shop"
              className="border border-white/10 px-8 py-3.5 font-heading text-sm uppercase tracking-[0.2em] font-semibold hover:bg-white/5 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
