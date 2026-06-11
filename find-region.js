const { PrismaClient } = require('@prisma/client');

async function test(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    // Run a real query to trigger tenant routing and auth verification on the pooler
    await prisma.user.findFirst({ select: { id: true } });
    return 'SUCCESS!';
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      return 'TENANT NOT FOUND';
    } else if (err.message.includes('reach database server') || err.message.includes('timeout')) {
      return 'TIMEOUT / UNREACHABLE';
    } else if (err.message.includes('password authentication failed') || err.message.includes('Authentication failed')) {
      return 'AUTH FAILED';
    } else {
      return 'ERROR: ' + err.message.trim();
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ap-east-1', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
    'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
    'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
    'me-central-1', 'sa-east-1', 'ca-central-1'
  ];

  // Try both password forms for safety
  const passwords = [
    { name: 'With brackets', enc: '%5BAuthor%401869786%5D' },
    { name: 'Without brackets', enc: 'Author%401869786' }
  ];

  for (const r of regions) {
    for (const p of passwords) {
      const url = `postgresql://postgres.vqabvjoayjjgzrfdrkag:${p.enc}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
      process.stdout.write(`Testing region ${r} (${p.name}): `);
      const result = await test(url);
      console.log(result);
      if (result === 'SUCCESS!') {
        console.log(`\nFOUND WORKING REGION!`);
        console.log(`DATABASE_URL=${url}`);
        return;
      }
    }
  }
}

run();
