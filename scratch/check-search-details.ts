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
  try {
    const res = await cloudinary.search
      .expression("author-black-sweatpants-back*")
      .max_results(50)
      .execute();
    console.log(`Resources:`, JSON.stringify(res.resources, null, 2));
  } catch (e: any) {
    console.error("Error:", e);
  }
}

main();
