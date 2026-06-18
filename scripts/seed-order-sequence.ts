/**
 * Seed the OrderSequence table with the current highest AUTH order number.
 * This ensures numbering continues correctly after migration.
 *
 * Usage: npx tsx scripts/seed-order-sequence.ts
 */
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
  // Find the highest existing AUTH-XXXXXX order number
  const orders = await prisma.order.findMany({
    select: { orderNumber: true },
    orderBy: { createdAt: "desc" },
  });

  let maxSeq = 0;
  for (const order of orders) {
    const match = order.orderNumber?.match(/AUTH-(\d+)/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  console.log(`Highest existing order sequence: ${maxSeq}`);

  // Upsert the sequence row
  await prisma.orderSequence.upsert({
    where: { name: "AUTHOR_ORDER" },
    update: { value: maxSeq },
    create: { name: "AUTHOR_ORDER", value: maxSeq },
  });

  console.log(
    `OrderSequence "AUTHOR_ORDER" seeded with value: ${maxSeq}`
  );
  console.log(
    `Next order will be: AUTH-${String(maxSeq + 1).padStart(6, "0")}`
  );
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
