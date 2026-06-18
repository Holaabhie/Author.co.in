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
  const sequences = await prisma.orderSequence.findMany();
  console.log("=== ORDER SEQUENCES ===");
  console.log(JSON.stringify(sequences, null, 2));

  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log("\n=== RECENT ORDERS ===");
  console.log(JSON.stringify(orders, null, 2));
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
