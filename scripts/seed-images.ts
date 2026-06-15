/**
 * Seed script: Connect Cloudinary images to database products.
 *
 * Execution order (critical):
 *   1. npx prisma migrate dev --name add_image_publicid_color
 *   2. npx prisma generate
 *   3. npx tsx scripts/seed-images.ts
 *
 * This script:
 *   - Verifies each public_id exists in Cloudinary (requires API_KEY + API_SECRET)
 *   - Deletes existing ProductImage rows for the target products (idempotent)
 *   - Inserts new rows with url, publicId, color, sortOrder, alt populated
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";

// ── Configure Cloudinary ────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Configure Prisma ────────────────────────────────────────────────
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── EXPLICIT ASSET MAPPING ──────────────────────────────────────────
// Each entry specifies the exact sortOrder — NOT inferred from filename.
// color values MUST match product_variants.color exactly (case-sensitive).
//
// Confirmed variant colors in DB: "Black", "White", "Grey"

const IMAGE_MAPPINGS: Array<{
  productSlug: string;
  publicId: string;
  color: string;
  sortOrder: number;
  alt: string;
}> = [
  // ── AUTHOR ESSENTIAL TEE — Black (2 images) ──
  {
    productSlug: "author-essential-tee",
    publicId: "tshirt_2nd_ldhr3h",
    color: "Black",
    sortOrder: 0,
    alt: "Author Essential Tee Black Front",
  },
  {
    productSlug: "author-essential-tee",
    publicId: "black_t_shirt_1st_aradpv",
    color: "Black",
    sortOrder: 1,
    alt: "Author Essential Tee Black Back",
  },

  // ── AUTHOR ESSENTIAL TEE — White (2 images) ──
  {
    productSlug: "author-essential-tee",
    publicId: "white_t_shirt_2nd_siebfk",
    color: "White",
    sortOrder: 0,
    alt: "Author Essential Tee White Front",
  },
  {
    productSlug: "author-essential-tee",
    publicId: "white_tshirt_1_st_bbzsdu",
    color: "White",
    sortOrder: 1,
    alt: "Author Essential Tee White Back",
  },

  // ── AUTHOR ESSENTIAL TOP — Black (2 images) ──
  {
    productSlug: "author-essential-top",
    publicId: "top_black_2nd_gegyy3",
    color: "Black",
    sortOrder: 0,
    alt: "Author Essential Top Black Front",
  },
  {
    productSlug: "author-essential-top",
    publicId: "top_black_1st_wgsy3e",
    color: "Black",
    sortOrder: 1,
    alt: "Author Essential Top Black Back",
  },

  // ── AUTHOR ESSENTIAL TOP — White (2 images) ──
  {
    productSlug: "author-essential-top",
    publicId: "top_1st_l0udlk",
    color: "White",
    sortOrder: 0,
    alt: "Author Essential Top White Front",
  },
  {
    productSlug: "author-essential-top",
    publicId: "top_2nd_kxfr24",
    color: "White",
    sortOrder: 1,
    alt: "Author Essential Top White Back",
  },

  // ── AUTHOR ESSENTIAL SWEATPANTS — Black (5 images) ──
  {
    productSlug: "author-essential-sweatpants",
    publicId: "sweat_black_2nd_zxtogc",
    color: "Black",
    sortOrder: 0,
    alt: "Author Sweatpants Black Front",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "black_1st_tvrnqs",
    color: "Black",
    sortOrder: 1,
    alt: "Author Sweatpants Black Back",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "DSCF5576_bgms0v",
    color: "Black",
    sortOrder: 2,
    alt: "Author Sweatpants Black Side",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "DSCF5622_e7xihx",
    color: "Black",
    sortOrder: 3,
    alt: "Author Sweatpants Black Detail",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "DSCF5582_nycf50",
    color: "Black",
    sortOrder: 4,
    alt: "Author Sweatpants Black Full",
  },

  // ── AUTHOR ESSENTIAL SWEATPANTS — Grey (5 images) ──
  {
    productSlug: "author-essential-sweatpants",
    publicId: "gray_sweat_2nd_a1mdog",
    color: "Grey",
    sortOrder: 0,
    alt: "Author Sweatpants Grey Front",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "gray_sweat_1st_cgspx0",
    color: "Grey",
    sortOrder: 1,
    alt: "Author Sweatpants Grey Back",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "DSCF5541_plog3s",
    color: "Grey",
    sortOrder: 2,
    alt: "Author Sweatpants Grey Side",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "DSCF5529_etgtdf",
    color: "Grey",
    sortOrder: 3,
    alt: "Author Sweatpants Grey Detail",
  },
  {
    productSlug: "author-essential-sweatpants",
    publicId: "DSCF5515_ocdsro",
    color: "Grey",
    sortOrder: 4,
    alt: "Author Sweatpants Grey Full",
  },
];

async function main() {
  // ── 1. Verify Cloudinary credentials ──────────────────────────────
  console.log("── Verifying Cloudinary credentials ──");
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.error(
      "❌ Missing Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
    );
    console.error("   These must be set in .env.local for asset verification.");
    process.exit(1);
  }
  console.log(`✅ Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  // ── 2. Verify each publicId exists in Cloudinary ──────────────────
  console.log("\n── Verifying Cloudinary assets exist ──");
  for (const mapping of IMAGE_MAPPINGS) {
    try {
      const result = await cloudinary.api.resource(mapping.publicId);
      console.log(
        `✅ Found: ${mapping.publicId} (${result.width}x${result.height})`
      );
    } catch (e: any) {
      console.warn(`⚠️  NOT FOUND in Cloudinary: ${mapping.publicId}`);
      console.warn(
        "   Warning: Check if the public_id exists in Cloudinary dashboard. Proceeding to seed anyway..."
      );
    }
  }

  // ── 3. Fetch products from DB ─────────────────────────────────────
  console.log("\n── Fetching products from DB ──");
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
  });
  console.log(
    "Products found:\n" +
      products.map((p) => `  ${p.slug} → ${p.id}`).join("\n")
  );

  // Build slug → id map
  const slugToId = Object.fromEntries(products.map((p) => [p.slug, p.id]));

  // Validate all slugs in IMAGE_MAPPINGS exist in DB
  const uniqueSlugs = IMAGE_MAPPINGS.map((m) => m.productSlug).filter(
    (value, index, self) => self.indexOf(value) === index
  );
  for (const slug of uniqueSlugs) {
    if (!slugToId[slug]) {
      console.error(`❌ Product with slug "${slug}" not found in DB`);
      console.error(
        "   Available slugs: " + Object.keys(slugToId).join(", ")
      );
      process.exit(1);
    }
  }

  // ── 4. Delete existing ProductImage rows (idempotent re-run) ──────
  const productIds = uniqueSlugs.map((s) => slugToId[s]);
  const deleteResult = await prisma.productImage.deleteMany({
    where: { productId: { in: productIds } },
  });
  console.log(
    `\n── Deleted ${deleteResult.count} existing ProductImage rows ──`
  );

  // ── 5. Insert new ProductImage records ────────────────────────────
  console.log("\n── Inserting ProductImage records ──");
  for (const mapping of IMAGE_MAPPINGS) {
    const productId = slugToId[mapping.productSlug];

    // Build the full Cloudinary URL with auto quality/format
    const url = cloudinary.url(mapping.publicId, {
      quality: "auto",
      fetch_format: "auto",
      secure: true,
    });

    const record = await prisma.productImage.create({
      data: {
        productId,
        url, // full Cloudinary URL — matches schema field name
        publicId: mapping.publicId,
        color: mapping.color,
        sortOrder: mapping.sortOrder,
        alt: mapping.alt,
        isPrimary: mapping.sortOrder === 0, // first image for each color is primary
      },
    });

    console.log(
      `✅ Created: ${mapping.publicId} | color: ${mapping.color} | sort: ${mapping.sortOrder} → ${record.id}`
    );
  }

  // ── 6. Verify final state ─────────────────────────────────────────
  console.log("\n── Seed complete. Verification ──");
  const allImages = await prisma.productImage.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: [{ productId: "asc" }, { color: "asc" }, { sortOrder: "asc" }],
  });

  console.log(`Total ProductImage rows: ${allImages.length}`);
  for (const img of allImages) {
    console.log(
      `  ${img.product.slug} | ${img.color ?? "—"} | sort:${img.sortOrder} | ${img.publicId ?? "—"}`
    );
    if (!img.url.startsWith("https://res.cloudinary.com")) {
      console.error(`  ⚠️  URL does not look like Cloudinary: ${img.url}`);
    }
  }

  console.log("\n✅ All done.");
}

main()
  .catch((e) => {
    console.error("Seed script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
