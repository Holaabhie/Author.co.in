'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on homepage, auth pages, and collection pages
  const hiddenPaths = ['/', '/login', '/register', '/reset-password', '/update-password'];
  if (hiddenPaths.some((p) => pathname === p)) return null;
  if (pathname.startsWith('/collections')) return null;
  if (pathname.startsWith('/admin')) return null;

  return <Footer />;
}
