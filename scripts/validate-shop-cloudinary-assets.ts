import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { v2 as cloudinary } from "cloudinary";
import { SHOP_IMAGE_PUBLIC_IDS } from "../src/lib/shop/catalog";

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const EXPECTED_ASSET_COUNT = 19;

async function main() {
  if (SHOP_IMAGE_PUBLIC_IDS.length !== EXPECTED_ASSET_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_ASSET_COUNT} shop asset public_ids, found ${SHOP_IMAGE_PUBLIC_IDS.length}`
    );
  }

  const uniquePublicIds = new Set(SHOP_IMAGE_PUBLIC_IDS);
  if (uniquePublicIds.size !== SHOP_IMAGE_PUBLIC_IDS.length) {
    throw new Error("Shop asset public_id list contains duplicates");
  }

  for (const publicId of SHOP_IMAGE_PUBLIC_IDS) {
    await cloudinary.api.resource(publicId);
    console.log(`Found ${publicId}`);
  }

  console.log(`Validated ${SHOP_IMAGE_PUBLIC_IDS.length} exact shop Cloudinary public_ids.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
