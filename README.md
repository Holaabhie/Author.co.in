# Author Clothing

An elegant, high-performance streetwear e-commerce platform built with Next.js, Tailwind CSS, Supabase, and Prisma.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Environment Setup
Create a `.env.local` file in the root directory and configure the environment variables as shown in `.env.local` template:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase project connection keys.
- `DATABASE_URL` & `DIRECT_URL`: Postgres pooler and direct database URLs.
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Administrative credentials.

### 3. Administrative User Setup & Synchronization
If the admin account is not configured or shows unauthorized errors due to ID mismatches between Supabase Auth and the database, run the following command to automatically register/sync the administrator and grant `SUPER_ADMIN` role:

```bash
node scripts/createAdmin.js
```

This script will:
- Sign up/in the administrator using the configured `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`.
- Check the PostgreSQL database for the corresponding user.
- If there's an ID mismatch, it will automatically synchronize the DB user's ID to match Supabase Auth.
- Assign the `SUPER_ADMIN` role to the user in the database.

### 4. Running the Development Server
Start the development server on port 3001:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to view the application.

## Admin Panel
Access the admin control panel at:
[http://localhost:3001/admin](http://localhost:3001/admin)

Authenticate with the admin email and password.
