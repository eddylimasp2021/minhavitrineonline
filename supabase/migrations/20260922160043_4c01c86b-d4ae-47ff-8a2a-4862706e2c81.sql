ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'fisico',
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT;

ALTER TABLE public.products
  ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('fisico','digital','software','app'));

ALTER TABLE public.products
  ADD CONSTRAINT products_external_url_check
  CHECK (external_url IS NULL OR external_url ~* '^https?://');