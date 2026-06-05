import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';
import { cookies } from 'next/headers';

// GET /api/products/[slug]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const product = await prisma.product.findFirst({
      where: isUuid ? { id: slug } : { slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            colorHex: true,
            stock: true,
            priceOverride: true,
            sku: true,
          },
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        },
        reviews: {
          where: { isApproved: true },
          select: {
            id: true,
            rating: true,
            title: true,
            body: true,
            isVerifiedPurchase: true,
            createdAt: true,
            user: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: { where: { isApproved: true } } },
        },
      },
    });

    if (!product || !product.isActive) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }

    // Calculate average rating
    const ratingAgg = await prisma.review.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true },
    });

    // Record product view with dedup per sessionId per hour
    recordProductView(product.id, request).catch(() => {});

    return apiSuccess({
      ...product,
      averageRating: ratingAgg._avg.rating ?? 0,
    });
  } catch (error) {
    console.error('[PRODUCT_DETAIL_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch product', 500);
  }
}

/**
 * Record a product view with deduplication.
 * At most one view per sessionId (or userId) per product per hour.
 */
async function recordProductView(productId: string, request: NextRequest): Promise<void> {
  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value ?? null;

    // Need at least one identifier for dedup
    if (!user && !sessionId) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check for a recent view from the same session/user
    const recentView = await prisma.productView.findFirst({
      where: {
        productId,
        viewedAt: { gte: oneHourAgo },
        ...(user ? { userId: user.id } : { sessionId }),
      },
    });

    if (recentView) return; // Already viewed within the hour

    await prisma.productView.create({
      data: {
        productId,
        userId: user?.id ?? null,
        sessionId: sessionId ?? null,
      },
    });
  } catch (error) {
    // View tracking should never crash the main flow
    console.error('[PRODUCT_VIEW_ERROR]', error);
  }
}
