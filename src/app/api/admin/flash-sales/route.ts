import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { revalidateContent } from '@/lib/revalidation';

/**
 * GET /api/admin/flash-sales
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole([
    'SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATIONS', 'VIEWER',
  ]);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const sp = request.nextUrl.searchParams;
    const { page, pageSize, skip } = parsePagination(sp);
    const status = sp.get('status'); // active, upcoming, ended, all

    const now = new Date();
    const where: Record<string, unknown> = {};

    if (status === 'active') {
      where.isActive = true;
      where.startAt = { lte: now };
      where.endAt = { gte: now };
    } else if (status === 'upcoming') {
      where.startAt = { gt: now };
    } else if (status === 'ended') {
      where.endAt = { lt: now };
    }

    const [sales, total] = await Promise.all([
      prisma.flashSale.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                select: { id: true, name: true, price: true, slug: true },
              },
            },
          },
        },
        orderBy: { startAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.flashSale.count({ where }),
    ]);

    return apiSuccess(sales, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[FLASH_SALES_LIST_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch flash sales', 500);
  }
}

/**
 * POST /api/admin/flash-sales
 */
export async function POST(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN', 'MARKETING']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { name, startAt, endAt, products: saleProducts } = await request.json();

    if (!name || !startAt || !endAt) {
      return apiError('VALIDATION_ERROR', 'name, startAt, and endAt are required', 400);
    }

    if (new Date(endAt) <= new Date(startAt)) {
      return apiError('VALIDATION_ERROR', 'endAt must be after startAt', 400);
    }

    if (!saleProducts || !Array.isArray(saleProducts) || saleProducts.length === 0) {
      return apiError('VALIDATION_ERROR', 'At least one product is required', 400);
    }

    const sale = await prisma.flashSale.create({
      data: {
        name,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        isActive: true,
        products: {
          create: saleProducts.map((p: { productId: string; salePrice: number }) => ({
            productId: p.productId,
            salePrice: p.salePrice,
          })),
        },
      },
      include: { products: true },
    });

    revalidateContent('flash-sale');

    await logAdminAction({
      adminId: admin.id,
      action: 'flash_sale.create',
      entity: 'FlashSale',
      entityId: sale.id,
    });

    return apiSuccess(sale);
  } catch (error) {
    console.error('[FLASH_SALE_CREATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create flash sale', 500);
  }
}

/**
 * PUT /api/admin/flash-sales
 */
export async function PUT(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN', 'MARKETING']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { id, name, startAt, endAt, isActive, products: saleProducts } = await request.json();

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Flash sale ID is required', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (startAt !== undefined) updateData.startAt = new Date(startAt);
    if (endAt !== undefined) updateData.endAt = new Date(endAt);
    if (isActive !== undefined) updateData.isActive = isActive;

    // If products array is provided, replace all products
    if (saleProducts && Array.isArray(saleProducts)) {
      await prisma.flashSaleProduct.deleteMany({ where: { flashSaleId: id } });
      await prisma.flashSaleProduct.createMany({
        data: saleProducts.map((p: { productId: string; salePrice: number }) => ({
          flashSaleId: id,
          productId: p.productId,
          salePrice: p.salePrice,
        })),
      });
    }

    const sale = await prisma.flashSale.update({
      where: { id },
      data: updateData,
      include: { products: { include: { product: { select: { name: true } } } } },
    });

    revalidateContent('flash-sale');

    await logAdminAction({
      adminId: admin.id,
      action: 'flash_sale.update',
      entity: 'FlashSale',
      entityId: id,
    });

    return apiSuccess(sale);
  } catch (error) {
    console.error('[FLASH_SALE_UPDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update flash sale', 500);
  }
}

/**
 * DELETE /api/admin/flash-sales
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { id } = await request.json();

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Flash sale ID is required', 400);
    }

    await prisma.flashSale.delete({ where: { id } });

    revalidateContent('flash-sale');

    await logAdminAction({
      adminId: admin.id,
      action: 'flash_sale.delete',
      entity: 'FlashSale',
      entityId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[FLASH_SALE_DELETE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to delete flash sale', 500);
  }
}
