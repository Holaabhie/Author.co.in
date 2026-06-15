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
  console.log("=== CHECKING RECENT ORDERS ===");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      items: true,
      address: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        }
      }
    }
  });

  if (orders.length === 0) {
    console.log("No orders found in database.");
  } else {
    for (const order of orders) {
      console.log(`\nOrder: ${order.orderNumber} | ID: ${order.id}`);
      console.log(`Customer: ${order.user?.name} | Email: ${order.user?.email}`);
      console.log(`Phone (Order Address): ${order.address?.phone || "N/A"} | Phone (User): ${order.user?.phone || "N/A"}`);
      console.log(`Status: ${order.status} | Total: ₹${order.total / 100} | Created: ${order.createdAt}`);
      console.log("Items:");
      for (const item of order.items) {
        console.log(`  - ${item.productName} (Qty: ${item.quantity}, Price: ₹${item.unitPrice / 100}, Size: ${item.size || "N/A"}, Color: ${item.color || "N/A"})`);
        console.log(`    ImageUrl: ${item.imageUrl || "NULL"}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
