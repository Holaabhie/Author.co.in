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
  const images = await prisma.productImage.findMany({
    orderBy: { productId: "asc" },
  });
  console.log(`Found ${images.length} images in database:`);
  for (const img of images) {
    console.log(`ID: ${img.id} | Product ID: ${img.productId} | Color: ${img.color} | PublicId: ${img.publicId} | URL: ${img.url}`);
  }
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
