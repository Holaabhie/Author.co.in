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
 * 1. isPrimary === true AND is an image (not a video URL)
 * 2. Image whose alt/publicId/url contains "front" or "1st" keywords
 * 3. Lowest sortOrder image
 * 4. First image in array
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
  const candidates = nonVideoImages.length > 0 ? nonVideoImages : imgs;

  // 1. isPrimary flag
  const primary = candidates.find((img) => img.isPrimary);
  if (primary?.url) return primary.url;

  // 2. Keyword detection: "front", "1st", "_1st_", "first" in alt/publicId/url
  const frontKeywords = /front|1st|first/i;
  const frontMatch = candidates.find(
    (img) =>
      frontKeywords.test(img.alt || "") ||
      frontKeywords.test(img.publicId || "") ||
      frontKeywords.test(img.url || "")
  );
  if (frontMatch?.url) return frontMatch.url;

  // 3. Lowest sortOrder
  const sorted = [...candidates].sort(
    (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
  );
  if (sorted[0]?.url) return sorted[0].url;

  // 4. First image
  if (candidates[0]?.url) return candidates[0].url;

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
