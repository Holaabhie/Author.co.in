const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load env variables from .env.local
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

const connectionString = process.env.DIRECT_URL;
console.log('Connecting to:', connectionString ? connectionString.replace(/:[^:@]+@/, ':****@') : 'NOT SET');

const AUTH_USER_ID = 'b6b1cf1f-d3bc-4c85-836a-926dfbac5803';
const OLD_USER_ID = '37f541f6-3bb1-4a75-8d80-91a9e9ccf5ee';
const EMAIL = 'author.handling@gmail.com';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected.');

  // Use a transaction so everything succeeds or nothing changes
  await client.query('BEGIN');

  try {
    // 1. Delete old UserRole rows (they reference old User.id)
    const delRoles = await client.query('DELETE FROM "UserRole" WHERE "userId" = $1 RETURNING *', [OLD_USER_ID]);
    console.log('Deleted old UserRole rows:', delRoles.rows);

    // 2. Update the User.id to match the Supabase Auth ID
    const updUser = await client.query('UPDATE "User" SET id = $1 WHERE id = $2 RETURNING id, email, name', [AUTH_USER_ID, OLD_USER_ID]);
    console.log('Updated User:', updUser.rows[0]);

    // 3. Re-create the SUPER_ADMIN role with the correct user ID
    const insRole = await client.query(`
      INSERT INTO "UserRole" (id, "userId", role, "grantedBy", "grantedAt")
      VALUES (gen_random_uuid(), $1, 'SUPER_ADMIN', 'SYSTEM', now())
      RETURNING *
    `, [AUTH_USER_ID]);
    console.log('Created UserRole:', insRole.rows[0]);

    await client.query('COMMIT');
    console.log('\n✅ SUCCESS: User ID updated and SUPER_ADMIN role assigned.');

    // 4. Verify
    const verifyUser = await client.query('SELECT id, email, name FROM "User" WHERE id = $1', [AUTH_USER_ID]);
    const verifyRole = await client.query('SELECT * FROM "UserRole" WHERE "userId" = $1', [AUTH_USER_ID]);
    console.log('\nVerification:');
    console.log('User:', verifyUser.rows[0]);
    console.log('Roles:', verifyRole.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
