import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';

// ─── GET /api/wishlist ──────────────────────────────────────────────

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPrice: true,
            isActive: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: { select: { name: true, slug: true } },
            variants: {
              select: { id: true, size: true, color: true, colorHex: true, stock: true },
            },
            _count: { select: { reviews: { where: { isApproved: true } } } },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return apiSuccess(wishlistItems);
  } catch (error) {
    console.error('[WISHLIST_GET_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch wishlist', 500);
  }
}

// ─── POST /api/wishlist ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return apiError('VALIDATION_ERROR', 'productId is required', 400);
    }

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isActive: true },
    });

    if (!product || !product.isActive) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }

    // Upsert to prevent duplicates (@@unique([userId, productId]))
    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      create: {
        userId: user.id,
        productId,
      },
      update: {}, // No-op if already exists
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPrice: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
      },
    });

    return apiSuccess(wishlistItem);
  } catch (error) {
    console.error('[WISHLIST_ADD_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to add to wishlist', 500);
  }
}

// ─── DELETE /api/wishlist ───────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return apiError('VALIDATION_ERROR', 'productId is required', 400);
    }

    // Delete the wishlist item (only if it belongs to this user)
    const deleted = await prisma.wishlistItem.deleteMany({
      where: {
        userId: user.id,
        productId,
      },
    });

    if (deleted.count === 0) {
      return apiError('NOT_FOUND', 'Item not found in wishlist', 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[WISHLIST_DELETE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to remove from wishlist', 500);
  }
}
