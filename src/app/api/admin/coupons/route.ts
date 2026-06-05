import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { revalidateContent } from '@/lib/revalidation';

// ─── GET /api/admin/coupons ────────────────────────────────────────
// List coupons with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(['VIEWER', 'SUPPORT', 'OPERATIONS', 'MARKETING', 'ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    const search = searchParams.get('search')?.trim() ?? '';
    const isActive = searchParams.get('isActive');
    const discountType = searchParams.get('discountType') ?? undefined;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (discountType) {
      where.discountType = discountType;
    }

    const [coupons, total] = await Promise.all([
      prisma.couponCode.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { usageRecords: true, orders: true } },
        },
      }),
      prisma.couponCode.count({ where }),
    ]);

    return apiSuccess(coupons, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[ADMIN_COUPONS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch coupons', 500);
  }
}

// ─── POST /api/admin/coupons ───────────────────────────────────────
// Create a coupon
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'MARKETING']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perCustomerLimit,
      applicableTo,
      productIds,
      categoryIds,
      firstOrderOnly,
      startsAt,
      expiresAt,
    } = body;

    // Validation
    if (!code?.trim()) {
      return apiError('VALIDATION_ERROR', 'Coupon code is required');
    }
    if (!discountType) {
      return apiError('VALIDATION_ERROR', 'Discount type is required');
    }
    const validDiscountTypes = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'];
    if (!validDiscountTypes.includes(discountType)) {
      return apiError('VALIDATION_ERROR', `Invalid discount type. Must be one of: ${validDiscountTypes.join(', ')}`);
    }
    if (typeof discountValue !== 'number' || discountValue <= 0) {
      return apiError('VALIDATION_ERROR', 'Discount value must be a positive number');
    }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      return apiError('VALIDATION_ERROR', 'Percentage discount cannot exceed 100');
    }

    // Check code uniqueness
    const existingCode = await prisma.couponCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (existingCode) {
      return apiError('CONFLICT', 'A coupon with this code already exists', 409);
    }

    // Validate dates
    if (expiresAt && startsAt && new Date(expiresAt) <= new Date(startsAt)) {
      return apiError('VALIDATION_ERROR', 'Expiry date must be after start date');
    }

    const coupon = await prisma.couponCode.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description?.trim() ?? null,
        discountType,
        discountValue,
        minOrderValue: minOrderValue ?? 0,
        maxDiscount: maxDiscount ?? null,
        usageLimit: usageLimit ?? null,
        perCustomerLimit: perCustomerLimit ?? null,
        applicableTo: applicableTo ?? 'ALL',
        productIds: productIds ?? [],
        categoryIds: categoryIds ?? [],
        firstOrderOnly: firstOrderOnly ?? false,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    revalidateContent('coupon');

    await logAdminAction({
      adminId: admin.id,
      action: 'coupon.create',
      entity: 'CouponCode',
      entityId: coupon.id,
      payload: { code: coupon.code, discountType, discountValue },
    });

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_COUPONS_POST]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create coupon', 500);
  }
}

// ─── PUT /api/admin/coupons ────────────────────────────────────────
// Update a coupon (id in body)
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'MARKETING']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const {
      id,
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perCustomerLimit,
      applicableTo,
      productIds,
      categoryIds,
      firstOrderOnly,
      isActive,
      startsAt,
      expiresAt,
    } = body;

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Coupon id is required');
    }

    const existing = await prisma.couponCode.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Coupon not found', 404);
    }

    // Check code uniqueness if changed
    if (code && code.trim().toUpperCase() !== existing.code) {
      const codeTaken = await prisma.couponCode.findUnique({
        where: { code: code.trim().toUpperCase() },
      });
      if (codeTaken) {
        return apiError('CONFLICT', 'A coupon with this code already exists', 409);
      }
    }

    // Validate percentage
    if (discountType === 'PERCENTAGE' && discountValue !== undefined && discountValue > 100) {
      return apiError('VALIDATION_ERROR', 'Percentage discount cannot exceed 100');
    }

    const coupon = await prisma.couponCode.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.trim().toUpperCase() }),
        ...(description !== undefined && { description: description?.trim() ?? null }),
        ...(discountType !== undefined && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(minOrderValue !== undefined && { minOrderValue }),
        ...(maxDiscount !== undefined && { maxDiscount }),
        ...(usageLimit !== undefined && { usageLimit }),
        ...(perCustomerLimit !== undefined && { perCustomerLimit }),
        ...(applicableTo !== undefined && { applicableTo }),
        ...(productIds !== undefined && { productIds }),
        ...(categoryIds !== undefined && { categoryIds }),
        ...(firstOrderOnly !== undefined && { firstOrderOnly }),
        ...(isActive !== undefined && { isActive }),
        ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    revalidateContent('coupon');

    await logAdminAction({
      adminId: admin.id,
      action: 'coupon.update',
      entity: 'CouponCode',
      entityId: id,
      payload: { code: coupon.code, updatedFields: Object.keys(body).filter((k) => k !== 'id') },
    });

    return apiSuccess(coupon);
  } catch (error) {
    console.error('[ADMIN_COUPONS_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update coupon', 500);
  }
}

// ─── DELETE /api/admin/coupons ─────────────────────────────────────
// Deactivate coupon (set isActive: false)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN', 'MARKETING']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Coupon id is required as query parameter');
    }

    const existing = await prisma.couponCode.findUnique({ where: { id } });
    if (!existing) {
      return apiError('NOT_FOUND', 'Coupon not found', 404);
    }

    await prisma.couponCode.update({
      where: { id },
      data: { isActive: false },
    });

    revalidateContent('coupon');

    await logAdminAction({
      adminId: admin.id,
      action: 'coupon.deactivate',
      entity: 'CouponCode',
      entityId: id,
      payload: { code: existing.code },
    });

    return apiSuccess({ id, deactivated: true });
  } catch (error) {
    console.error('[ADMIN_COUPONS_DELETE]', error);
    return apiError('INTERNAL_ERROR', 'Failed to deactivate coupon', 500);
  }
}
