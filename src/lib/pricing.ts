import { prisma } from '@/lib/db';

/**
 * Central pricing logic for the Author platform.
 * 
 * Priority: Flash Sale Price > discountPrice > price
 * 
 * CRITICAL: This logic runs server-side in checkout validation.
 * Client-side display prices must be re-validated here before order creation
 * to prevent price manipulation.
 * 
 * All prices are in paise (integer). Never use floating point for money.
 */

export interface ResolvedPrice {
  /** The final price to charge, in paise */
  finalPrice: number;
  /** The original list price, in paise */
  originalPrice: number;
  /** Whether a discount is active */
  hasDiscount: boolean;
  /** The type of discount applied */
  discountType: 'flash_sale' | 'discount' | 'none';
  /** The flash sale name (if applicable) */
  flashSaleName?: string;
  /** Discount percentage (for display) */
  discountPercentage: number;
}

/**
 * Resolve the price for a product, checking flash sales first.
 * 
 * @param productId - The product ID to resolve pricing for
 * @param now - Optional override for current time (for testing)
 */
export async function resolvePrice(
  productId: string,
  now: Date = new Date()
): Promise<ResolvedPrice> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      price: true,
      discountPrice: true,
      flashSaleProducts: {
        where: {
          flashSale: {
            isActive: true,
            startAt: { lte: now },
            endAt: { gte: now },
          },
        },
        include: {
          flashSale: {
            select: { name: true },
          },
        },
        take: 1,
      },
    },
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const originalPrice = product.price;

  // Priority 1: Active Flash Sale
  const activeFlashSale = product.flashSaleProducts[0];
  if (activeFlashSale) {
    return {
      finalPrice: activeFlashSale.salePrice,
      originalPrice,
      hasDiscount: true,
      discountType: 'flash_sale',
      flashSaleName: activeFlashSale.flashSale.name,
      discountPercentage: Math.round(
        ((originalPrice - activeFlashSale.salePrice) / originalPrice) * 100
      ),
    };
  }

  // Priority 2: Discount Price
  if (product.discountPrice && product.discountPrice < product.price) {
    return {
      finalPrice: product.discountPrice,
      originalPrice,
      hasDiscount: true,
      discountType: 'discount',
      discountPercentage: Math.round(
        ((originalPrice - product.discountPrice) / originalPrice) * 100
      ),
    };
  }

  // Priority 3: Regular Price
  return {
    finalPrice: originalPrice,
    originalPrice,
    hasDiscount: false,
    discountType: 'none',
    discountPercentage: 0,
  };
}

/**
 * Batch resolve prices for multiple products.
 * More efficient than calling resolvePrice() in a loop.
 */
export async function resolvePrices(
  productIds: string[],
  now: Date = new Date()
): Promise<Map<string, ResolvedPrice>> {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      price: true,
      discountPrice: true,
      flashSaleProducts: {
        where: {
          flashSale: {
            isActive: true,
            startAt: { lte: now },
            endAt: { gte: now },
          },
        },
        include: {
          flashSale: { select: { name: true } },
        },
        take: 1,
      },
    },
  });

  const result = new Map<string, ResolvedPrice>();

  for (const product of products) {
    const originalPrice = product.price;
    const activeFlashSale = product.flashSaleProducts[0];

    if (activeFlashSale) {
      result.set(product.id, {
        finalPrice: activeFlashSale.salePrice,
        originalPrice,
        hasDiscount: true,
        discountType: 'flash_sale',
        flashSaleName: activeFlashSale.flashSale.name,
        discountPercentage: Math.round(
          ((originalPrice - activeFlashSale.salePrice) / originalPrice) * 100
        ),
      });
    } else if (product.discountPrice && product.discountPrice < product.price) {
      result.set(product.id, {
        finalPrice: product.discountPrice,
        originalPrice,
        hasDiscount: true,
        discountType: 'discount',
        discountPercentage: Math.round(
          ((originalPrice - product.discountPrice) / originalPrice) * 100
        ),
      });
    } else {
      result.set(product.id, {
        finalPrice: originalPrice,
        originalPrice,
        hasDiscount: false,
        discountType: 'none',
        discountPercentage: 0,
      });
    }
  }

  return result;
}
