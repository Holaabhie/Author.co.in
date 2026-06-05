import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://author.co.in';

  // Base pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/shop`, lastModified: new Date() },
    { url: `${baseUrl}/account`, lastModified: new Date() },
  ];

  try {
    // Active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const productUrls = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: new Date(p.updatedAt),
    }));

    // Active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const categoryUrls = categories.map((c) => ({
      url: `${baseUrl}/shop?category=${c.slug}`,
      lastModified: new Date(c.updatedAt),
    }));

    return [...staticPages, ...productUrls, ...categoryUrls];
  } catch (error) {
    console.error('[SITEMAP_GENERATION_ERROR]', error);
    return staticPages;
  }
}
