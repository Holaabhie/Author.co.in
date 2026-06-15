import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== TARGETED DATABASE PRICING UPDATE ===');
  
  // 1. Fetch current state of products under the target categories
  const productsBefore = await prisma.product.findMany({
    where: {
      category: {
        slug: { in: ['tshirts', 'tops', 'sweatpants'] }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      discountPrice: true,
      category: { select: { slug: true } }
    }
  });

  console.log('\n[CONFIRMATION] Affected products in DB BEFORE update:');
  productsBefore.forEach(p => {
    console.log(`- Product: "${p.name}" (${p.slug})`);
    console.log(`  Current Price: ${p.price} paise, Discount Price: ${p.discountPrice} paise`);
    console.log(`  Category: "${p.category?.slug}"`);
  });

  console.log('\nUpdating prices in the database...');

  // 2. Perform updates
  // T-shirts: 94900 paise
  const tshirtsUpdate = await prisma.product.updateMany({
    where: { category: { slug: 'tshirts' } },
    data: {
      price: 94900,
      discountPrice: null,
      costPrice: null
    }
  });
  console.log(`Updated ${tshirtsUpdate.count} T-shirt products.`);

  // Tops: 84900 paise
  const topsUpdate = await prisma.product.updateMany({
    where: { category: { slug: 'tops' } },
    data: {
      price: 84900,
      discountPrice: null,
      costPrice: null
    }
  });
  console.log(`Updated ${topsUpdate.count} Top products.`);

  // Sweatpants: 139900 paise
  const sweatpantsUpdate = await prisma.product.updateMany({
    where: { category: { slug: 'sweatpants' } },
    data: {
      price: 139900,
      discountPrice: null,
      costPrice: null
    }
  });
  console.log(`Updated ${sweatpantsUpdate.count} Sweatpants products.`);

  // Clear variant price overrides
  const productIds = productsBefore.map(p => p.id);
  const variantsUpdate = await prisma.productVariant.updateMany({
    where: { productId: { in: productIds } },
    data: {
      priceOverride: null
    }
  });
  console.log(`Cleared priceOverride on ${variantsUpdate.count} variants.`);

  console.log('\nFetching state of products AFTER update:');
  const productsAfter = await prisma.product.findMany({
    where: {
      category: {
        slug: { in: ['tshirts', 'tops', 'sweatpants'] }
      }
    },
    select: {
      name: true,
      slug: true,
      price: true,
      discountPrice: true,
      category: { select: { slug: true } }
    }
  });

  productsAfter.forEach(p => {
    console.log(`- Product: "${p.name}" (${p.slug}) -> Price: ${p.price} paise, Discount Price: ${p.discountPrice} paise (Category: "${p.category?.slug}")`);
  });

  console.log('\nDatabase pricing updates completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
