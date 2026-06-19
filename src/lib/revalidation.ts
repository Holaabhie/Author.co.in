import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Content-key-to-path mapping for targeted ISR revalidation.
 * When CMS content or products change, we revalidate only the affected pages.
 */

const CONTENT_PATH_MAP: Record<string, string[]> = {
  // Products
  'product': ['/shop', '/'],
  'category': ['/shop', '/'],
  'brand': ['/shop'],
  
  // CMS
  'hero': ['/'],
  'featured': ['/'],
  'announcement': ['/'],
  'about': ['/about'],
  'contact': ['/contact'],
  'lookbook': ['/lookbook'],
  'privacy': ['/privacy'],
  'terms': ['/terms'],
  'shipping': ['/shipping-policy'],
  // REMOVED: 'returns': ['/return-policy'],
  
  // Navigation
  'navigation': ['/'],
  
  // Flash Sales
  'flash-sale': ['/shop', '/'],
  
  // Coupons (admin-only, but might affect public pricing display)
  'coupon': [],
};

/**
 * Revalidate all pages affected by a content change.
 * 
 * @param contentKey - The type of content that changed (e.g., 'product', 'hero')
 * @param specificPath - Optional specific path to also revalidate (e.g., '/product/some-slug')
 * 
 * @example
 * // After updating a product
 * await revalidateContent('product', `/product/${product.slug}`);
 * 
 * // After updating CMS hero section
 * await revalidateContent('hero');
 */
export function revalidateContent(
  contentKey: string,
  specificPath?: string
): void {
  const paths = CONTENT_PATH_MAP[contentKey] ?? [];

  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`[REVALIDATION] Failed to revalidate ${path}:`, error);
    }
  }

  if (specificPath) {
    try {
      revalidatePath(specificPath);
    } catch (error) {
      console.error(`[REVALIDATION] Failed to revalidate ${specificPath}:`, error);
    }
  }
}

/**
 * Revalidate by tag (for more granular control).
 */
export function revalidateByTag(tag: string): void {
  try {
    revalidateTag(tag);
  } catch (error) {
    console.error(`[REVALIDATION] Failed to revalidate tag ${tag}:`, error);
  }
}

/**
 * Revalidate the product sitemap.
 */
export function revalidateSitemap(): void {
  try {
    revalidatePath('/sitemap.xml');
  } catch (error) {
    console.error('[REVALIDATION] Failed to revalidate sitemap:', error);
  }
}

/**
 * Full revalidation — use sparingly (e.g., after bulk CMS operations).
 */
export function revalidateAll(): void {
  revalidatePath('/', 'layout');
}
