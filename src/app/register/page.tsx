'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /register now redirects to the unified /login page
 * which contains both Sign In and Create Account tabs.
 */
export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
