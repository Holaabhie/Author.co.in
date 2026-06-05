import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';
import { reserveStock, releaseStock } from '@/lib/stock';
import { cookies } from 'next/headers';

// ─── Helpers ───────────────────────────────────────────────────────

/** Resolve user ID or session ID for cart identification */
async function resolveCartIdentity(): Promise<{ userId?: string; sessionId?: string }> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id };

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (sessionId) return { sessionId };

  return {};
}

// ─── GET /api/cart ──────────────────────────────────────────────────

export async function GET() {
  try {
    const identity = await resolveCartIdentity();

    if (!identity.userId && !identity.sessionId) {
      return apiSuccess([]);
    }

    const where = identity.userId
      ? { userId: identity.userId }
      : { sessionId: identity.sessionId };

    const cartItems = await prisma.cartItem.findMany({
      where,
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
          },
        },
        variant: {
          select: {
            id: true,
            size: true,
            color: true,
            colorHex: true,
            stock: true,
            priceOverride: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    // Filter out expired items (cleanup happens async via cron, but exclude here for UX)
    const activeItems = cartItems.filter(
      (item) => !item.expiresAt || item.expiresAt > new Date()
    );

    return apiSuccess(activeItems);
  } catch (error) {
    console.error('[CART_GET_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch cart', 500);
  }
}

// ─── POST /api/cart ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const identity = await resolveCartIdentity();

    if (!identity.userId && !identity.sessionId) {
      return apiError('NO_IDENTITY', 'Session or authentication required. Please enable cookies or sign in.', 400);
    }

    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId || !variantId) {
      return apiError('VALIDATION_ERROR', 'productId and variantId are required', 400);
    }

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 10) {
      return apiError('VALIDATION_ERROR', 'Quantity must be between 1 and 10', 400);
    }

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { isActive: true },
    });

    if (!product || !product.isActive) {
      return apiError('NOT_FOUND', 'Product not found or unavailable', 404);
    }

    // Validate variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, productId: true, stock: true },
    });

    if (!variant || variant.productId !== productId) {
      return apiError('NOT_FOUND', 'Variant not found', 404);
    }

    // Check for existing cart item (same user/session + product + variant)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        ...identity,
        productId,
        variantId,
      },
    });

    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    if (totalQuantity > 10) {
      return apiError('QUANTITY_LIMIT', 'Maximum 10 units per item', 400);
    }

    // Reserve stock
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const stockResult = await reserveStock(variantId, quantity, expiresAt);

    if (!stockResult.success) {
      return apiError('OUT_OF_STOCK', stockResult.error ?? 'Insufficient stock', 409);
    }

    let cartItem;

    if (existingItem) {
      // Update existing cart item
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: { increment: quantity },
          expiresAt,
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true, price: true, discountPrice: true },
          },
          variant: {
            select: { id: true, size: true, color: true, colorHex: true, stock: true },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          ...identity,
          productId,
          variantId,
          quantity,
          expiresAt,
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true, price: true, discountPrice: true },
          },
          variant: {
            select: { id: true, size: true, color: true, colorHex: true, stock: true },
          },
        },
      });
    }

    return apiSuccess(cartItem);
  } catch (error) {
    console.error('[CART_ADD_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to add item to cart', 500);
  }
}

// ─── PUT /api/cart ──────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const identity = await resolveCartIdentity();

    if (!identity.userId && !identity.sessionId) {
      return apiError('NO_IDENTITY', 'Session or authentication required', 400);
    }

    const body = await request.json();
    const { cartItemId, quantity } = body;

    if (!cartItemId) {
      return apiError('VALIDATION_ERROR', 'cartItemId is required', 400);
    }

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 10) {
      return apiError('VALIDATION_ERROR', 'Quantity must be between 1 and 10', 400);
    }

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: { id: true, userId: true, sessionId: true, variantId: true, quantity: true },
    });

    if (!cartItem) {
      return apiError('NOT_FOUND', 'Cart item not found', 404);
    }

    // Verify ownership
    if (identity.userId && cartItem.userId !== identity.userId) {
      return apiError('FORBIDDEN', 'Cannot modify another user\'s cart', 403);
    }
    if (identity.sessionId && cartItem.sessionId !== identity.sessionId) {
      return apiError('FORBIDDEN', 'Cannot modify another session\'s cart', 403);
    }

    const quantityDiff = quantity - cartItem.quantity;

    if (quantityDiff > 0 && cartItem.variantId) {
      // Need to reserve additional stock
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const stockResult = await reserveStock(cartItem.variantId, quantityDiff, expiresAt);

      if (!stockResult.success) {
        return apiError('OUT_OF_STOCK', stockResult.error ?? 'Insufficient stock', 409);
      }
    } else if (quantityDiff < 0 && cartItem.variantId) {
      // Release excess stock
      await releaseStock(cartItem.variantId, Math.abs(quantityDiff));
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity, expiresAt },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, discountPrice: true },
        },
        variant: {
          select: { id: true, size: true, color: true, colorHex: true, stock: true },
        },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('[CART_UPDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update cart item', 500);
  }
}

// ─── DELETE /api/cart ────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const identity = await resolveCartIdentity();

    if (!identity.userId && !identity.sessionId) {
      return apiError('NO_IDENTITY', 'Session or authentication required', 400);
    }

    const body = await request.json();
    const { cartItemId } = body;

    if (!cartItemId) {
      return apiError('VALIDATION_ERROR', 'cartItemId is required', 400);
    }

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: { id: true, userId: true, sessionId: true, variantId: true, quantity: true },
    });

    if (!cartItem) {
      return apiError('NOT_FOUND', 'Cart item not found', 404);
    }

    // Verify ownership
    if (identity.userId && cartItem.userId !== identity.userId) {
      return apiError('FORBIDDEN', 'Cannot delete another user\'s cart item', 403);
    }
    if (identity.sessionId && cartItem.sessionId !== identity.sessionId) {
      return apiError('FORBIDDEN', 'Cannot delete another session\'s cart item', 403);
    }

    // Release reserved stock
    if (cartItem.variantId) {
      await releaseStock(cartItem.variantId, cartItem.quantity);
    }

    // Delete the cart item
    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[CART_DELETE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to remove cart item', 500);
  }
}
