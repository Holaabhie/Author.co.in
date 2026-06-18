import { prisma } from "../src/lib/db";
import { products } from "../src/data/products";

async function main() {
  console.log("Seeding database...");

  // 1. Seed brands (including AUTHOR)
  const brandNike = await prisma.brand.upsert({
    where: { slug: "nike" },
    update: {},
    create: {
      name: "Nike",
      slug: "nike",
    },
  });

  const brandAdidas = await prisma.brand.upsert({
    where: { slug: "adidas" },
    update: {},
    create: {
      name: "Adidas",
      slug: "adidas",
    },
  });

  const brandAuthor = await prisma.brand.upsert({
    where: { slug: "author" },
    update: {
      name: "AUTHOR",
    },
    create: {
      name: "AUTHOR",
      slug: "author",
    },
  });

  // 2. Seed categories (t-shirts, sweatpants, tops, mens-apparel)
  const catMens = await prisma.category.upsert({
    where: { slug: "mens-apparel" },
    update: {},
    create: {
      name: "Men's Apparel",
      slug: "mens-apparel",
    },
  });

  // Check if there is an old category with slug "t-shirts". If so, rename its slug to "tshirts".
  const oldTshirtsCategory = await prisma.category.findUnique({ where: { slug: "t-shirts" } });
  if (oldTshirtsCategory) {
    await prisma.category.update({
      where: { id: oldTshirtsCategory.id },
      data: { slug: "tshirts" },
    });
  }

  const catTshirts = await prisma.category.upsert({
    where: { slug: "tshirts" },
    update: {
      name: "T-Shirts",
    },
    create: {
      name: "T-Shirts",
      slug: "tshirts",
    },
  });

  const catSweatpants = await prisma.category.upsert({
    where: { slug: "sweatpants" },
    update: {
      name: "Sweatpants",
    },
    create: {
      name: "Sweatpants",
      slug: "sweatpants",
    },
  });

  const catTops = await prisma.category.upsert({
    where: { slug: "tops" },
    update: {
      name: "Tops",
    },
    create: {
      name: "Tops",
      slug: "tops",
    },
  });

  // Map category slug to DB Category ID
  const categoryMap: Record<string, string> = {
    "tshirts": catTshirts.id,
    "sweatpants": catSweatpants.id,
    "tops": catTops.id,
  };

  // 3. Deactivate products not active in the seed file
  const activeSlugs = products.filter((p) => p.isActive).map((p) => p.slug);
  const deactivateResult = await prisma.product.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivateResult.count} old/inactive products.`);

  // 4. Seed active products and their variants & images
  const activeProducts = products.filter((p) => p.isActive);

  for (const p of activeProducts) {
    const categoryId = categoryMap[p.category] || null;
    const brandId = brandAuthor.id;

    // Upsert the product
    const seededProduct = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        shortDescription: p.subtitle || null,
        price: p.price * 100, // rupees to paise
        stock: p.stock,
        isActive: p.isActive,
        isFeatured: p.badge === "best-seller",
        badge: p.badge || null,
        details: p.details,
        careInstructions: p.careInstructions,
        categoryId,
        brandId,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.subtitle || null,
        price: p.price * 100, // rupees to paise
        stock: p.stock,
        isActive: p.isActive,
        isFeatured: p.badge === "best-seller",
        badge: p.badge || null,
        details: p.details,
        careInstructions: p.careInstructions,
        categoryId,
        brandId,
      },
    });

    console.log(`Seeded product: ${seededProduct.name} (ID: ${seededProduct.id})`);

    // Clean & Re-create product images — now with color mapping
    await prisma.productImage.deleteMany({
      where: { productId: seededProduct.id },
    });

    await prisma.productImage.createMany({
      data: p.images.map((img, idx) => ({
        productId: seededProduct.id,
        url: img.url,
        alt: p.name,
        color: img.color || null,
        isPrimary: idx === 0,
        sortOrder: idx,
      })),
    });

    // Create / Update product variants
    for (const size of p.sizes) {
      for (const color of p.colors) {
        await prisma.productVariant.upsert({
          where: {
            productId_size_color: {
              productId: seededProduct.id,
              size,
              color: color.name,
            },
          },
          update: {
            colorHex: color.hex,
            stock: 10, // stock: 10 matching target instructions
            sku: `AUTH-${p.slug.toUpperCase()}-${size}-${color.name.toUpperCase()}`,
          },
          create: {
            productId: seededProduct.id,
            size,
            color: color.name,
            colorHex: color.hex,
            stock: 10,
            sku: `AUTH-${p.slug.toUpperCase()}-${size}-${color.name.toUpperCase()}`,
          },
        });
      }
    }
    console.log(`Seeded variants for ${seededProduct.name}`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Process exits
  });
