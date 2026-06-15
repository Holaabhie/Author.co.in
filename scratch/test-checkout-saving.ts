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
  console.log("=== SIMULATING CHECKOUT ORDER CREATION ===");

  // 1. Find user
  const user = await prisma.user.findFirst({
    where: { email: "indmanager01@gmail.com" },
  });
  if (!user) {
    console.error("User not found!");
    return;
  }
  console.log(`Found user: ${user.name} (ID: ${user.id})`);

  // 2. Find address
  const address = await prisma.address.findFirst({
    where: { userId: user.id },
  });
  if (!address) {
    console.error("No address found for user!");
    return;
  }
  console.log(`Using address ID: ${address.id}`);

  // 3. Find product: AUTHOR Black T-Shirt
  const product = await prisma.product.findFirst({
    where: { slug: "black-tshirt" },
    include: {
      images: {
        select: { url: true, color: true, isPrimary: true },
        orderBy: { sortOrder: "asc" },
      },
      variants: true,
    },
  });
  if (!product) {
    console.error("Product black-tshirt not found!");
    return;
  }
  const variant = product.variants.find(v => v.size === "M" && v.color === "Black");
  if (!variant) {
    console.error("Variant M/Black not found!");
    return;
  }
  console.log(`Using variant: M/Black (ID: ${variant.id})`);

  // 4. Resolve Image (Checkout route helper function logic)
  const resolveItemImage = (item: any): string | null => {
    const images = item.product?.images;
    if (!images || images.length === 0) return null;

    const variantColor = item.variant?.color ?? null;

    if (variantColor) {
      const colorMatch = images.find(
        (img: any) => img.color && img.color.toLowerCase() === variantColor.toLowerCase()
      );
      if (colorMatch) return colorMatch.url;
    }

    const primary = images.find((img: any) => img.isPrimary);
    if (primary) return primary.url;

    return images[0]?.url ?? null;
  };

  const cartItemMock = {
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
    product,
    variant: {
      id: variant.id,
      size: variant.size,
      color: variant.color,
    },
  };

  const resolvedImage = resolveItemImage(cartItemMock);
  console.log(`Resolved image URL for cart item: ${resolvedImage}`);

  // 5. Create Order
  const orderCount = await prisma.order.count();
  const orderNumber = `AUTH-TEST-${String(orderCount + 1).padStart(4, "0")}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: product.price,
      shippingFee: 0,
      tax: 0,
      total: product.price,
      addressId: address.id,
      razorpayOrderId: `order_test_${Math.random().toString(36).substring(2, 10)}`,
      items: {
        create: [
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            size: variant.size,
            color: variant.color,
            quantity: 1,
            unitPrice: product.price,
            totalPrice: product.price,
            imageUrl: resolvedImage,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  console.log("\n=== ORDER CREATED SUCCESSFULLY ===");
  console.log(`Order Number: ${order.orderNumber}`);
  console.log(`Payment Status: ${order.paymentStatus}`);
  console.log(`Items in Order:`);
  for (const item of order.items) {
    console.log(`  - ${item.productName} (Color: ${item.color}, Size: ${item.size})`);
    console.log(`    ImageUrl Snapshot: ${item.imageUrl}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
