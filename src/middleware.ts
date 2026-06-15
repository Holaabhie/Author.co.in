import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ─── Rate Limiting ─────────────────────────────────────────────────
// In-memory rate limiter for development. In production, use Upstash Redis.
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMITS: Record<string, { max: number; window: number }> = {
  '/api/auth': { max: 5, window: 15 * 60 * 1000 }, // 5/15min (login)
  '/api/checkout': { max: 20, window: 60 * 60 * 1000 }, // 20/hour
  '/api/': { max: 60, window: 60 * 1000 }, // 60/min (default)
};

function getRateLimit(pathname: string): { max: number; window: number } {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return RATE_LIMITS['/api/'];
}

function checkRateLimit(ip: string, pathname: string): boolean {
  const config = getRateLimit(pathname);
  const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now - record.lastReset > config.window) {
    rateLimit.set(key, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= config.max) return false;
  record.count++;
  return true;
}

// ─── Path Configuration ────────────────────────────────────────────
const protectedPaths = ['/account', '/checkout', '/orders'];
const adminPaths = ['/admin'];
const authPaths = ['/login', '/register', '/reset-password'];

// Admin roles that grant access to the admin panel
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'MARKETING', 'SUPPORT', 'VIEWER'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Rate Limiting for API routes ──────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ??
      request.headers.get('x-real-ip') ??
      'unknown';

    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: true, code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // ─── Skip auth for public routes ───────────────────────────────
  if (
    pathname.startsWith('/api/products') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/newsletter') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth/callback') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ─── Supabase session refresh ──────────────────────────────────
  const { user, supabaseResponse, supabase } = await updateSession(request);

  // ── Redirect authenticated users away from auth pages ─────────
  if (user && authPaths.some((path) => pathname.startsWith(path))) {
    const returnTo = request.nextUrl.searchParams.get('returnTo');
    const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // ─── Protect authenticated routes ──────────────────────────────
  if (!user && protectedPaths.some((path) => pathname.startsWith(path))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Protect admin routes ──────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (user) {
        const roles = user.app_metadata?.roles || user.app_metadata?.role;
        const hasAdminClaim = Array.isArray(roles)
          ? roles.some((r: any) => ADMIN_ROLES.includes(r))
          : typeof roles === 'string' && ADMIN_ROLES.includes(roles);

        if (hasAdminClaim) {
          const returnTo = request.nextUrl.searchParams.get('returnTo');
          const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/admin';
          return NextResponse.redirect(new URL(target, request.url));
        }

        const { data: userRole } = await supabase
          .from('UserRole')
          .select('role')
          .eq('userId', user.id)
          .in('role', ADMIN_ROLES)
          .limit(1)
          .maybeSingle();

        if (userRole) {
          const returnTo = request.nextUrl.searchParams.get('returnTo');
          const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/admin';
          return NextResponse.redirect(new URL(target, request.url));
        } else {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
      return NextResponse.next();
    }

    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // Check JWT custom role claims for quick bypass
    const roles = user.app_metadata?.roles || user.app_metadata?.role;
    const hasAdminClaim = Array.isArray(roles)
      ? roles.some((r: any) => ADMIN_ROLES.includes(r))
      : typeof roles === 'string' && ADMIN_ROLES.includes(roles);

    if (!hasAdminClaim) {
      // Fallback database check
      const { data: userRole, error: roleError } = await supabase
        .from('UserRole')
        .select('role')
        .eq('userId', user.id)
        .in('role', ADMIN_ROLES)
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116 errors if not found

      console.log('MIDDLEWARE ADMIN AUTH CHECK (DB FALLBACK):', {
        userId: user.id,
        userRole,
        roleError: roleError ? { message: roleError.message } : null
      });

      if (!userRole) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  // ─── Protect admin API routes ──────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json(
        { error: true, code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Quick claims check first
    const roles = user.app_metadata?.roles || user.app_metadata?.role;
    const hasAdminClaim = Array.isArray(roles)
      ? roles.some((r: any) => ADMIN_ROLES.includes(r))
      : typeof roles === 'string' && ADMIN_ROLES.includes(roles);

    if (!hasAdminClaim) {
      const { data: userRole } = await supabase
        .from('UserRole')
        .select('role')
        .eq('userId', user.id)
        .in('role', ADMIN_ROLES)
        .limit(1)
        .maybeSingle();

      if (!userRole) {
        return NextResponse.json(
          { error: true, code: 'FORBIDDEN', message: 'Admin access required' },
          { status: 403 }
        );
      }
    }
  }

  // ─── Security headers ─────────────────────────────────────────
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/account/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/login',
    '/register',
    '/reset-password',
    '/update-password',
    '/api/:path*',
  ],
};
