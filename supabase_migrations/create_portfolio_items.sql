-- Migration: create_portfolio_items.sql
-- Creates a portfolio_items table with common fields used by the app
-- Also adds an updated_at trigger and recommended RLS policies for per-user access

BEGIN;

-- 1) Create table
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT,
  symbol TEXT,
  name TEXT,
  image TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC,
  last_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON public.portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_symbol ON public.portfolio_items(symbol);

-- 3) Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.portfolio_items;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- === Optional: Enable Row Level Security (RLS) and policies ===
-- Uncomment and run the following block if you want per-user policies.
-- RLS is recommended for multi-tenant apps so each user only accesses their own rows.

-- BEGIN;
--
-- ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
--
-- -- Allow authenticated users to INSERT rows and ensure they set user_id to their own id
-- CREATE POLICY "Insert own portfolio" ON public.portfolio_items
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
--
-- -- Allow users to SELECT their own rows
-- CREATE POLICY "Select own portfolio" ON public.portfolio_items
--   FOR SELECT
--   USING (auth.uid() = user_id);
--
-- -- Allow users to UPDATE their own rows
-- CREATE POLICY "Update own portfolio" ON public.portfolio_items
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
--
-- -- Allow users to DELETE their own rows
-- CREATE POLICY "Delete own portfolio" ON public.portfolio_items
--   FOR DELETE
--   USING (auth.uid() = user_id);
--
-- COMMIT;

-- Notes:
-- 1) Run this migration from Supabase SQL editor: https://app.supabase.com > your project > SQL Editor > New query
-- 2) If you enable RLS, make sure your client uses Supabase Auth and that the client sends requests with a valid user session.
-- 3) If you prefer non-RLS (open access), do NOT enable RLS; instead secure access via PostgREST roles.
-- 4) After running this migration, re-run the Add Asset flow in the app; the server-side insert should accept the 'image' column and stop returning PGRST204 schema-cache errors.
