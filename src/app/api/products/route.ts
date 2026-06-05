import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, parsePagination, paginationMeta, parseSortOrder } from '@/lib/api-helpers';

// GET /api/products?page=1&pageSize=20&category=t-shirts&brand=author&sort=-price&search=oversized&minPrice=999&maxPrice=4999
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const { page, pageSize, skip } = parsePagination(sp);
    const sort = parseSortOrder(sp.get('sort'), ['price', 'createdAt', 'name'], 'createdAt', 'desc');

    const where: any = { isActive: true };

    // Category filter by slug
    if (sp.get('category')) {
      where.category = { slug: sp.get('category') };
    }

    // Brand filter by slug
    if (sp.get('brand')) {
      where.brand = { slug: sp.get('brand') };
    }

    // Search
    const search = sp.get('search');
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    // Price range (paise)
    if (sp.get('minPrice')) {
      where.price = { ...where.price, gte: parseInt(sp.get('minPrice')!) * 100 };
    }
    if (sp.get('maxPrice')) {
      where.price = { ...where.price, lte: parseInt(sp.get('maxPrice')!) * 100 };
    }

    // Featured filter
    if (sp.get('featured') === 'true') {
      where.isFeatured = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 2 },
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
          variants: { select: { id: true, size: true, color: true, colorHex: true, stock: true } },
          _count: { select: { reviews: { where: { isApproved: true } } } },
        },
        orderBy: { [sort.field]: sort.order },
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return apiSuccess(products, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[PRODUCTS_LIST_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch products', 500);
  }
}
