'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Client-side hook for Supabase Auth user state.
 * Subscribes to auth state changes and provides the current user.
 *
 * Usage:
 * ```tsx
 * const { user, loading, signOut } = useUser();
 * if (loading) return <Spinner />;
 * if (!user) return <LoginLink />;
 * return <span>{user.email}</span>;
 * ```
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
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
        // Session expired or invalid — not a crash-worthy error
        if (userError.message.includes('session_not_found') || 
            userError.status === 401) {
          setUser(null);
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
    // Get initial user
    refreshUser();

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
    }
  }, [supabase]);

  return { user, loading, error, signOut, refreshUser };
}
