import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

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

    const allDetails = [];
    console.log(`Fetching details for ${searchResult.resources.length} images...`);
    for (const r of searchResult.resources) {
      const details = await cloudinary.api.resource(r.public_id, {
        colors: true,
        context: true,
        image_metadata: true,
        tags: true,
      });
      allDetails.push(details);
    }

    const outputPath = path.join(process.cwd(), "scratch", "all-resources.json");
    fs.writeFileSync(outputPath, JSON.stringify(allDetails, null, 2));
    console.log(`Successfully wrote details to ${outputPath}`);
  } catch (e: any) {
    console.error("Error:", e);
  }
}

main();
