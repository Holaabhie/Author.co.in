import "dotenv/config";
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
  const settings = await prisma.invoiceSetting.findMany();
  console.log("=== INVOICE SETTINGS ===");
  console.log(JSON.stringify(settings, null, 2));

  const invoices = await prisma.invoice.findMany({
    take: 5
  });
  console.log("\n=== RECENT INVOICES ===");
  console.log(JSON.stringify(invoices, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
