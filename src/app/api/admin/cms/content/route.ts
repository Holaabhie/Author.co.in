import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';
import { revalidateContent } from '@/lib/revalidation';

/**
 * GET /api/admin/cms/content
 * Fetch CMS content by key or list all content keys
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole([
    'SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATIONS', 'SUPPORT', 'VIEWER',
  ]);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const key = request.nextUrl.searchParams.get('key');

    if (key) {
      const content = await prisma.cmsContent.findUnique({
        where: { key },
      });
      if (!content) return apiError('NOT_FOUND', `Content key '${key}' not found`, 404);
      return apiSuccess(content);
    }

    const allContent = await prisma.cmsContent.findMany({
      orderBy: { key: 'asc' },
    });
    return apiSuccess(allContent);
  } catch (error) {
    console.error('[CMS_GET_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch CMS content', 500);
  }
}

/**
 * PUT /api/admin/cms/content
 * Update CMS content by key
 * Body: { key, value (JSON), revalidateKey? }
 */
export async function PUT(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN', 'MARKETING']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { key, value, revalidateKey } = await request.json();

    if (!key || value === undefined) {
      return apiError('VALIDATION_ERROR', 'Key and value are required', 400);
    }

    const content = await prisma.cmsContent.upsert({
      where: { key },
      create: {
        key,
        value,
        updatedBy: admin.id,
      },
      update: {
        value,
        updatedBy: admin.id,
      },
    });

    // Revalidate affected pages
    revalidateContent(revalidateKey || key);

    await logAdminAction({
      adminId: admin.id,
      action: 'cms.update',
      entity: 'cms_content',
      entityId: key,
    });

    return apiSuccess(content);
  } catch (error) {
    console.error('[CMS_UPDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update CMS content', 500);
  }
}

/**
 * POST /api/admin/cms/content
 * Create CMS content
 * Body: { key, value (JSON) }
 */
export async function POST(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN', 'MARKETING']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return apiError('VALIDATION_ERROR', 'Key and value are required', 400);
    }

    const exists = await prisma.cmsContent.findUnique({ where: { key } });
    if (exists) {
      return apiError('DUPLICATE', `Content key '${key}' already exists`, 409);
    }

    const content = await prisma.cmsContent.create({
      data: {
        key,
        value,
        updatedBy: admin.id,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'cms.create',
      entity: 'cms_content',
      entityId: key,
    });

    return apiSuccess(content);
  } catch (error) {
    console.error('[CMS_CREATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create CMS content', 500);
  }
}
