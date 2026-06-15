import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  phone: string | null;
}

export interface AuthUserWithRole extends AuthUser {
  role: string | null;
}

async function alignLegacyUser(
  legacyUser: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    image: string | null;
    isBlocked: boolean;
    internalNotes: string | null;
    createdAt: Date;
  },
  supabaseId: string
) {
  console.log(`[alignLegacyUser] Migrating user ID for ${legacyUser.email} from legacy: "${legacyUser.id}" to Supabase: "${supabaseId}"`);

  await prisma.$transaction(async (tx) => {
    const tempEmail = `${legacyUser.email}_migration_${Date.now()}`;

    // 1. Free up email unique constraint on legacy user
    await tx.user.update({
      where: { id: legacyUser.id },
      data: { email: tempEmail },
    });

    // 2. Create the new user with the Supabase Auth ID and correct email
    await tx.user.create({
      data: {
        id: supabaseId,
        email: legacyUser.email,
        name: legacyUser.name,
        phone: legacyUser.phone,
        image: legacyUser.image,
        isBlocked: legacyUser.isBlocked,
        internalNotes: legacyUser.internalNotes,
        createdAt: legacyUser.createdAt,
      },
    });

    // 3. Re-associate all related records
    await tx.userRole.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.address.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.cartItem.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.order.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.returnRequest.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.couponUsage.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.discountUsage.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.wishlistItem.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.review.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.productView.updateMany({
      where: { userId: legacyUser.id },
      data: { userId: supabaseId },
    });

    await tx.adminAuditLog.updateMany({
      where: { adminId: legacyUser.id },
      data: { adminId: supabaseId },
    });

    await tx.inventoryHistory.updateMany({
      where: { adminId: legacyUser.id },
      data: { adminId: supabaseId },
    });

    await tx.mediaAsset.updateMany({
      where: { uploadedBy: legacyUser.id },
      data: { uploadedBy: supabaseId },
    });

    await tx.mediaLibrary.updateMany({
      where: { uploadedBy: legacyUser.id },
      data: { uploadedBy: supabaseId },
    });

    // 4. Safely delete the legacy user
    await tx.user.delete({
      where: { id: legacyUser.id },
    });
  });

  console.log(`[alignLegacyUser] Successfully aligned user ID for ${legacyUser.email} to ${supabaseId}`);
}

/**
 * Get the currently authenticated user from Supabase Auth.
 * Use in Server Components, Route Handlers, and Server Actions.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    // 1. Try to find the local user by Supabase auth.uid()
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
      },
    });

    if (profile) return profile;

    // 2. If not found by ID, search by email to check for a legacy ID
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (existingUser) {
      // Safely align/migrate the legacy user ID to Supabase Auth ID via transaction
      await alignLegacyUser(existingUser, user.id);

      // Fetch the synced user details
      const syncedProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phone: true,
        },
      });
      if (syncedProfile) return syncedProfile;
    }

    // 3. If no user exists by email or ID, create a new local user using Supabase metadata
    const newProfile = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
        phone: user.phone ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
      },
    });

    return newProfile;
  } catch (error) {
    console.error('[GET_USER_ERROR]', error);
    return null;
  }
}

/**
 * Get the current user with their admin role (if any).
 * Returns null if not authenticated.
 */
export async function getCurrentUserWithRole(): Promise<AuthUserWithRole | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    // 1. Try to find the local user by Supabase auth.uid()
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        userRoles: {
          select: { role: true },
          take: 1,
        },
      },
    });

    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        image: profile.image,
        phone: profile.phone,
        role: profile.userRoles[0]?.role ?? null,
      };
    }

    // 2. If not found by ID, search by email to check for a legacy ID
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (existingUser) {
      // Safely align/migrate the legacy user ID to Supabase Auth ID via transaction
      await alignLegacyUser(existingUser, user.id);

      // Fetch the synced user details
      const syncedProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phone: true,
          userRoles: {
            select: { role: true },
            take: 1,
          },
        },
      });

      if (syncedProfile) {
        return {
          id: syncedProfile.id,
          email: syncedProfile.email,
          name: syncedProfile.name,
          image: syncedProfile.image,
          phone: syncedProfile.phone,
          role: syncedProfile.userRoles[0]?.role ?? null,
        };
      }
    }

    // 3. If no user exists, create a new local user using Supabase metadata
    const newProfile = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
        phone: user.phone ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
      },
    });

    return { ...newProfile, role: null };
  } catch (error) {
    console.error('[GET_USER_WITH_ROLE_ERROR]', error);
    return null;
  }
}
