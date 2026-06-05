import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';

// ─── GET /api/reviews?productId=xxx&page=1&pageSize=10 ──────────────

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const productId = sp.get('productId');

    if (!productId) {
      return apiError('VALIDATION_ERROR', 'productId query parameter is required', 400);
    }

    const { page, pageSize, skip } = parsePagination(sp);

    const where = {
      productId,
      isApproved: true,
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
        skip,
        take: pageSize,
      }),
      prisma.review.count({ where }),
    ]);

    // Also compute aggregate stats
    const ratingAgg = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: true,
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      ratingDistribution[d.rating] = d._count;
    }

    return apiSuccess(
      {
        reviews,
        stats: {
          averageRating: ratingAgg._avg.rating ?? 0,
          totalReviews: ratingAgg._count.rating,
          distribution: ratingDistribution,
        },
      },
      paginationMeta(page, pageSize, total)
    );
  } catch (error) {
    console.error('[REVIEWS_LIST_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch reviews', 500);
  }
}

// ─── POST /api/reviews ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { productId, rating, title, body: reviewBody } = body;

    // Validation
    if (!productId) {
      return apiError('VALIDATION_ERROR', 'productId is required', 400);
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return apiError('VALIDATION_ERROR', 'Rating must be between 1 and 5', 400);
    }

    if (title && typeof title === 'string' && title.length > 200) {
      return apiError('VALIDATION_ERROR', 'Title must be under 200 characters', 400);
    }

    if (reviewBody && typeof reviewBody === 'string' && reviewBody.length > 5000) {
      return apiError('VALIDATION_ERROR', 'Review body must be under 5000 characters', 400);
    }

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isActive: true },
    });

    if (!product || !product.isActive) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }

    // Check if user already reviewed this product (@@unique([userId, productId]))
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingReview) {
      return apiError('DUPLICATE', 'You have already reviewed this product', 409);
    }

    // Check for verified purchase (user has a delivered order with this product)
    const verifiedPurchase = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
          status: 'DELIVERED',
        },
      },
      select: { id: true },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: Math.round(rating),
        title: title?.trim() || null,
        body: reviewBody?.trim() || null,
        isVerifiedPurchase: !!verifiedPurchase,
        isApproved: false, // Reviews require moderation
      },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return apiSuccess(review);
  } catch (error) {
    console.error('[REVIEW_CREATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to submit review', 500);
  }
}
