import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Database Details Confirmation ---');
  const categories = await prisma.category.findMany();
  console.log('Categories in DB:');
  categories.forEach(c => {
    console.log(`- Name: "${c.name}", Slug: "${c.slug}", ID: "${c.id}"`);
  });

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      category: {
        select: {
          slug: true
        }
      }
    }
  });

  console.log('\nProducts in DB:');
  products.forEach(p => {
    console.log(`- Name: "${p.name}", Slug: "${p.slug}", Price: ${p.price}, Category Slug: "${p.category?.slug}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
