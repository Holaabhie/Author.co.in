/**
 * Shared media helpers for product image/video resolution.
 *
 * These helpers are used across the storefront to:
 * 1. Select the correct "front" image for product cards
 * 2. Build correct Cloudinary URLs for images vs. videos
 * 3. Provide a consistent placeholder fallback
 *
 * The DB schema (ProductImage) has these relevant fields:
 *   url, alt, publicId, color, isPrimary, sortOrder
 * There is NO explicit "role" field, so we use isPrimary + sortOrder + keyword detection.
 */

// ── Constants ─────────────────────────────────────────────────────────
export const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpxirx0mn";

// ── Types ─────────────────────────────────────────────────────────────
export interface ProductImageLike {
  url: string;
  alt?: string;
  publicId?: string | null;
  color?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

// ── Primary Image Selection ───────────────────────────────────────────
/**
 * Returns the best "front" image URL for a product, used in cards/listings.
 *
 * Priority:
 * 1. First non-video image in array order (API sorts by sortOrder asc,
 *    so images[0] is always the front-side image)
 * 2. isPrimary flag fallback
 * 3. Keyword detection ("front", "1st", "first")
 * 4. First image regardless of type
 * 5. Placeholder fallback
 */
export function getPrimaryProductImage(
  images: ProductImageLike[] | { url: string }[] | undefined | null
): string {
  if (!images || images.length === 0) return PLACEHOLDER_IMAGE;

  // Cast to full shape; missing fields are undefined and that's fine
  const imgs = images as ProductImageLike[];

  // Filter out video URLs (Cloudinary /video/upload/ paths)
  const nonVideoImages = imgs.filter(
    (img) => img.url && !img.url.includes("/video/upload/")
  );

  // 1. First non-video image in array order (sortOrder from API)
  //    This is the card's first photo = front side of the cloth
  if (nonVideoImages.length > 0 && nonVideoImages[0].url) {
    return nonVideoImages[0].url;
  }

  // 2. isPrimary flag (fallback for edge cases)
  const primary = imgs.find((img) => img.isPrimary);
  if (primary?.url) return primary.url;

  // 3. Keyword detection: "front", "1st", "first" in alt/publicId/url
  const frontKeywords = /front|1st|first/i;
  const frontMatch = imgs.find(
    (img) =>
      frontKeywords.test(img.alt || "") ||
      frontKeywords.test(img.publicId || "") ||
      frontKeywords.test(img.url || "")
  );
  if (frontMatch?.url) return frontMatch.url;

  // 4. First image regardless
  if (imgs[0]?.url) return imgs[0].url;

  return PLACEHOLDER_IMAGE;
}

// ── Cloudinary URL Builders ───────────────────────────────────────────
/**
 * Build a correct Cloudinary delivery URL from a public_id.
 * For videos, uses /video/upload/; for images, /image/upload/.
 */
export function normalizeCloudinaryMedia(
  publicId: string,
  type: "image" | "video" = "image"
): string {
  if (!CLOUD_NAME) {
    if (process.env.NODE_ENV === "development") {
      console.error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
    }
    return "";
  }

  const resourceType = type === "video" ? "video" : "image";
  const cleanId = publicId.replace(/^\/+/, "");
  const encodedId = cleanId
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/f_auto,q_auto/${encodedId}`;
}

/**
 * Dev-mode validation: warns about video URLs using /image/upload/ or
 * image URLs using /video/upload/.
 */
export function validateCloudinaryUrl(url: string, expectedType: "image" | "video"): void {
  if (process.env.NODE_ENV !== "development") return;
  if (!url || !url.includes("res.cloudinary.com")) return;

  if (expectedType === "video" && url.includes("/image/upload/")) {
    console.error(
      `[media-helpers] Video URL incorrectly uses /image/upload/: ${url}`
    );
  }
  if (expectedType === "image" && url.includes("/video/upload/")) {
    console.error(
      `[media-helpers] Image URL incorrectly uses /video/upload/: ${url}`
    );
  }
}
