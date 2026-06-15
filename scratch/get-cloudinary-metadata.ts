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
    const searchResult = await cloudinary.search
      .expression("resource_type:image")
      .max_results(100)
      .execute();

    console.log(`Checking metadata for ${searchResult.resources.length} images:`);
    for (const r of searchResult.resources) {
      // Get detailed resource info including tags & context
      const details = await cloudinary.api.resource(r.public_id, {
        colors: true,
        context: true,
        image_metadata: true,
        tags: true,
      });

      console.log(`Public ID: "${r.public_id}"`);
      if (details.tags && details.tags.length > 0) {
        console.log(`  Tags: ${JSON.stringify(details.tags)}`);
      }
      if (details.context) {
        console.log(`  Context: ${JSON.stringify(details.context)}`);
      }
      // Check if any metadata or tags contain 'author-black-sweatpants-back'
      const checkString = JSON.stringify(details).toLowerCase();
      if (checkString.includes("author-black-sweatpants-back") || checkString.includes("back")) {
        console.log(`  >>> Matches keyword!`);
      }
      console.log("---");
    }
  } catch (e: any) {
    console.error("Error:", e);
  }
}

main();
