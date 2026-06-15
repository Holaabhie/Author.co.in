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
  const renames = [
    { from: "DSCF5576_bgms0v", to: "author-black-sweatpants-back 1s" },
    { from: "DSCF5622_e7xihx", to: "author-black-sweatpants-back 2nd" },
    { from: "DSCF5582_nycf50", to: "author-black-sweatpants-back 3rd" },
  ];

  for (const r of renames) {
    try {
      console.log(`Renaming "${r.from}" to "${r.to}"...`);
      const result = await cloudinary.uploader.rename(r.from, r.to, {
        overwrite: true,
        invalidate: true,
      });
      console.log(`Success:`, result);
    } catch (e: any) {
      console.error(`Error renaming "${r.from}":`, e);
    }
  }
}

main();
