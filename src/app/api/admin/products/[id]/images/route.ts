import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (Cloudinary handles large files well)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type RouteContext = { params: Promise<{ id: string }> };

function getCloudinaryPublicId(url: string): string | null {
  try {
    if (!url.includes('cloudinary.com')) return null;
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    const pathAndVersion = parts[1];
    const pathParts = pathAndVersion.split('/');
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }
    const pathWithoutVersion = pathParts.join('/');
    const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
    return lastDotIndex > -1 ? pathWithoutVersion.substring(0, lastDotIndex) : pathWithoutVersion;
  } catch (err) {
    console.error('Error parsing Cloudinary URL:', err);
    return null;
  }
}

// ─── POST /api/admin/products/[id]/images ──────────────────────────
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id: productId } = await context.params;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });

    if (!product) {
      return apiError('NOT_FOUND', 'Product not found. Create the product first, then upload images.', 404);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const replaceImageId = formData.get('replaceImageId') as string | null;

    if (!file) {
      return apiError('VALIDATION_ERROR', 'No file provided', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('FILE_TOO_LARGE', `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('INVALID_TYPE', `File type '${file.type}' not allowed.`, 400);
    }

    let existingImage = null;
    if (replaceImageId) {
      existingImage = await prisma.productImage.findFirst({
        where: { id: replaceImageId, productId },
      });
      if (!existingImage) {
        return apiError('NOT_FOUND', 'Image to replace not found', 404);
      }
    }

    // Convert file to buffer and base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const timestamp = Date.now();
    const sanitizedName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);

    const publicId = `${productId}_${timestamp}_${sanitizedName}`;

    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: 'products',
      public_id: publicId,
    });

    const url = uploadResponse.secure_url;

    if (existingImage) {
      // Delete old image from Cloudinary if it was a Cloudinary URL
      const oldPublicId = getCloudinaryPublicId(existingImage.url);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId);
        } catch (err) {
          console.error('[CLOUDINARY_DELETE_OLD_ERROR]', err);
        }
      }

      // Update in database
      const image = await prisma.productImage.update({
        where: { id: replaceImageId! },
        data: {
          url,
          alt: file.name.replace(/\.[^.]+$/, ''),
        },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'product.image_replace',
        entity: 'ProductImage',
        entityId: image.id,
        payload: { productId, publicId, url, replaceImageId },
      });

      return apiSuccess(image);
    } else {
      // Count existing images to determine sort order and primary status
      const existingCount = await prisma.productImage.count({
        where: { productId },
      });

      // Create ProductImage record
      const image = await prisma.productImage.create({
        data: {
          productId,
          url,
          alt: file.name.replace(/\.[^.]+$/, ''),
          isPrimary: existingCount === 0, // First image is primary
          sortOrder: existingCount,
        },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'product.image_upload',
        entity: 'ProductImage',
        entityId: image.id,
        payload: { productId, publicId, url },
      });

      return NextResponse.json(
        { success: true, data: image },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('[PRODUCT_IMAGE_UPLOAD]', error);
    return apiError('INTERNAL_ERROR', 'Failed to upload product image', 500);
  }
}

// ─── PATCH /api/admin/products/[id]/images ──────────────────────────
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id: productId } = await context.params;
    const body = await request.json();
    const { images } = body; // Array of { id: string, sortOrder: number, isPrimary: boolean }

    if (!Array.isArray(images)) {
      return apiError('VALIDATION_ERROR', 'images must be an array', 400);
    }

    // Perform updates inside a transaction
    await prisma.$transaction(
      images.map((img) =>
        prisma.productImage.update({
          where: { id: img.id, productId },
          data: {
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          },
        })
      )
    );

    await logAdminAction({
      adminId: admin.id,
      action: 'product.images_reorder',
      entity: 'Product',
      entityId: productId,
      payload: { images },
    });

    return apiSuccess({ updated: true });
  } catch (error) {
    console.error('[PRODUCT_IMAGES_PATCH]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update image positions', 500);
  }
}

// ─── DELETE /api/admin/products/[id]/images ─────────────────────────
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const { id: productId } = await context.params;
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return apiError('VALIDATION_ERROR', 'imageId is required', 400);
    }

    // Find the image record
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      return apiError('NOT_FOUND', 'Image not found for this product', 404);
    }

    // Delete from Cloudinary if it is a Cloudinary URL
    const publicId = getCloudinaryPublicId(image.url);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('[PRODUCT_IMAGE_CLOUDINARY_DELETE_ERROR]', err);
      }
    }

    // Delete from database
    await prisma.productImage.delete({ where: { id: imageId } });

    // If deleted image was primary, make the first remaining image primary
    if (image.isPrimary) {
      const firstRemaining = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });

      if (firstRemaining) {
        await prisma.productImage.update({
          where: { id: firstRemaining.id },
          data: { isPrimary: true },
        });
      }
    }

    await logAdminAction({
      adminId: admin.id,
      action: 'product.image_delete',
      entity: 'ProductImage',
      entityId: imageId,
      payload: { productId, publicId },
    });

    return apiSuccess({ deleted: true, imageId });
  } catch (error) {
    console.error('[PRODUCT_IMAGE_DELETE]', error);
    return apiError('INTERNAL_ERROR', 'Failed to delete product image', 500);
  }
}
