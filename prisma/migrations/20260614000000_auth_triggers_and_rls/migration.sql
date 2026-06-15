-- ═══════════════════════════════════════════════════════════
-- AUTHOR.CO.IN — AUTH TRIGGERS, RLS POLICIES, AND JWT HOOKS
-- ═══════════════════════════════════════════════════════════

-- 1. Helper: Check if user is Admin / Staff
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check JWT claim roles (stored in raw_app_meta_data -> roles)
  IF (auth.jwt() -> 'app_metadata' -> 'roles') ?| ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'MARKETING', 'SUPPORT', 'VIEWER'] THEN
    RETURN true;
  END IF;

  -- Fallback to database lookup
  RETURN EXISTS (
    SELECT 1 FROM public."UserRole"
    WHERE "userId" = auth.uid()::text
      AND role::text IN ('SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'MARKETING', 'SUPPORT', 'VIEWER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger Function: Create public profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If user already exists by email (legacy or otherwise), do not insert a duplicate
  IF EXISTS (SELECT 1 FROM public."User" WHERE email = new.email) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public."User" (id, email, name, image, phone, "updatedAt", "createdAt")
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url',
    new.phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger definition for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 3. Trigger Function: Sync role changes from public.UserRole to auth.users.raw_app_meta_data (JWT Claims)
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_app_metadata()
RETURNS TRIGGER AS $$
DECLARE
  user_roles text[];
  target_user_id text;
BEGIN
  target_user_id := COALESCE(NEW."userId", OLD."userId");

  -- Get all roles for the user
  SELECT array_agg(role::text) INTO user_roles
  FROM public."UserRole"
  WHERE "userId" = target_user_id;

  -- Update raw_app_meta_data in auth.users
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('roles', COALESCE(to_jsonb(user_roles), '[]'::jsonb))
  WHERE id = target_user_id::uuid;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger definition for UserRole changes
DROP TRIGGER IF EXISTS on_user_role_change ON public."UserRole";
CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE OR DELETE ON public."UserRole"
FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles_to_app_metadata();

-- 4. Supabase Custom Access Token Hook (Alternative JWT role claims injector)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_roles text[];
  user_id uuid;
BEGIN
  user_id := (event ->> 'user_id')::uuid;

  -- Get all roles for the user
  SELECT array_agg(role::text) INTO user_roles
  FROM public."UserRole"
  WHERE "userId" = user_id::text;

  claims := COALESCE(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_metadata, roles}', COALESCE(to_jsonb(user_roles), '[]'::jsonb));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- 5. Enable Row Level Security (RLS) on core tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WishlistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- User table policies
DROP POLICY IF EXISTS "User self read" ON public."User";
DROP POLICY IF EXISTS "User self update" ON public."User";
DROP POLICY IF EXISTS "User insert public" ON public."User";
DROP POLICY IF EXISTS "Admin all User" ON public."User";
CREATE POLICY "User self read" ON public."User" FOR SELECT USING (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "User self update" ON public."User" FOR UPDATE USING (auth.uid()::text = id OR public.is_admin());
CREATE POLICY "User insert public" ON public."User" FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin all User" ON public."User" FOR ALL USING (public.is_admin());

-- Address table policies
DROP POLICY IF EXISTS "Address user access" ON public."Address";
CREATE POLICY "Address user access" ON public."Address" FOR ALL USING (auth.uid()::text = "userId" OR public.is_admin());

-- CartItem table policies
DROP POLICY IF EXISTS "CartItem user access" ON public."CartItem";
CREATE POLICY "CartItem user access" ON public."CartItem" FOR ALL USING (auth.uid()::text = "userId" OR public.is_admin());

-- WishlistItem table policies
DROP POLICY IF EXISTS "WishlistItem user access" ON public."WishlistItem";
CREATE POLICY "WishlistItem user access" ON public."WishlistItem" FOR ALL USING (auth.uid()::text = "userId" OR public.is_admin());

-- Order table policies
DROP POLICY IF EXISTS "Order user select" ON public."Order";
DROP POLICY IF EXISTS "Order admin all" ON public."Order";
CREATE POLICY "Order user select" ON public."Order" FOR SELECT USING (auth.uid()::text = "userId" OR public.is_admin());
CREATE POLICY "Order admin all" ON public."Order" FOR ALL USING (public.is_admin());

-- OrderItem table policies
DROP POLICY IF EXISTS "OrderItem user select" ON public."OrderItem";
DROP POLICY IF EXISTS "OrderItem admin all" ON public."OrderItem";
CREATE POLICY "OrderItem user select" ON public."OrderItem" FOR SELECT USING (
  auth.uid()::text = (SELECT "userId" FROM public."Order" WHERE id = "orderId") OR public.is_admin()
);
CREATE POLICY "OrderItem admin all" ON public."OrderItem" FOR ALL USING (public.is_admin());

-- Products table policies
DROP POLICY IF EXISTS "Product public read" ON public.products;
DROP POLICY IF EXISTS "Product admin write" ON public.products;
CREATE POLICY "Product public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Product admin write" ON public.products FOR ALL USING (public.is_admin());

-- Product Images table policies
DROP POLICY IF EXISTS "ProductImage public read" ON public.product_images;
DROP POLICY IF EXISTS "ProductImage admin write" ON public.product_images;
CREATE POLICY "ProductImage public read" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "ProductImage admin write" ON public.product_images FOR ALL USING (public.is_admin());

-- Product Variants table policies
DROP POLICY IF EXISTS "ProductVariant public read" ON public.product_variants;
DROP POLICY IF EXISTS "ProductVariant admin write" ON public.product_variants;
CREATE POLICY "ProductVariant public read" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "ProductVariant admin write" ON public.product_variants FOR ALL USING (public.is_admin());

-- UserRole table policies
DROP POLICY IF EXISTS "UserRole user read" ON public."UserRole";
DROP POLICY IF EXISTS "UserRole admin all" ON public."UserRole";
CREATE POLICY "UserRole user read" ON public."UserRole" FOR SELECT USING (
  auth.uid()::text = "userId" OR 
  (auth.jwt() -> 'app_metadata' -> 'roles') ?| ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'MARKETING', 'SUPPORT', 'VIEWER']
);
CREATE POLICY "UserRole admin all" ON public."UserRole" FOR ALL USING (
  (auth.jwt() -> 'app_metadata' -> 'roles') ?| ARRAY['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'MARKETING', 'SUPPORT', 'VIEWER']
);

-- 7. Sync existing roles to auth.users metadata on migration
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'roles',
  COALESCE(
    (
      SELECT json_agg(role::text)
      FROM public."UserRole" ur
      WHERE ur."userId" = u.id::text
    ),
    '[]'::jsonb
  )
);
