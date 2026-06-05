import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

// ─── GET /api/admin/products ───────────────────────────────────────
// List all products (including inactive) with pagination, search, category filter
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    const search = searchParams.get('search')?.trim() ?? '';
    const categoryId = searchParams.get('categoryId') ?? undefined;
    const brandId = searchParams.get('brandId') ?? undefined;
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (isFeatured !== null && isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    // Allowed sort fields to prevent injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'stock'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { id: true, url: true, alt: true },
          },
          _count: {
            select: {
              variants: true,
              reviews: true,
              orderItems: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return apiSuccess(products, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch products', 500);
  }
}

// ─── POST /api/admin/products ──────────────────────────────────────
// Create a new product
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();

    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      discountPrice,
      costPrice,
      sku,
      stock,
      isActive,
      isFeatured,
      badge,
      weight,
      details,
      careInstructions,
      tags,
      hsnCode,
      metaTitle,
      metaDescription,
      categoryId,
      brandId,
      images,
      variants,
    } = body;

    // Validation
    if (!name?.trim()) {
      return apiError('VALIDATION_ERROR', 'Product name is required');
    }
    if (!slug?.trim()) {
      return apiError('VALIDATION_ERROR', 'Product slug is required');
    }
    if (!description?.trim()) {
      return apiError('VALIDATION_ERROR', 'Product description is required');
    }
    if (typeof price !== 'number' || price < 0) {
      return apiError('VALIDATION_ERROR', 'Price must be a non-negative number (in paise)');
    }

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      return apiError('CONFLICT', 'A product with this slug already exists', 409);
    }

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku) {
        return apiError('CONFLICT', 'A product with this SKU already exists', 409);
      }
    }

    // Create product with images and variants in a transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          shortDescription: shortDescription?.trim() ?? null,
          price,
          discountPrice: discountPrice ?? null,
          costPrice: costPrice ?? null,
          sku: sku?.trim() ?? null,
          stock: stock ?? 0,
          isActive: isActive ?? true,
          isFeatured: isFeatured ?? false,
          badge: badge?.trim() ?? null,
          weight: weight ?? null,
          details: details ?? [],
          careInstructions: careInstructions ?? [],
          tags: tags ?? [],
          hsnCode: hsnCode?.trim() ?? null,
          metaTitle: metaTitle?.trim() ?? null,
          metaDescription: metaDescription?.trim() ?? null,
          categoryId: categoryId ?? null,
          brandId: brandId ?? null,
        },
      });

      // Create images if provided
      if (Array.isArray(images) && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number; assetId?: string }, index: number) => ({
            productId: newProduct.id,
            url: img.url,
            alt: img.alt ?? '',
            isPrimary: img.isPrimary ?? index === 0,
            sortOrder: img.sortOrder ?? index,
            assetId: img.assetId ?? null,
          })),
        });
      }

      // Create variants if provided
      if (Array.isArray(variants) && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: { size: string; color: string; colorHex?: string; stock?: number; sku?: string; priceOverride?: number }) => ({
            productId: newProduct.id,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex ?? '#000000',
            stock: v.stock ?? 0,
            sku: v.sku ?? null,
            priceOverride: v.priceOverride ?? null,
          })),
        });
      }

      // Return with relations
      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: true,
          variants: true,
        },
      });
    });

    // Revalidate product-related pages
    revalidateContent('product');

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'product.create',
      entity: 'Product',
      entityId: product?.id,
      payload: { name, slug, price },
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ADMIN_PRODUCTS_POST]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create product', 500);
  }
}
