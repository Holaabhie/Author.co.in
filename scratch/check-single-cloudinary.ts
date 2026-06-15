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
  const ids = [
    "author-black-sweatpants-back 1s",
    "author-black-sweatpants-back 2nd",
    "author-black-sweatpants-back 3rd",
  ];

  for (const id of ids) {
    try {
      const result = await cloudinary.api.resource(id);
      console.log(`✅ Found: "${id}"`);
      console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
      console.log(`❌ Error retrieving "${id}": ${e.message}`);
    }
  }
}

main();
