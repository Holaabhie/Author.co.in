import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';
import { cookies } from 'next/headers';

// POST /api/cart/sync — Merge anonymous cart into authenticated user's cart on login
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      // No anonymous session to merge, return current user cart
      const userCart = await getUserCart(user.id);
      return apiSuccess({ items: userCart, adjusted: [] });
    }

    // Fetch anonymous cart items
    const anonItems = await prisma.cartItem.findMany({
      where: { sessionId, userId: null },
      include: {
        variant: { select: { id: true, stock: true, reservedStock: true } },
        product: { select: { id: true, name: true, isActive: true } },
      },
    });

    if (anonItems.length === 0) {
      const userCart = await getUserCart(user.id);
      return apiSuccess({ items: userCart, adjusted: [] });
    }

    // Fetch existing user cart items
    const userItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        variant: { select: { id: true, stock: true, reservedStock: true } },
      },
    });

    // Build a lookup: variantId -> existing user cart item
    const userItemMap = new Map(
      userItems.map((item) => [`${item.productId}:${item.variantId}`, item])
    );

    const adjusted: Array<{
      productId: string;
      productName: string;
      variantId: string | null;
      requestedQty: number;
      finalQty: number;
      reason: string;
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const anonItem of anonItems) {
        if (!anonItem.product.isActive) {
          // Skip inactive products, just clean up
          await tx.cartItem.delete({ where: { id: anonItem.id } });
          continue;
        }

        const key = `${anonItem.productId}:${anonItem.variantId}`;
        const existingUserItem = userItemMap.get(key);

        if (existingUserItem) {
          // Server cart wins on conflicts — merge quantities with stock cap
          const combinedQty = existingUserItem.quantity + anonItem.quantity;
          const availableStock = anonItem.variant
            ? anonItem.variant.stock + anonItem.variant.reservedStock
            : Infinity;
          const maxQty = Math.min(combinedQty, availableStock, 10);

          // Server cart qty is the baseline; only increase if anon adds more
          const finalQty = Math.max(existingUserItem.quantity, maxQty);

          if (finalQty !== combinedQty) {
            adjusted.push({
              productId: anonItem.productId,
              productName: anonItem.product.name,
              variantId: anonItem.variantId,
              requestedQty: combinedQty,
              finalQty,
              reason: finalQty >= 10 ? 'Max quantity limit (10)' : 'Limited stock',
            });
          }

          // Update user's cart item to the final quantity
          if (finalQty !== existingUserItem.quantity) {
            await tx.cartItem.update({
              where: { id: existingUserItem.id },
              data: {
                quantity: finalQty,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
              },
            });
          }

          // Delete the anonymous cart item
          await tx.cartItem.delete({ where: { id: anonItem.id } });
        } else {
          // No conflict — transfer the anonymous item to the user
          await tx.cartItem.update({
            where: { id: anonItem.id },
            data: {
              userId: user.id,
              sessionId: null,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
          });
        }
      }
    });

    // Return the merged cart
    const mergedCart = await getUserCart(user.id);
    return apiSuccess({ items: mergedCart, adjusted });
  } catch (error) {
    console.error('[CART_SYNC_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to sync cart', 500);
  }
}

/** Fetch full cart for a user */
async function getUserCart(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
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
}
