import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

// ─── GET /api/admin/brands ─────────────────────────────────────────
// List all brands with product counts
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);
    const search = searchParams.get('search')?.trim() ?? '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      }),
      prisma.brand.count({ where }),
    ]);

    return apiSuccess(brands, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[ADMIN_BRANDS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch brands', 500);
  }
}

// ─── POST /api/admin/brands ────────────────────────────────────────
// Create a brand
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { name, slug, logoAssetId } = body;

    if (!name?.trim()) {
      return apiError('VALIDATION_ERROR', 'Brand name is required');
    }
    if (!slug?.trim()) {
      return apiError('VALIDATION_ERROR', 'Brand slug is required');
    }

    // Check uniqueness
    const existingName = await prisma.brand.findUnique({ where: { name: name.trim() } });
    if (existingName) {
      return apiError('CONFLICT', 'A brand with this name already exists', 409);
    }

    const existingSlug = await prisma.brand.findUnique({ where: { slug: slug.trim().toLowerCase() } });
    if (existingSlug) {
      return apiError('CONFLICT', 'A brand with this slug already exists', 409);
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        logoAssetId: logoAssetId ?? null,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    revalidateContent('brand');

    await logAdminAction({
      adminId: admin.id,
      action: 'brand.create',
      entity: 'Brand',
      entityId: brand.id,
      payload: { name, slug },
    });

    return NextResponse.json({ success: true, data: brand }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_BRANDS_POST]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create brand', 500);
  }
}

// ─── PUT /api/admin/brands ─────────────────────────────────────────
// Update a brand (id in body)
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { id, name, slug, logoAssetId } = body;

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Brand id is required');
    }

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Brand not found', 404);
    }

    // Check name uniqueness if changed
    if (name && name.trim() !== existing.name) {
      const nameTaken = await prisma.brand.findUnique({ where: { name: name.trim() } });
      if (nameTaken) {
        return apiError('CONFLICT', 'A brand with this name already exists', 409);
      }
    }

    // Check slug uniqueness if changed
    if (slug && slug.trim().toLowerCase() !== existing.slug) {
      const slugTaken = await prisma.brand.findUnique({ where: { slug: slug.trim().toLowerCase() } });
      if (slugTaken) {
        return apiError('CONFLICT', 'A brand with this slug already exists', 409);
      }
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim().toLowerCase() }),
        ...(logoAssetId !== undefined && { logoAssetId: logoAssetId ?? null }),
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    revalidateContent('brand');

    await logAdminAction({
      adminId: admin.id,
      action: 'brand.update',
      entity: 'Brand',
      entityId: id,
      payload: { updatedFields: Object.keys(body).filter((k) => k !== 'id') },
    });

    return apiSuccess(brand);
  } catch (error) {
    console.error('[ADMIN_BRANDS_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update brand', 500);
  }
}

// ─── DELETE /api/admin/brands ──────────────────────────────────────
// Delete brand (only if no products associated)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Brand id is required as query parameter');
    }

    const existing = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!existing) {
      return apiError('NOT_FOUND', 'Brand not found', 404);
    }

    if (existing._count.products > 0) {
      return apiError(
        'CONFLICT',
        `Cannot delete brand: ${existing._count.products} product(s) are still associated`,
        409
      );
    }

    await prisma.brand.delete({ where: { id } });

    revalidateContent('brand');

    await logAdminAction({
      adminId: admin.id,
      action: 'brand.delete',
      entity: 'Brand',
      entityId: id,
      payload: { name: existing.name, slug: existing.slug },
    });

    return apiSuccess({ id, deleted: true });
  } catch (error) {
    console.error('[ADMIN_BRANDS_DELETE]', error);
    return apiError('INTERNAL_ERROR', 'Failed to delete brand', 500);
  }
}
