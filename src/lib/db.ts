import { PrismaClient, Prisma } from "@prisma/client";

export { Prisma };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  if (typeof window !== "undefined") {
    // Client-side fallback to avoid build crashes
    return new PrismaClient();
  }

  // Server-side: Use Pg driver adapter required by Prisma 7
  const { PrismaPg } = require("@prisma/adapter-pg");
  const pg = require("pg");

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

