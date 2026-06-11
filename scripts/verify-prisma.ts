import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db");
  try {
    const brands = await prisma.brand.findMany({ take: 1 });
    console.log("✅ Connected");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

main();
