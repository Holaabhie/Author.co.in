import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/lib/stock';

/**
 * GET /api/cron/cleanup-reservations
 *
 * Vercel Cron Job — runs every 10 minutes.
 * Releases stock reservations for expired cart items.
 * See vercel.json for cron schedule configuration.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupExpiredReservations();

    console.info(
      `[CRON] Cleaned up ${result.cleaned} expired cart reservations. Errors: ${result.errors}`
    );

    return NextResponse.json({
      status: 'ok',
      cleaned: result.cleaned,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
