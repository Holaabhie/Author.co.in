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
  
  // List all resources in the account
  const result = await cloudinary.api.resources({
    max_results: 100,
    type: "upload",
  });
  
  console.log(`\n=== CLOUDINARY ASSETS (${result.resources.length}) ===`);
  for (const r of result.resources) {
    console.log(`  public_id: ${r.public_id}`);
    console.log(`  format: ${r.format}, ${r.width}x${r.height}`);
    console.log(`  url: ${r.secure_url}`);
    console.log(`  ---`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
