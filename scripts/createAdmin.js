const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

// 1. Load env variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) return;
    const key = trimmed.substring(0, firstEq).trim();
    let val = trimmed.substring(firstEq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const email = process.env.ADMIN_EMAIL || 'author.handling@gmail.com';
const password = process.env.ADMIN_PASSWORD || 'Author@1869786';

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set.');
    process.exit(1);
  }

  console.log(`Connecting to Supabase Auth at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Signing up / Signing in admin user: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.log(`Supabase signUp note: ${authError.message}`);
  }

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const user = authData?.user || loginData?.user;

  if (!user) {
    console.error('Could not retrieve or create user in Supabase Auth:', authError?.message || loginError?.message);
    process.exit(1);
  }

  const userId = user.id;
  console.log(`Supabase Auth User ID: ${userId}`);

  console.log('Connecting to PostgreSQL using PG driver adapter...');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`Checking database for existing user by email: ${email}...`);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.id !== userId) {
        console.log(`Mismatched user ID found! DB ID: ${existingUser.id}, Auth ID: ${userId}`);
        console.log(`Syncing user ID in database...`);
        
        // Delete any UserRoles linked to the old user ID to avoid foreign key violations
        await prisma.userRole.deleteMany({
          where: { userId: existingUser.id },
        });

        // Update User.id to match the Supabase Auth ID
        await prisma.$executeRawUnsafe('UPDATE "User" SET id = $1 WHERE email = $2', userId, email);
        console.log(`User ID updated in database.`);
      } else {
        console.log(`User ID is already correct and in sync: ${userId}`);
      }
    } else {
      console.log(`User does not exist in DB yet. Creating user...`);
    }

    console.log(`Upserting User details...`);
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: userId,
        email,
        name: 'Admin',
      },
    });
    console.log('User upserted successfully:', dbUser);

    console.log(`Assigning SUPER_ADMIN role...`);
    const dbRole = await prisma.userRole.upsert({
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
    console.log('UserRole upserted successfully:', dbRole);
    console.log('\n✅ SUCCESS: Admin setup and synchronization complete!');
  } catch (err) {
    console.error('Database Operation Error:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
