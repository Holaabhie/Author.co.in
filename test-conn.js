const { PrismaClient } = require('@prisma/client');

async function run() {
  const url = 'postgresql://postgres.vqabvjoayjjgzrfdrkag:%5BAuthor%401869786%5D@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables found in database:');
    console.log(tables);
  } catch (err) {
    console.error('Failed to query tables:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
