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

    // Fetch extended profile from our users table
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

    if (!profile) {
      // User exists in Supabase Auth but not in our DB yet
      // This can happen on first login — create the profile or sync ID if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (existingUser) {
        console.log(`[getCurrentUser] Syncing user ID for ${user.email} from ${existingUser.id} to ${user.id}`);
        // Delete any UserRoles linked to the old user ID to avoid FK errors
        await prisma.userRole.deleteMany({
          where: { userId: existingUser.id },
        });
        // Update user ID
        await prisma.$executeRawUnsafe('UPDATE "User" SET id = $1 WHERE email = $2', user.id, user.email!);

        // Fetch again after sync
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

      const newProfile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
          image: user.user_metadata?.avatar_url ?? null,
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
    }

    return profile;
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

    if (!profile) {
      // Auto-create profile for new Supabase Auth users or sync ID if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (existingUser) {
        console.log(`[getCurrentUserWithRole] Syncing user ID for ${user.email} from ${existingUser.id} to ${user.id}`);
        // Delete any UserRoles linked to the old user ID to avoid FK errors
        await prisma.userRole.deleteMany({
          where: { userId: existingUser.id },
        });
        // Update user ID
        await prisma.$executeRawUnsafe('UPDATE "User" SET id = $1 WHERE email = $2', user.id, user.email!);

        // Fetch again after sync
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

      const newProfile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
          image: user.user_metadata?.avatar_url ?? null,
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
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      image: profile.image,
      phone: profile.phone,
      role: profile.userRoles[0]?.role ?? null,
    };
  } catch (error) {
    console.error('[GET_USER_WITH_ROLE_ERROR]', error);
    return null;
  }
}
