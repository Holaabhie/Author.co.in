import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const email = 'author.handling@gmail.com';
  const password = 'Author@1869786';

  try {
    // 1. Sign up / Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // If user already exists, it might return an error or just return the user without session
      console.error('Supabase Auth error:', authError.message);
    }

    // Try to login to get the user ID if signup failed due to user existing
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const user = authData?.user || loginData?.user;

    if (!user) {
      return NextResponse.json({ 
        error: 'Could not create or login user', 
        details: authError?.message || loginError?.message 
      }, { status: 400 });
    }

    // 2. Add to Prisma (User and UserRole)
    let prismaMessage = 'Prisma step skipped (DATABASE_URL missing)';
    if (process.env.DATABASE_URL) {
      // Sync the user ID in the database if the email exists but has a different ID
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== user.id) {
        console.log(`[setup-admin] Syncing user ID for ${email} from ${existingUser.id} to ${user.id}`);
        // First delete any UserRoles linked to the old user ID to avoid FK errors
        await prisma.userRole.deleteMany({
          where: { userId: existingUser.id }
        });
        // Update user ID
        await prisma.$executeRawUnsafe('UPDATE "User" SET id = $1 WHERE email = $2', user.id, email);
      }

      // Ensure user exists in Prisma
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          id: user.id,
          email,
          name: 'Admin',
        },
      });

      // Ensure UserRole exists
      await prisma.userRole.upsert({
        where: {
          userId_role: {
            userId: dbUser.id,
            role: 'SUPER_ADMIN',
          },
        },
        update: {},
        create: {
          userId: dbUser.id,
          role: 'SUPER_ADMIN',
          grantedBy: 'SYSTEM',
        },
      });

      prismaMessage = 'Successfully assigned SUPER_ADMIN role in database.';
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user processed successfully.',
      email,
      userId: user.id,
      prismaMessage,
      note: 'If email confirmation is enabled on your Supabase project, you may need to confirm the email before logging in.'
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
