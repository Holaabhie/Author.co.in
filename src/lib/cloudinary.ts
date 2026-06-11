import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Build an optimized Cloudinary image URL from a public_id.
 * Uses auto quality and format by default for best performance.
 */
export function buildImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
  }
): string {
  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    quality: options?.quality ?? "auto",
    fetch_format: options?.format ?? "auto",
    secure: true,
  });
}
