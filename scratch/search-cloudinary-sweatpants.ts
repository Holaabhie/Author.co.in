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
  const queries = [
    "sweatpants",
    "author-black-sweatpants-back*",
    "back",
    "*back*",
    "*sweat*",
  ];

  for (const q of queries) {
    try {
      const res = await cloudinary.search
        .expression(q)
        .max_results(50)
        .execute();
      console.log(`Query "${q}" returned ${res.resources.length} resources:`);
      for (const r of res.resources) {
        console.log(`  - public_id: "${r.public_id}" (${r.format})`);
      }
    } catch (e: any) {
      console.error(`Error searching for query "${q}":`, e.message);
    }
  }
}

main();
