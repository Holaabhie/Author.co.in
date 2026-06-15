import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking products in database...");
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
      }
    });
    console.log(`Found ${products.length} products:`);
    for (const p of products) {
      console.log(`- ID: ${p.id}, Slug: ${p.slug}, Name: ${p.name}, IsActive: ${p.isActive}`);
      console.log(`  Images:`);
      for (const img of p.images) {
        console.log(`    * [${img.color}] ${img.url} (Order: ${img.sortOrder}, Primary: ${img.isPrimary})`);
      }
    }
  } catch (err) {
    console.error("Error checking products:", err);
  }
}

main();
