/**
 * Server-side coupon logic for AUTHOR.
 *
 * FAMFRIENDS coupon: fixed category-based pricing.
 * All prices are in PAISE (1 INR = 100 paise).
 *
 * SAFETY:
 * - If coupon price >= original price, original price is used (never raise customer price).
 * - This logic runs server-side only. Frontend never sends trusted price values.
 */

// ── Coupon Definitions ──────────────────────────────────────────────

/** Category slug normalization map */
const CATEGORY_NORM: Record<string, string> = {
  tshirt: "tshirts",
  tshirts: "tshirts",
  "t-shirt": "tshirts",
  "t-shirts": "tshirts",
  top: "tops",
  tops: "tops",
  sweatpants: "sweatpants",
  sweatpant: "sweatpants",
  pant: "sweatpants",
  pants: "sweatpants",
};

/** FAMFRIENDS fixed category prices in PAISE */
const FAMFRIENDS_PRICES: Record<string, number> = {
  tshirts: 70000,     // ₹700
  tops: 60000,        // ₹600
  sweatpants: 110000, // ₹1100
};

/** All supported coupon codes and their type */
const VALID_COUPONS: Record<string, { type: "category_fixed" }> = {
  FAMFRIENDS: { type: "category_fixed" },
};

// ── Utility Functions ───────────────────────────────────────────────

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function normalizeCategorySlug(slug: string): string {
  const key = slug.toLowerCase().trim();
  return CATEGORY_NORM[key] ?? key;
}

export function isValidCoupon(code: string): boolean {
  return normalizeCouponCode(code) in VALID_COUPONS;
}

/**
 * Get the fixed coupon price for a category, or null if not applicable.
 */
export function getCouponCategoryPrice(
  couponCode: string,
  categorySlug: string
): number | null {
  const code = normalizeCouponCode(couponCode);
  if (code !== "FAMFRIENDS") return null;

  const normalizedCat = normalizeCategorySlug(categorySlug);
  return FAMFRIENDS_PRICES[normalizedCat] ?? null;
}

// ── Types ───────────────────────────────────────────────────────────

export interface ServerCartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  /** Category slug from the DB */
  categorySlug: string;
  /** Original unit price from DB in paise (before coupon) */
  originalUnitPrice: number;
}

export interface CouponLineItem {
  productId: string;
  variantId: string | null;
  categorySlug: string;
  quantity: number;
  originalUnitPrice: number;
  finalUnitPrice: number;
  discountPerUnit: number;
  lineTotal: number;
}

export interface CouponApplicationResult {
  valid: boolean;
  couponCode: string;
  items: CouponLineItem[];
  originalSubtotal: number;
  discountAmount: number;
  finalTotal: number;
}

// ── Core Application Logic ──────────────────────────────────────────

/**
 * Apply a coupon to cart items. Server-side only.
 *
 * Rules:
 * 1. Each item's category determines its coupon price.
 * 2. If coupon price >= original price, use original price (correction #10).
 * 3. Items in unknown categories get no discount.
 */
export function applyCouponToCartItems(
  couponCode: string,
  items: ServerCartItem[]
): CouponApplicationResult {
  const code = normalizeCouponCode(couponCode);

  if (!isValidCoupon(code)) {
    return {
      valid: false,
      couponCode: code,
      items: [],
      originalSubtotal: 0,
      discountAmount: 0,
      finalTotal: 0,
    };
  }

  let originalSubtotal = 0;
  let finalTotal = 0;

  const lineItems: CouponLineItem[] = items.map((item) => {
    const couponPrice = getCouponCategoryPrice(code, item.categorySlug);

    // If coupon has a price for this category AND it's lower than original
    let finalUnitPrice: number;
    if (couponPrice !== null && couponPrice < item.originalUnitPrice) {
      finalUnitPrice = couponPrice;
    } else {
      // No discount: coupon price missing, unknown category, or coupon price >= original
      finalUnitPrice = item.originalUnitPrice;
    }

    const discountPerUnit = item.originalUnitPrice - finalUnitPrice;
    const lineTotal = finalUnitPrice * item.quantity;

    originalSubtotal += item.originalUnitPrice * item.quantity;
    finalTotal += lineTotal;

    return {
      productId: item.productId,
      variantId: item.variantId,
      categorySlug: item.categorySlug,
      quantity: item.quantity,
      originalUnitPrice: item.originalUnitPrice,
      finalUnitPrice,
      discountPerUnit,
      lineTotal,
    };
  });

  return {
    valid: true,
    couponCode: code,
    items: lineItems,
    originalSubtotal,
    discountAmount: originalSubtotal - finalTotal,
    finalTotal,
  };
}
