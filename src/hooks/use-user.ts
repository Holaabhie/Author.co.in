'use client';

import { useAuth } from '@/components/providers/AuthContext';
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
 * Now consumes from the global AuthContext — single source of truth.
 *
 * Usage:
 * ```tsx
 * const { user, loading, signOut } = useUser();
 * ```
 */
export function useUser(): UseUserReturn {
  const { user, loading, error, signOut, refreshUser } = useAuth();
  return { user, loading, error, signOut, refreshUser };
}
