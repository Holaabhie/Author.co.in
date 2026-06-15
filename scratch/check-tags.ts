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
    const tags = await cloudinary.api.tags({ max_results: 100 });
    console.log("Tags:", tags);

    const transformations = await cloudinary.api.transformations({ max_results: 100 });
    console.log("Transformations:", transformations);
  } catch (e: any) {
    console.error("Error:", e);
  }
}

main();
