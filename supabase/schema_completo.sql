-- ==============================================================================
-- MINHA VITRINE ONLINE — MASTER SCHEMA PARA O SUPABASE
-- Execute este script completo em uma NOVA QUERY no SQL Editor do seu Supabase.
-- ==============================================================================

-- 1. TIPOS ENUM SEGUROS (Nunca dão erro se já existirem)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.event_type AS ENUM (
    'page_view', 'product_view', 'product_click', 'favorite_add',
    'whatsapp_click', 'share_click', 'checkout_start', 'conversion',
    'search', 'filter', 'load_more', 'scroll_depth', 'favorite_remove'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. TABELA: USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "user_roles_self_read" ON public.user_roles;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 4. TABELA: PRODUCTS (Já inclui todas as colunas de softwares, links e entregas)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  video_url TEXT,
  category TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  whatsapp TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  product_type TEXT NOT NULL DEFAULT 'fisico' CHECK (product_type IN ('fisico','digital','software','app')),
  external_url TEXT CHECK (external_url IS NULL OR external_url ~* '^https?://'),
  cta_label TEXT,
  software_version TEXT,
  software_platform TEXT,
  license_type TEXT DEFAULT 'vitalicia',
  demo_url TEXT CHECK (demo_url IS NULL OR demo_url ~* '^https?://'),
  download_url TEXT CHECK (download_url IS NULL OR download_url ~* '^https?://'),
  delivery_instructions TEXT,
  system_requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);
CREATE INDEX IF NOT EXISTS products_owner_idx ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS products_published_idx ON public.products(published) WHERE published = true;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

DROP POLICY IF EXISTS "products_public_read_published" ON public.products;
CREATE POLICY "products_public_read_published" ON public.products FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "products_owner_read_all" ON public.products;
CREATE POLICY "products_owner_read_all" ON public.products FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "products_owner_insert" ON public.products;
CREATE POLICY "products_owner_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "products_owner_update" ON public.products;
CREATE POLICY "products_owner_update" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "products_owner_delete" ON public.products;
CREATE POLICY "products_owner_delete" ON public.products FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 5. TABELA: FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

DROP POLICY IF EXISTS "favorites_self_all" ON public.favorites;
CREATE POLICY "favorites_self_all" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. TABELA: ANALYTICS_EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type event_type NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  session_id TEXT,
  path TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_created_idx ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_type_idx ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_product_idx ON public.analytics_events(product_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;

DROP POLICY IF EXISTS "analytics_anon_insert" ON public.analytics_events;
CREATE POLICY "analytics_anon_insert" ON public.analytics_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "analytics_auth_insert" ON public.analytics_events;
CREATE POLICY "analytics_auth_insert" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "analytics_admin_read" ON public.analytics_events;
CREATE POLICY "analytics_admin_read" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 7. TABELA: ANALYTICS_RATE
CREATE TABLE IF NOT EXISTS public.analytics_rate (
  session_id TEXT NOT NULL,
  minute_bucket TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, minute_bucket)
);

CREATE INDEX IF NOT EXISTS analytics_rate_bucket_idx ON public.analytics_rate (minute_bucket);
ALTER TABLE public.analytics_rate ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.analytics_rate TO service_role;

-- 8. TRIGGERS & FUNÇÕES
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS products_updated ON public.products;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. BUCKET DE IMAGENS NO STORAGE
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_auth_upload" ON storage.objects;
CREATE POLICY "product_images_auth_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "product_images_owner_update" ON storage.objects;
CREATE POLICY "product_images_owner_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "product_images_owner_delete" ON storage.objects;
CREATE POLICY "product_images_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 10. CRIAÇÃO DO USUÁRIO ADMINISTRADOR (EDDY LIMA)
DO $$
DECLARE
  new_id uuid;
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM auth.users WHERE lower(email) = lower('eddylimainformatica@gmail.com');

  IF existing_id IS NULL THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      'eddylimainformatica@gmail.com', crypt('739786950', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','Eddy Lima'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_id, jsonb_build_object('sub', new_id::text, 'email', 'eddylimainformatica@gmail.com', 'email_verified', true), 'email', new_id::text, now(), now(), now());
  ELSE
    new_id := existing_id;
    UPDATE auth.users
      SET encrypted_password = crypt('739786950', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = new_id;
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (new_id, 'Eddy Lima')
  ON CONFLICT (id) DO UPDATE SET display_name = 'Eddy Lima';

  INSERT INTO public.user_roles (user_id, role) VALUES (new_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (new_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
