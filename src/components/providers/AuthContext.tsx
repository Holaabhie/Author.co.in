'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useCartStore } from '@/lib/store/cart';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const refreshUser = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        if (userError.message.includes('session_not_found') || userError.status === 401) {
          setUser(null);
          setSession(null);
        } else {
          setError(userError);
        }
      } else {
        setUser(currentUser);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get user'));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setUser(newSession?.user ?? null);
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      // Clear cart on logout to prevent data leaking to next user
      useCartStore.getState().clearCart();
      useCartStore.getState().closeCart();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    }
  }, [supabase]);

  const value = useMemo(
    () => ({ user, session, loading, error, signOut, refreshUser }),
    [user, session, loading, error, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
