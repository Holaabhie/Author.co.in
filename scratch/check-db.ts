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
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  console.log("=== PRODUCTS ===");
  console.log(JSON.stringify(products, null, 2));

  const images = await prisma.productImage.findMany({
    include: { product: { select: { name: true } } },
    orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
  });
  console.log("\n=== PRODUCT IMAGES ===");
  console.log(JSON.stringify(images, null, 2));
  console.log("Total images:", images.length);

  const variants = await prisma.productVariant.findMany({
    select: { color: true },
    distinct: ["color"],
  });
  console.log("\n=== DISTINCT VARIANT COLORS ===");
  console.log(variants.map((v: any) => v.color));
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
