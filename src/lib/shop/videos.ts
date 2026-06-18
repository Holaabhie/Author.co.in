/**
 * Video mappings for products.
 * Since the database schema is fixed and live, we use this config file
 * to map specific product slugs to their video URLs.
 *
 * HOW TO GET YOUR CLOUDINARY VIDEO URL:
 * 1. Go to cloudinary.com → Media Library
 * 2. Click on your video file
 * 3. Copy the "Public ID" from the right panel (e.g. "tops/black-top-reel")
 * 4. Your URL should be:
 *    https://res.cloudinary.com/dpxirx0mn/video/upload/q_auto,f_auto/<PUBLIC_ID>.mp4
 *
 * NOTE: The "https://collection.cloudinary.com/..." URLs are share links, NOT playable video URLs.
 * Only "https://res.cloudinary.com/.../video/upload/..." URLs work in <video> tags.
 */
export const PRODUCT_VIDEOS: Record<string, string> = {
  // Public IDs sourced from Cloudinary player embed links
  // Fix: swapped — black-top gets black video, white-top gets white video
  "black-top": "https://res.cloudinary.com/dpxirx0mn/video/upload/q_auto,f_auto/IMG_4681_y8q1o8.mp4",
  "white-top": "https://res.cloudinary.com/dpxirx0mn/video/upload/q_auto,f_auto/IMG_4677_ecmly7.mp4",
};

/**
 * Returns the video URL for a product slug, if one is configured.
 * Returns null if the URL is empty or missing (falls back to image display).
 */
export function getProductVideo(slug: string): string | null {
  const url = PRODUCT_VIDEOS[slug];
  return url && url.trim() !== "" ? url : null;
}

