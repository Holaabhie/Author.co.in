import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

// ─── GET /api/admin/categories ─────────────────────────────────────
// List categories as a tree (with children)
export async function GET(_request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    // Fetch all categories with children and product counts
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                _count: { select: { products: true } },
              },
            },
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });

    return apiSuccess(categories);
  } catch (error) {
    console.error('[ADMIN_CATEGORIES_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch categories', 500);
  }
}

// ─── POST /api/admin/categories ────────────────────────────────────
// Create a category
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { name, slug, description, parentId, thumbnailAssetId, sortOrder, isActive } = body;

    if (!name?.trim()) {
      return apiError('VALIDATION_ERROR', 'Category name is required');
    }
    if (!slug?.trim()) {
      return apiError('VALIDATION_ERROR', 'Category slug is required');
    }

    // Check slug uniqueness
    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      return apiError('CONFLICT', 'A category with this slug already exists', 409);
    }

    // Check name uniqueness
    const existingName = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existingName) {
      return apiError('CONFLICT', 'A category with this name already exists', 409);
    }

    // Validate parentId if provided
    if (parentId) {
      const parentExists = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        return apiError('VALIDATION_ERROR', 'Parent category does not exist');
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() ?? null,
        parentId: parentId ?? null,
        thumbnailAssetId: thumbnailAssetId ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    });

    revalidateContent('category');

    await logAdminAction({
      adminId: admin.id,
      action: 'category.create',
      entity: 'Category',
      entityId: category.id,
      payload: { name, slug },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_CATEGORIES_POST]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create category', 500);
  }
}

// ─── PUT /api/admin/categories ─────────────────────────────────────
// Update a category (id in body)
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { id, name, slug, description, parentId, thumbnailAssetId, sortOrder, isActive } = body;

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Category id is required');
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Category not found', 404);
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.category.findUnique({ where: { slug } });
      if (slugTaken) {
        return apiError('CONFLICT', 'A category with this slug already exists', 409);
      }
    }

    // Check name uniqueness if changed
    if (name && name.trim() !== existing.name) {
      const nameTaken = await prisma.category.findUnique({ where: { name: name.trim() } });
      if (nameTaken) {
        return apiError('CONFLICT', 'A category with this name already exists', 409);
      }
    }

    // Prevent self-referencing
    if (parentId === id) {
      return apiError('VALIDATION_ERROR', 'A category cannot be its own parent');
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim().toLowerCase() }),
        ...(description !== undefined && { description: description?.trim() ?? null }),
        ...(parentId !== undefined && { parentId: parentId ?? null }),
        ...(thumbnailAssetId !== undefined && { thumbnailAssetId: thumbnailAssetId ?? null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    });

    revalidateContent('category');

    await logAdminAction({
      adminId: admin.id,
      action: 'category.update',
      entity: 'Category',
      entityId: id,
      payload: { updatedFields: Object.keys(body).filter((k) => k !== 'id') },
    });

    return apiSuccess(category);
  } catch (error) {
    console.error('[ADMIN_CATEGORIES_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update category', 500);
  }
}

// ─── DELETE /api/admin/categories ──────────────────────────────────
// Delete category (only if no products associated)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Category id is required as query parameter');
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!existing) {
      return apiError('NOT_FOUND', 'Category not found', 404);
    }

    if (existing._count.products > 0) {
      return apiError(
        'CONFLICT',
        `Cannot delete category: ${existing._count.products} product(s) are still associated`,
        409
      );
    }

    if (existing._count.children > 0) {
      return apiError(
        'CONFLICT',
        `Cannot delete category: ${existing._count.children} child category(ies) exist. Remove or reassign them first.`,
        409
      );
    }

    await prisma.category.delete({ where: { id } });

    revalidateContent('category');

    await logAdminAction({
      adminId: admin.id,
      action: 'category.delete',
      entity: 'Category',
      entityId: id,
      payload: { name: existing.name, slug: existing.slug },
    });

    return apiSuccess({ id, deleted: true });
  } catch (error) {
    console.error('[ADMIN_CATEGORIES_DELETE]', error);
    return apiError('INTERNAL_ERROR', 'Failed to delete category', 500);
  }
}
