import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emailInput = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!supabaseUrl) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is not set.");
    process.exit(1);
  }
  if (!supabaseServiceRoleKey) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY is not set in environment or .env.local.");
    process.exit(1);
  }
  if (!emailInput || !password) {
    console.error("Error: ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment or .env.local.");
    process.exit(1);
  }

  const normalizedEmail = emailInput.trim().toLowerCase();
  console.log(`Target Admin Email: ${normalizedEmail}`);

  // 1. Initialize Supabase Client
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let authUserId: string | null = null;

  // 2. Find or create Supabase Auth User (try Admin API first, fallback to standard flow)
  console.log("Attempting to find user using Supabase Admin API...");
  try {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError || !listData?.users) {
      throw new Error(listError?.message || "Empty user list");
    }
    const existingAuthUser = listData.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
      console.log(`Found existing Supabase Auth user via Admin API. ID: ${authUserId}`);
    } else {
      console.log("Creating new user via Supabase Admin API...");
      const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
      });
      if (createError || !user) {
        throw new Error(createError?.message || "Failed to create user");
      }
      authUserId = user.id;
      console.log(`Created new Supabase Auth user via Admin API. ID: ${authUserId}`);
    }
  } catch (adminErr: any) {
    console.log(`Admin API not available or failed (${adminErr.message}). Falling back to standard auth flow...`);
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (signInError) {
      console.log(`Sign in failed: ${signInError.message}. Attempting standard sign up...`);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
      });

      if (signUpError || !signUpData.user) {
        console.error("Failed to register user via standard flow:", signUpError?.message || "Empty user");
        process.exit(1);
      }
      authUserId = signUpData.user.id;
      console.log(`Registered user via standard flow. ID: ${authUserId}`);
    } else {
      if (!signInData.user) {
        console.error("Sign in returned empty user.");
        process.exit(1);
      }
      authUserId = signInData.user.id;
      console.log(`Authenticated user via standard flow. ID: ${authUserId}`);
    }
  }

  if (!authUserId) {
    console.error("Failed to retrieve or create user ID.");
    process.exit(1);
  }

  // 3. Connect to Postgres database
  console.log("Connecting to Postgres database via Prisma...");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 4. Database User lookup by email
    const existingDbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingDbUser && existingDbUser.id !== authUserId) {
      console.log(`\nMismatch detected!`);
      console.log(`DB User ID: ${existingDbUser.id}`);
      console.log(`Auth User ID: ${authUserId}`);

      // 4.a Strip admin roles from old mismatched user
      const deletedRoles = await prisma.userRole.deleteMany({
        where: {
          userId: existingDbUser.id,
          role: { in: ["SUPER_ADMIN", "ADMIN"] },
        },
      });
      console.log(`Revoked ${deletedRoles.count} admin roles from old mismatched user ID: ${existingDbUser.id}`);

      // 4.b Archive old mismatched user's email to avoid unique constraint conflict
      const archivedEmail = `archived-admin-${existingDbUser.id}@author.co.in`;
      await prisma.user.update({
        where: { id: existingDbUser.id },
        data: { email: archivedEmail },
      });
      console.log(`Archived old mismatched user email to: ${archivedEmail}`);
    }

    // 5. Upsert DB User with the correct Supabase Auth ID
    console.log(`Upserting DB User with ID ${authUserId}...`);
    const dbUser = await prisma.user.upsert({
      where: { id: authUserId },
      update: {
        email: normalizedEmail,
        name: "Admin",
      },
      create: {
        id: authUserId,
        email: normalizedEmail,
        name: "Admin",
      },
    });

    // 6. Assign SUPER_ADMIN role to the DB user linked to the correct auth user ID
    console.log("Upserting SUPER_ADMIN role for the DB user...");
    const dbRole = await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId: authUserId,
          role: "SUPER_ADMIN",
        },
      },
      update: {},
      create: {
        userId: authUserId,
        role: "SUPER_ADMIN",
        grantedBy: "SYSTEM",
      },
    });

    // 7. Verify and Print Output
    const finalUser = await prisma.user.findUnique({
      where: { id: authUserId },
      include: { userRoles: true },
    });

    console.log("\n=== FINAL VERIFICATION ===");
    console.log(`Admin Email:    ${finalUser?.email}`);
    console.log(`Auth User ID:   ${authUserId}`);
    console.log(`DB User ID:     ${finalUser?.id}`);
    console.log(`Assigned Roles: ${finalUser?.userRoles.map((r) => r.role).join(", ")}`);
    console.log("==========================\n");

  } catch (error) {
    console.error("Database operation error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
