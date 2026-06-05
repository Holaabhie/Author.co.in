import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/admin/products/[id] ──────────────────────────────────
// Get single product with all fields (admin view)
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          include: {
            _count: { select: { orderItems: true } },
          },
          orderBy: { size: 'asc' },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
            wishlistItems: true,
            productViews: true,
          },
        },
      },
    });

    if (!product) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }

    return apiSuccess(product);
  } catch (error) {
    console.error('[ADMIN_PRODUCT_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch product', 500);
  }
}

// ─── PUT /api/admin/products/[id] ──────────────────────────────────
// Update product fields
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({ where: { slug: body.slug } });
      if (slugTaken) {
        return apiError('CONFLICT', 'A product with this slug already exists', 409);
      }
    }

    // If SKU is being changed, check uniqueness
    if (body.sku && body.sku !== existing.sku) {
      const skuTaken = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (skuTaken) {
        return apiError('CONFLICT', 'A product with this SKU already exists', 409);
      }
    }

    // Destructure allowed update fields
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

    const product = await prisma.$transaction(async (tx) => {
      // Update product fields
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(slug !== undefined && { slug: slug.trim().toLowerCase() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(shortDescription !== undefined && { shortDescription: shortDescription?.trim() ?? null }),
          ...(price !== undefined && { price }),
          ...(discountPrice !== undefined && { discountPrice }),
          ...(costPrice !== undefined && { costPrice }),
          ...(sku !== undefined && { sku: sku?.trim() ?? null }),
          ...(stock !== undefined && { stock }),
          ...(isActive !== undefined && { isActive }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(badge !== undefined && { badge: badge?.trim() ?? null }),
          ...(weight !== undefined && { weight }),
          ...(details !== undefined && { details }),
          ...(careInstructions !== undefined && { careInstructions }),
          ...(tags !== undefined && { tags }),
          ...(hsnCode !== undefined && { hsnCode: hsnCode?.trim() ?? null }),
          ...(metaTitle !== undefined && { metaTitle: metaTitle?.trim() ?? null }),
          ...(metaDescription !== undefined && { metaDescription: metaDescription?.trim() ?? null }),
          ...(categoryId !== undefined && { categoryId: categoryId ?? null }),
          ...(brandId !== undefined && { brandId: brandId ?? null }),
        },
      });

      // Replace images if provided
      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number; assetId?: string }, index: number) => ({
              productId: id,
              url: img.url,
              alt: img.alt ?? '',
              isPrimary: img.isPrimary ?? index === 0,
              sortOrder: img.sortOrder ?? index,
              assetId: img.assetId ?? null,
            })),
          });
        }
      }

      // Replace variants if provided
      if (Array.isArray(variants)) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v: { size: string; color: string; colorHex?: string; stock?: number; sku?: string; priceOverride?: number }) => ({
              productId: id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex ?? '#000000',
              stock: v.stock ?? 0,
              sku: v.sku ?? null,
              priceOverride: v.priceOverride ?? null,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          variants: true,
        },
      });
    });

    // Revalidate product pages
    revalidateContent('product', `/product/${product?.slug ?? existing.slug}`);

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'product.update',
      entity: 'Product',
      entityId: id,
      payload: { updatedFields: Object.keys(body) },
    });

    return apiSuccess(product);
  } catch (error) {
    console.error('[ADMIN_PRODUCT_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update product', 500);
  }
}

// ─── DELETE /api/admin/products/[id] ───────────────────────────────
// Soft-delete: set isActive to false
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id } = await context.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Revalidate product pages
    revalidateContent('product', `/product/${existing.slug}`);

    // Log admin action
    await logAdminAction({
      adminId: admin.id,
      action: 'product.soft_delete',
      entity: 'Product',
      entityId: id,
      payload: { name: existing.name, slug: existing.slug },
    });

    return apiSuccess({ id, deactivated: true });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_DELETE]', error);
    return apiError('INTERNAL_ERROR', 'Failed to deactivate product', 500);
  }
}
