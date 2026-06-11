require('dotenv').config({ path: '.env.local' });
process.env.NODE_ENV = "development";

const { prisma } = require("../src/lib/db");

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  console.log(users);

  console.log("\n=== PRODUCTS & VARIANTS ===");
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
          reservedStock: true
        }
      }
    }
  });
  products.forEach(p => {
    console.log(`Product: ${p.name} (ID: ${p.id}, Slug: ${p.slug})`);
    p.variants.forEach(v => {
      console.log(`  - Variant ID: ${v.id} | Size: ${v.size} | Color: ${v.color} | Stock: ${v.stock} | Reserved: ${v.reservedStock}`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
