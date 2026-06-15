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
  const product = await prisma.product.findUnique({
    where: { slug: "black-sweatpants" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    console.log("Product not found.");
    return;
  }

  console.log(`Product: ${product.name}`);
  console.log("Images:");
  product.images.forEach((img) => {
    console.log(`- ID: ${img.id} | SortOrder: ${img.sortOrder} | color: ${img.color} | isPrimary: ${img.isPrimary} | publicId: "${img.publicId}" | url: "${img.url}"`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
