import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';

/**
 * PUT /api/auth/update-profile
 * Update the authenticated user's profile name in the database.
 * Auth metadata is updated client-side via supabase.auth.updateUser().
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return apiError('VALIDATION_ERROR', 'Name is required', 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        updatedAt: new Date(),
      },
      select: { id: true, name: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('[PROFILE_UPDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update profile', 500);
  }
}
