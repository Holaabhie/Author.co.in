import { prisma } from '@/lib/db';

/**
 * Atomic stock reservation system.
 * 
 * Uses Prisma transactions with serializable isolation to prevent
 * race conditions on concurrent stock operations.
 * 
 * Flow:
 * 1. Cart Add → reserveStock() - Decrements `stock`, increments `reservedStock`
 * 2. Cart Remove / Expiry → releaseStock() - Reverses reservation
 * 3. Order Confirmed → confirmStock() - Decrements `reservedStock` (already deducted from `stock`)
 * 
 * IMPORTANT: `stock` represents AVAILABLE stock (not total).
 * Total physical stock = stock + reservedStock
 */

export interface StockResult {
  success: boolean;
  error?: string;
  availableStock?: number;
}

/**
 * Reserve stock for a cart item.
 * Atomically checks availability and reserves.
 * 
 * @param variantId - ProductVariant ID
 * @param quantity - Number of units to reserve
 * @param expiresAt - When this reservation expires (for cart TTL)
 */
export async function reserveStock(
  variantId: string,
  quantity: number,
  expiresAt: Date
): Promise<StockResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the variant row to prevent concurrent modifications
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true, reservedStock: true, id: true },
      });

      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.stock < quantity) {
        return {
          success: false,
          error: `Only ${variant.stock} units available`,
          availableStock: variant.stock,
        };
      }

      // Atomically decrement stock and increment reservedStock
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stock: { decrement: quantity },
          reservedStock: { increment: quantity },
        },
      });

      return { success: true };
    }, {
      isolationLevel: 'Serializable',
      timeout: 5000,
    });

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'Variant not found') {
      return { success: false, error: 'Variant not found' };
    }
    console.error('[STOCK_RESERVE_ERROR]', error);
    return { success: false, error: 'Failed to reserve stock' };
  }
}

/**
 * Release previously reserved stock back to available.
 * Used when:
 * - Cart item removed
 * - Cart reservation expired
 * - Order cancelled before payment
 */
export async function releaseStock(
  variantId: string,
  quantity: number
): Promise<StockResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { reservedStock: true },
      });

      if (!variant) {
        throw new Error('Variant not found');
      }

      // Don't release more than what's reserved
      const releaseQty = Math.min(quantity, variant.reservedStock);

      if (releaseQty > 0) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: { increment: releaseQty },
            reservedStock: { decrement: releaseQty },
          },
        });
      }
    }, {
      isolationLevel: 'Serializable',
      timeout: 5000,
    });

    return { success: true };
  } catch (error) {
    console.error('[STOCK_RELEASE_ERROR]', error);
    return { success: false, error: 'Failed to release stock' };
  }
}

/**
 * Confirm reserved stock after successful payment.
 * Decrements reservedStock without affecting available stock
 * (stock was already decremented during reservation).
 */
export async function confirmStock(
  variantId: string,
  quantity: number
): Promise<StockResult> {
  try {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        reservedStock: { decrement: quantity },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[STOCK_CONFIRM_ERROR]', error);
    return { success: false, error: 'Failed to confirm stock' };
  }
}

/**
 * Log an inventory change for audit trail.
 */
export async function logInventoryChange(params: {
  variantId: string;
  changeType: string;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  adminId?: string;
}): Promise<void> {
  try {
    await prisma.inventoryHistory.create({
      data: {
        variantId: params.variantId,
        changeType: params.changeType,
        quantityBefore: params.quantityBefore,
        quantityAfter: params.quantityAfter,
        reason: params.reason ?? null,
        adminId: params.adminId ?? null,
      },
    });
  } catch (error) {
    // Inventory logging should never crash the main flow
    console.error('[INVENTORY_LOG_ERROR]', error);
  }
}

/**
 * Clean up expired cart reservations.
 * Called by the cron job (/api/cron/cleanup-reservations).
 * 
 * Finds all CartItems where expiresAt < now and releases their stock.
 */
export async function cleanupExpiredReservations(): Promise<{
  cleaned: number;
  errors: number;
}> {
  const now = new Date();
  let cleaned = 0;
  let errors = 0;

  const expiredItems = await prisma.cartItem.findMany({
    where: {
      expiresAt: { lt: now },
      variantId: { not: null },
    },
    select: {
      id: true,
      variantId: true,
      quantity: true,
    },
  });

  for (const item of expiredItems) {
    if (!item.variantId) continue;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.productVariant.update({
          where: { id: item.variantId! },
          data: {
            stock: { increment: item.quantity },
            reservedStock: { decrement: item.quantity },
          },
        });

        await tx.cartItem.delete({
          where: { id: item.id },
        });
      });

      cleaned++;
    } catch {
      errors++;
    }
  }

  return { cleaned, errors };
}
