import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Admin email: ${email}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Attempting sign in...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in failed:", error.message);
  } else {
    console.log("Sign in successful!");
    console.log(`User ID returned by Supabase: ${data.user?.id}`);
    console.log(`User Email: ${data.user?.email}`);
  }
}

main().catch(console.error);
