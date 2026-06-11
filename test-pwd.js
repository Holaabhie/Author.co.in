const { PrismaClient } = require('@prisma/client');

async function test(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
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
    'ap-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'us-east-1'
  ];
  const passwords = [
    { name: 'Without brackets (Author@1869786)', enc: 'Author%401869786' },
    { name: 'With brackets ([Author@1869786])', enc: '%5BAuthor%401869786%5D' }
  ];

  for (const r of regions) {
    for (const p of passwords) {
      const url = `postgresql://postgres.vqabvjoayjjgzrfdrkag:${p.enc}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
      console.log(`Testing region ${r} with password: ${p.name}...`);
      const result = await test(url);
      console.log(`Result: ${result}`);
      if (result === 'SUCCESS!') {
        console.log(`FOUND WORKING URL: ${url}`);
        return;
      }
    }
  }
}

run();
