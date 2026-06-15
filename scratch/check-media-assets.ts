import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== MEDIA ASSETS ===");
  const assets = await prisma.mediaAsset.findMany();
  console.log(`Found ${assets.length} assets in MediaAsset:`);
  assets.forEach((a) => {
    console.log(`- filename: "${a.filename}" | original: "${a.originalFilename}" | url: "${a.url}"`);
  });

  console.log("\n=== MEDIA LIBRARY ===");
  const library = await prisma.mediaLibrary.findMany();
  console.log(`Found ${library.length} items in MediaLibrary:`);
  library.forEach((l) => {
    console.log(`- fileName: "${l.fileName}" | fileUrl: "${l.fileUrl}" | fileType: "${l.fileType}"`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
