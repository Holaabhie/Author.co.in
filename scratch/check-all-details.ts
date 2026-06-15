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
  const categories = await prisma.category.findMany();
  console.log("=== CATEGORIES IN DB ===");
  for (const c of categories) {
    console.log(`ID: ${c.id} | Slug: ${c.slug} | Name: ${c.name}`);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      variants: true,
      images: true,
    }
  });

  console.log("\n=== ACTIVE PRODUCTS IN DB ===");
  for (const p of products) {
    console.log(`\nProduct: ${p.name} (${p.slug})`);
    console.log(`Category: ${p.category?.name} (${p.category?.slug})`);
    console.log(`Price: ${p.price} paise`);
    console.log(`Variants (${p.variants.length}):`, p.variants.map(v => `${v.size}/${v.color} (${v.stock} left)`).join(", "));
    console.log(`Images (${p.images.length}):`, p.images.map(i => `${i.url} (color: ${i.color}, primary: ${i.isPrimary})`).join(", "));
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
