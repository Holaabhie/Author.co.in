"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useCartStore } from "@/lib/store/cart";

/**
 * CartAuthGuard — Invisible component that watches auth state changes
 * and clears the Zustand cart when:
 *   1. User logs out (userId goes to null)
 *   2. A different user logs in (userId changes)
 * 
 * This prevents cart data from leaking between user sessions.
 * Renders nothing — just a side-effect hook.
 */
export default function CartAuthGuard() {
  const { user, loading } = useAuth();
  const clearCart = useCartStore((s) => s.clearCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Skip until auth has resolved at least once
    if (loading) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // First run after auth loads — just record the userId, don't clear
    if (prevUserId === undefined) {
      prevUserIdRef.current = currentUserId;
      return;
    }

    // User changed (logout, or different user signed in)
    if (prevUserId !== currentUserId) {
      clearCart();
      closeCart();
      prevUserIdRef.current = currentUserId;
    }
  }, [user, loading, clearCart, closeCart]);

  return null;
}
