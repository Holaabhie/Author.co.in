import { prisma } from "../lib/prisma";

const CLD = "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto,dpr_auto,c_fill,w_1200";

async function main() {
  console.log("Updating database product images...");

  // 1. Find the target products
  const whiteTshirt = await prisma.product.findUnique({
    where: { slug: "white-tshirt" },
  });

  const blackSweatpants = await prisma.product.findUnique({
    where: { slug: "black-sweatpants" },
  });

  if (!whiteTshirt) {
    throw new Error("Product 'white-tshirt' not found in database.");
  }
  if (!blackSweatpants) {
    throw new Error("Product 'black-sweatpants' not found in database.");
  }

  console.log(`Found White T-shirt (ID: ${whiteTshirt.id})`);
  console.log(`Found Black Sweatpants (ID: ${blackSweatpants.id})`);

  // 2. Update White T-shirt images
  console.log("Updating White T-shirt images...");
  await prisma.productImage.deleteMany({
    where: { productId: whiteTshirt.id },
  });

  const whiteImages = [
    { publicId: "white_t_shirt_2nd_siebfk", color: "White" },
    { publicId: "white_tshirt_1_st_bbzsdu", color: "White" },
    { publicId: "5e863912-1833-49b5-9c8e-b80f52e2f1bc_1_kwwi1v", color: "White" },
    { publicId: "IMG_7677.JPG_rrtgih", color: "White" },
  ];

  await prisma.productImage.createMany({
    data: whiteImages.map((img, idx) => ({
      productId: whiteTshirt.id,
      url: `${CLD}/${img.publicId}`,
      publicId: img.publicId,
      alt: `${whiteTshirt.name} ${img.color} ${idx + 1}`,
      color: img.color,
      isPrimary: idx === 0,
      sortOrder: idx,
    })),
  });
  console.log("Successfully updated White T-shirt images.");

  // 3. Update Black Sweatpants images
  console.log("Updating Black Sweatpants images...");
  await prisma.productImage.deleteMany({
    where: { productId: blackSweatpants.id },
  });

  const blackSweatpantsImages = [
    { publicId: "sweat_black_2nd_zxtogc", color: "Black" },
    { publicId: "black_1st_tvrnqs", color: "Black" },
    { publicId: "author-black-sweatpants-back 1s", color: "Black" },
    { publicId: "author-black-sweatpants-back 2nd", color: "Black" },
    { publicId: "author-black-sweatpants-back 3rd", color: "Black" },
  ];

  await prisma.productImage.createMany({
    data: blackSweatpantsImages.map((img, idx) => ({
      productId: blackSweatpants.id,
      url: `${CLD}/${img.publicId}`,
      publicId: img.publicId,
      alt: `${blackSweatpants.name} ${img.color} ${idx + 1}`,
      color: img.color,
      isPrimary: idx === 0,
      sortOrder: idx,
    })),
  });
  console.log("Successfully updated Black Sweatpants images.");

  console.log("All DB updates completed successfully.");
}

main()
  .catch((err) => {
    console.error("Failed to update product images in database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
