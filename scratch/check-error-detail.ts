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
    const res = await cloudinary.api.resource("author-black-sweatpants-back 1s");
    console.log("Success:", res);
  } catch (e: any) {
    console.error("Full Error Object:");
    console.error(e);
  }
}

main();
