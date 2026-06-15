import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);

  console.log("\n--- METHOD 1: Search API (all folders, up to 100) ---");
  try {
    const searchResult = await cloudinary.search
      .expression("resource_type:image")
      .max_results(100)
      .execute();

    console.log(`Found ${searchResult.resources.length} images via Search API:`);
    for (const r of searchResult.resources) {
      console.log(`  - ${r.public_id} (${r.format}, ${r.width}x${r.height})`);
    }
  } catch (e: any) {
    console.error("Search API error:", e.message);
  }

  console.log("\n--- METHOD 2: Admin API with products/ prefix ---");
  try {
    const prefixResult = await cloudinary.api.resources({
      type: "upload",
      prefix: "products/",
      max_results: 100,
    });
    console.log(`Found ${prefixResult.resources.length} images via products/ prefix:`);
    for (const r of prefixResult.resources) {
      console.log(`  - ${r.public_id} (${r.format}, ${r.width}x${r.height})`);
    }
  } catch (e: any) {
    console.error("Prefix API error:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
