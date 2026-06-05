import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { randomBytes, createHash } from 'crypto';

// ─── POST /api/newsletter ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return apiError('VALIDATION_ERROR', 'Email is required', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return apiError('VALIDATION_ERROR', 'Invalid email address', 400);
    }

    // Check for existing subscription
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isActive && existing.confirmedAt) {
        // Already subscribed and confirmed
        return apiSuccess({ message: 'You are already subscribed!' });
      }

      if (existing.isActive && !existing.confirmedAt) {
        // Re-send confirmation (double opt-in pending)
        // In production, you'd send the confirmation email here
        return apiSuccess({
          message: 'A confirmation email has been sent. Please check your inbox.',
          requiresConfirmation: true,
        });
      }

      // Previously unsubscribed — reactivate with double opt-in
      await prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: {
          isActive: true,
          confirmedAt: null, // Requires re-confirmation
          unsubscribedAt: null,
        },
      });

      // TODO: Send confirmation email with token
      // The token should be: createHash('sha256').update(email + process.env.NEWSLETTER_SECRET).digest('hex')

      return apiSuccess({
        message: 'A confirmation email has been sent. Please check your inbox.',
        requiresConfirmation: true,
      });
    }

    // New subscriber — create with double opt-in
    await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        isActive: true,
        confirmedAt: null, // Will be set when user clicks confirmation link
      },
    });

    // TODO: Send confirmation email
    // Generate token: createHash('sha256').update(normalizedEmail + process.env.NEWSLETTER_SECRET).digest('hex')
    // Email link: ${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter?token=<token>&action=confirm&email=<email>

    return apiSuccess({
      message: 'A confirmation email has been sent. Please check your inbox.',
      requiresConfirmation: true,
    });
  } catch (error) {
    console.error('[NEWSLETTER_SUBSCRIBE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to subscribe', 500);
  }
}

// ─── GET /api/newsletter?token=xxx&action=confirm|unsubscribe&email=xxx ─

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const token = sp.get('token');
    const action = sp.get('action');
    const email = sp.get('email')?.trim().toLowerCase();

    if (!token || !action || !email) {
      return apiError('VALIDATION_ERROR', 'Missing required parameters: token, action, email', 400);
    }

    // Verify token
    const secret = process.env.NEWSLETTER_SECRET || 'default-newsletter-secret';
    const expectedToken = createHash('sha256').update(email + secret).digest('hex');

    if (token !== expectedToken) {
      return apiError('INVALID_TOKEN', 'Invalid or expired token', 403);
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return apiError('NOT_FOUND', 'Subscriber not found', 404);
    }

    if (action === 'confirm') {
      // Confirm subscription (double opt-in)
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          confirmedAt: new Date(),
          isActive: true,
        },
      });

      return apiSuccess({ message: 'Your subscription has been confirmed. Welcome!' });
    }

    if (action === 'unsubscribe') {
      // Unsubscribe
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });

      return apiSuccess({ message: 'You have been unsubscribed successfully.' });
    }

    return apiError('VALIDATION_ERROR', 'Invalid action. Must be "confirm" or "unsubscribe".', 400);
  } catch (error) {
    console.error('[NEWSLETTER_ACTION_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to process request', 500);
  }
}
