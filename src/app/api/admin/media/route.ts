import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError, parsePagination, paginationMeta } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'media';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
];

/**
 * GET /api/admin/media
 * List media assets with pagination and filters.
 */
export async function GET(request: NextRequest) {
  const admin = await requireRole([
    'SUPER_ADMIN', 'ADMIN', 'MARKETING', 'OPERATIONS', 'VIEWER',
  ]);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const sp = request.nextUrl.searchParams;
    const { page, pageSize, skip } = parsePagination(sp);
    const folderId = sp.get('folderId');
    const search = sp.get('search');

    const where: Record<string, unknown> = {};
    if (folderId) where.folderId = folderId;
    if (folderId === 'root') where.folderId = null;
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          folder: { select: { id: true, name: true } },
        },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return apiSuccess(assets, paginationMeta(page, pageSize, total));
  } catch (error) {
    console.error('[MEDIA_LIST_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch media assets', 500);
  }
}

/**
 * POST /api/admin/media
 * Upload a media file to Supabase Storage.
 * Accepts FormData with: file, folderId?, altText?, tags?
 */
export async function POST(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN', 'MARKETING']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;
    const altText = (formData.get('altText') as string) || '';
    const tags = formData.get('tags')
      ? (formData.get('tags') as string).split(',').map((t) => t.trim().toLowerCase())
      : [];

    if (!file) {
      return apiError('VALIDATION_ERROR', 'No file provided', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('FILE_TOO_LARGE', `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('INVALID_TYPE', `File type '${file.type}' is not allowed`, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() ?? 'bin';
    const sanitizedName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    const storagePath = `${folderId || 'root'}/${timestamp}_${sanitizedName}.${ext}`;

    // Upload to Supabase Storage
    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[MEDIA_UPLOAD_ERROR]', uploadError);
      return apiError('UPLOAD_FAILED', 'Failed to upload file to storage', 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const url = urlData.publicUrl;

    // Generate thumbnail URL for images
    let thumbnailUrl: string | null = null;
    if (file.type.startsWith('image/') && !file.type.includes('svg')) {
      const { data: thumbData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath, {
          transform: {
            width: 300,
            height: 300,
            resize: 'contain',
          },
        });
      thumbnailUrl = thumbData.publicUrl;
    }

    // Create database record
    const asset = await prisma.mediaAsset.create({
      data: {
        filename: `${timestamp}_${sanitizedName}.${ext}`,
        originalFilename: file.name,
        url,
        thumbnailUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        altText,
        folderId: folderId || null,
        tags,
        uploadedBy: admin.id,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'media.upload',
      entity: 'media_asset',
      entityId: asset.id,
    });

    return apiSuccess(asset);
  } catch (error) {
    console.error('[MEDIA_UPLOAD_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to upload media', 500);
  }
}

/**
 * DELETE /api/admin/media
 * Delete a media asset.
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  const admin = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  if ('error' in admin) return NextResponse.json(admin, { status: admin.status });

  try {
    const { id } = await request.json();

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Asset ID is required', 400);
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      return apiError('NOT_FOUND', 'Asset not found', 404);
    }

    // Delete from Supabase Storage
    const supabase = createAdminClient();
    const storagePath = asset.url.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];

    if (storagePath) {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    }

    // Delete database record
    await prisma.mediaAsset.delete({ where: { id } });

    await logAdminAction({
      adminId: admin.id,
      action: 'media.delete',
      entity: 'media_asset',
      entityId: id,
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[MEDIA_DELETE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to delete media', 500);
  }
}
