import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== USERS WITH ROLES ===");
  const users = await prisma.user.findMany({
    include: {
      userRoles: true,
    },
  });

  for (const u of users) {
    console.log(`User: ${u.name} | Email: ${u.email} | ID: ${u.id}`);
    console.log(`Roles:`, u.userRoles.map(r => r.role).join(", ") || "None");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
