import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Dry-run relation checks ===");
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log(`Current users in public schema: ${users.length}`);

  const roles = await prisma.userRole.findMany();
  console.log(`Current UserRole count: ${roles.length}`);
  
  const migrationPath = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    "20260614000000_auth_triggers_and_rls",
    "migration.sql"
  );
  
  const sql = fs.readFileSync(migrationPath, "utf-8");
  
  console.log("\nExecuting migration SQL on database...");
  
  // Split statements by semicolon if needed, or run as a single raw query
  // Since pg/postgres supports executing multiple commands in a single query string,
  // we can run executeRawUnsafe on the full SQL script directly.
  await prisma.$executeRawUnsafe(sql);
  
  console.log("✅ Migration applied successfully!");
}

main()
  .catch((e) => {
    console.error("Migration execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
