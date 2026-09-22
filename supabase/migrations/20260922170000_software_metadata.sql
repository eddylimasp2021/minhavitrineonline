-- Migration: Add software & digital delivery metadata columns to public.products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS software_version TEXT,
  ADD COLUMN IF NOT EXISTS software_platform TEXT,
  ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'vitalicia',
  ADD COLUMN IF NOT EXISTS demo_url TEXT,
  ADD COLUMN IF NOT EXISTS download_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
  ADD COLUMN IF NOT EXISTS system_requirements TEXT;

ALTER TABLE public.products
  ADD CONSTRAINT products_demo_url_check
  CHECK (demo_url IS NULL OR demo_url ~* '^https?://');

ALTER TABLE public.products
  ADD CONSTRAINT products_download_url_check
  CHECK (download_url IS NULL OR download_url ~* '^https?://');
