'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Package, MapPin } from 'lucide-react';

interface OrderResult {
  orderId: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
}

// ── Animated SVG Checkmark ────────────────────────────────────────────────────
function AnimatedCheck() {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '72px', height: '72px' }}
      aria-hidden="true"
    >
      {/* Circle */}
      <motion.circle
        cx="36"
        cy="36"
        r="33"
        stroke="#C8956C"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      />
      {/* Checkmark */}
      <motion.path
        d="M22 36.5L31.5 46L50 27"
        stroke="#C8956C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.65 }}
      />
    </svg>
  );
}

// ── Estimated delivery helper ─────────────────────────────────────────────────
function getEstimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Mock cart items (pulled from sessionStorage if available) ─────────────────
interface CartSnapshot {
  name: string;
  quantity: number;
  size?: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [cartSnapshot, setCartSnapshot] = useState<CartSnapshot[]>([]);
  const [shippingCity, setShippingCity] = useState<string>('');

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
    }

    // Try to recover cart snapshot & shipping from sessionStorage
    try {
      const snap = sessionStorage.getItem('checkout_cart_snapshot');
      if (snap) setCartSnapshot(JSON.parse(snap));
      const city = sessionStorage.getItem('checkout_city');
      if (city) setShippingCity(city);
    } catch {
      // ignore
    }

    setLoading(false);
    // Small delay so the page mounts before modal slides in
    setTimeout(() => setIsOpen(true), 80);
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => router.push('/'), 350);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
        <Loader2 style={{ width: '20px', height: '20px', color: '#C8956C' }} className="animate-spin" />
      </div>
    );
  }

  const estimatedDelivery = getEstimatedDelivery();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Success Page & Modal ──────────────────────────────────── */
        .success-page {
          min-height: 100vh;
          background: #0A0A0A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .success-modal {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: #0F0F0F;
          border: 1px solid #222;
          border-radius: 4px;
          padding: 40px 36px;
          z-index: 61;
        }

        /* Close button */
        .success-close {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.15s;
          line-height: 1;
        }
        .success-close:hover {
          color: #F5F0E8;
        }

        /* ── Top section ──────────────────────────────────────────── */
        .success-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 32px;
        }
        .success-check-wrap {
          margin-bottom: 20px;
        }
        .success-confirmed-label {
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #B8A07A;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 500;
          margin-bottom: 10px;
          display: block;
        }
        .success-thank-you {
          font-size: 22px;
          font-weight: 300;
          color: #F5F0E8;
          letter-spacing: 0.01em;
          line-height: 1.3;
          font-family: var(--font-jost), 'Jost', sans-serif;
          margin: 0;
        }

        /* ── Summary card ─────────────────────────────────────────── */
        .success-summary {
          background: #0A0A0A;
          border: 1px solid #1E1E1E;
          border-radius: 2px;
          padding: 20px;
          margin-bottom: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .success-summary-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .success-summary-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #555;
          font-family: var(--font-jost), 'Jost', sans-serif;
        }
        .success-summary-val {
          font-size: 13px;
          color: #F5F0E8;
          font-weight: 500;
          font-family: var(--font-jost), 'Jost', sans-serif;
        }
        .success-divider {
          height: 1px;
          background: #1A1A1A;
        }
        .success-items-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .success-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }
        .success-item-name {
          color: #F5F0E8;
          font-family: var(--font-jost), 'Jost', sans-serif;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .success-item-qty {
          font-size: 11px;
          color: #555;
          font-family: var(--font-jost), 'Jost', sans-serif;
          margin-left: 8px;
          flex-shrink: 0;
        }

        /* ── CTAs ─────────────────────────────────────────────────── */
        .success-cta-primary {
          display: block;
          width: 100%;
          text-align: center;
          background: #C8956C;
          color: #0A0A0A;
          border: none;
          padding: 15px 0;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-family: var(--font-jost), 'Jost', sans-serif;
          font-weight: 600;
          cursor: pointer;
          border-radius: 0;
          text-decoration: none;
          transition: background 0.2s;
          margin-bottom: 16px;
        }
        .success-cta-primary:hover {
          background: #d4a07a;
        }
        .success-cta-secondary {
          display: block;
          text-align: center;
          font-size: 11px;
          color: #555;
          font-family: var(--font-jost), 'Jost', sans-serif;
          letter-spacing: 0.1em;
          text-decoration: none;
          transition: color 0.15s;
        }
        .success-cta-secondary:hover {
          color: #888;
        }

        /* ── Mobile: full-screen bottom sheet ────────────────────── */
        @media (max-width: 600px) {
          .success-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .success-modal {
            max-width: 100%;
            border-radius: 12px 12px 0 0;
            border-bottom: none;
            padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
          }
        }
      `}} />

      {/* Background page (dark) */}
      <div className="success-page" />

      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="success-overlay"
            onClick={handleClose}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="success-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Order confirmation"
            >
              {/* Close button */}
              <button
                id="success-modal-close"
                className="success-close"
                onClick={handleClose}
                aria-label="Close"
              >
                <X style={{ width: '16px', height: '16px' }} strokeWidth={1.5} />
              </button>

              {/* ── Top section ──────────────────────────────────── */}
              <div className="success-top">
                <div className="success-check-wrap">
                  <AnimatedCheck />
                </div>
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.3 }}
                  className="success-confirmed-label"
                >
                  Order Confirmed
                </motion.span>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.3 }}
                  className="success-thank-you"
                >
                  Thank you for your purchase
                </motion.p>
              </div>

              {/* ── Summary card ─────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.35 }}
                className="success-summary"
              >
                {/* Estimated delivery */}
                <div className="success-summary-row">
                  <span className="success-summary-label">Estimated Delivery</span>
                  <span className="success-summary-val">{estimatedDelivery}</span>
                </div>

                {/* Items ordered — show from snapshot or fallback */}
                {cartSnapshot.length > 0 && (
                  <>
                    <div className="success-divider" />
                    <div className="success-summary-row">
                      <span className="success-summary-label" style={{ marginBottom: '8px' }}>Items Ordered</span>
                      <div className="success-items-list">
                        {cartSnapshot.map((item, i) => (
                          <div key={i} className="success-item-row">
                            <span className="success-item-name">{item.name}{item.size ? ` / ${item.size}` : ''}</span>
                            <span className="success-item-qty">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Shipping to */}
                {shippingCity && (
                  <>
                    <div className="success-divider" />
                    <div className="success-summary-row">
                      <span className="success-summary-label">Shipping To</span>
                      <span className="success-summary-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin style={{ width: '12px', height: '12px', color: '#555', flexShrink: 0 }} strokeWidth={1.5} />
                        {shippingCity}
                      </span>
                    </div>
                  </>
                )}

                {/* Fallback summary when no snapshot exists */}
                {cartSnapshot.length === 0 && !shippingCity && (
                  <>
                    <div className="success-divider" />
                    <div className="success-summary-row">
                      <span className="success-summary-label">Status</span>
                      <span className="success-summary-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package style={{ width: '12px', height: '12px', color: '#C8956C', flexShrink: 0 }} strokeWidth={1.5} />
                        Payment confirmed — preparing your order
                      </span>
                    </div>
                  </>
                )}
              </motion.div>

              {/* ── CTAs ─────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.25, duration: 0.3 }}
              >
                <Link href="/shop" className="success-cta-primary" id="success-continue-shopping">
                  Continue Shopping
                </Link>
                <Link href="/account" className="success-cta-secondary" id="success-view-orders">
                  View Order Details →
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
