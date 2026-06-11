const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

// 1. Load env variables from .env.local
const envPath = path.join(__dirname, '.env.local');

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

// Override database URL to use the IPv4 compatible pooler in Frankfurt region with brackets password
// process.env.DATABASE_URL = 'postgresql://postgres.vqabvjoayjjgzrfdrkag:%5BAuthor%401869786%5D@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const email = 'author.handling@gmail.com';
const password = 'Author@1869786';

async function main() {
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Signing up / Signing in user: ${email}...`);
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
  console.log(`Found Supabase Auth User ID: ${userId}`);

  console.log('Connecting to Postgres database via Prisma using url:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`Checking existing user by email: ${email}...`);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      console.log(`Syncing user ID for ${email} from ${existingUser.id} to ${userId} in database...`);
      // Delete any UserRoles linked to the old user ID to avoid FK errors
      await prisma.userRole.deleteMany({
        where: { userId: existingUser.id },
      });
      // Update user ID
      await prisma.$executeRawUnsafe('UPDATE "User" SET id = $1 WHERE email = $2', userId, email);
    }

    console.log(`Upserting User email: ${email} with ID: ${userId}...`);
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

    console.log(`Upserting UserRole SUPER_ADMIN for User ID: ${dbUser.id}...`);
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
    console.log('\nSUCCESS: Admin user created and granted SUPER_ADMIN access successfully.');
  } catch (dbErr) {
    console.error('Database Operation Error:', dbErr);
  } finally {
    await prisma.$disconnect();
    if (typeof pool !== 'undefined') {
      await pool.end();
    }
  }
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
