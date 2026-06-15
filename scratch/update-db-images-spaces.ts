import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CLD_BASE = "https://res.cloudinary.com/dpxirx0mn/image/upload/w_1400,c_scale,q_auto:best,f_auto";

// Correct target mappings by sortOrder for Black Sweatpants
const TARGETS: Record<number, { publicId: string; url: string }> = {
  0: {
    publicId: "sweat_black_2nd_zxtogc",
    url: `${CLD_BASE}/sweat_black_2nd_zxtogc`,
  },
  1: {
    publicId: "black_1st_tvrnqs",
    url: `${CLD_BASE}/black_1st_tvrnqs`,
  },
  2: {
    publicId: "author-black-sweatpants-back 1s",
    url: `${CLD_BASE}/author-black-sweatpants-back%201s`,
  },
  3: {
    publicId: "author-black-sweatpants-back 2nd",
    url: `${CLD_BASE}/author-black-sweatpants-back%202nd`,
  },
  4: {
    publicId: "author-black-sweatpants-back 3rd",
    url: `${CLD_BASE}/author-black-sweatpants-back%203rd`,
  },
};

async function main() {
  console.log("=== DB IMAGE SYNC SCRIPT ===");

  // 1. Fetch the product
  const product = await prisma.product.findUnique({
    where: { slug: "black-sweatpants" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    console.error("Product 'black-sweatpants' not found.");
    process.exit(1);
  }

  console.log(`Product: ${product.name} (ID: ${product.id})`);

  // 2. Perform updates
  for (const img of product.images) {
    const target = TARGETS[img.sortOrder];
    if (target && img.color === "Black") {
      console.log(`\nImage SortOrder ${img.sortOrder} (ID: ${img.id})`);
      console.log(`  BEFORE -> publicId: "${img.publicId}", url: "${img.url}"`);

      // Idempotency check: only update if changed
      if (img.publicId !== target.publicId || img.url !== target.url) {
        const updated = await prisma.productImage.update({
          where: { id: img.id },
          data: {
            publicId: target.publicId,
            url: target.url,
          },
        });
        console.log(`  AFTER  -> publicId: "${updated.publicId}", url: "${updated.url}" (UPDATED)`);
      } else {
        console.log(`  AFTER  -> publicId: "${img.publicId}", url: "${img.url}" (NO CHANGE - IDEMPOTENT)`);
      }
    }
  }

  console.log("\n=== SYNC COMPLETED SUCCESSFULLY ===");
}

main()
  .catch((err) => {
    console.error("Failed to sync images:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
