-- ============================================================================
-- EcoBiz — Initial PostgreSQL Schema & Row Level Security (RLS)
-- Migration: 0001_initial_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Businesses
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gorengan', 'warung_makan', 'kedai_kopi', 'katering')),
  energy_sources TEXT[] NOT NULL DEFAULT ARRAY['listrik', 'lpg_3kg'],
  mode TEXT NOT NULL DEFAULT 'cepat' CHECK (mode IN ('cepat', 'rinci')),
  weights JSONB NOT NULL DEFAULT '{"waste": 0.30, "energy": 0.30, "water": 0.20, "packaging": 0.20}'::jsonb,
  target_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (target_pct >= 5.00 AND target_pct <= 20.00),
  tariffs JSONB NOT NULL DEFAULT '{"electricity_per_kwh": 1445, "lpg_per_kg": 7333, "water_per_m3": 7500, "used_oil_price_per_liter": 6500, "avg_ingredient_cost_per_kg": 18000}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Catalog Items
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id TEXT UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('bahan', 'kemasan', 'energi', 'lain')),
  unit TEXT NOT NULL DEFAULT 'kg',
  pack_size NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_single_use BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'purchase', 'utility')),
  item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'bahan' CHECK (kind IN ('bahan', 'kemasan', 'energi', 'lain', 'penjualan')),
  qty NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  amount_idr NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_single_use BOOLEAN NOT NULL DEFAULT false,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('voice', 'ocr', 'manual')),
  confidence NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Daily Logs
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  portions_sold INTEGER NOT NULL DEFAULT 0 CHECK (portions_sold >= 0),
  waste_amount NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (waste_amount >= 0),
  waste_unit TEXT NOT NULL DEFAULT 'kg',
  used_oil_liters NUMERIC(10,3) NOT NULL DEFAULT 0 CHECK (used_oil_liters >= 0),
  oil_sold BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, date)
);

-- 5. Utility Readings
CREATE TABLE IF NOT EXISTS public.utility_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id TEXT UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  kwh NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (kwh >= 0),
  gas_kg NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (gas_kg >= 0),
  water_m3 NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (water_m3 >= 0),
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Emission Factors (Global / Versioned Reference Table)
CREATE TABLE IF NOT EXISTS public.emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value NUMERIC(12,6) NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'PLACEHOLDER, ganti dengan sumber resmi',
  version INTEGER NOT NULL DEFAULT 1,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  is_placeholder BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (key, version)
);

-- 7. Weekly Reports
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  payload JSONB NOT NULL,
  data_confidence TEXT NOT NULL CHECK (data_confidence IN ('rendah', 'sedang', 'tinggi')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, week_start)
);

-- 8. Targets
CREATE TABLE IF NOT EXISTS public.targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('all', 'waste', 'energy', 'water', 'packaging')),
  target_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (target_pct >= 5.00 AND target_pct <= 20.00),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, dimension)
);

-- 9. Challenges (7 or 30 days)
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 30)),
  progress_days INTEGER NOT NULL DEFAULT 0,
  checked_dates TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'applied', 'dismissed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, rule_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Helper function to verify business ownership
CREATE OR REPLACE FUNCTION public.is_business_owner(b_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = b_id AND owner_id = auth.uid()
  );
$$;

-- Businesses: Only owner can select, insert, update, delete
CREATE POLICY businesses_owner_policy ON public.businesses
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Child tables: Only owner of the linked business can access
CREATE POLICY catalog_items_owner_policy ON public.catalog_items
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY transactions_owner_policy ON public.transactions
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY daily_logs_owner_policy ON public.daily_logs
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY utility_readings_owner_policy ON public.utility_readings
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY weekly_reports_owner_policy ON public.weekly_reports
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY targets_owner_policy ON public.targets
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY challenges_owner_policy ON public.challenges
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY recommendations_owner_policy ON public.recommendations
  FOR ALL USING (public.is_business_owner(business_id)) WITH CHECK (public.is_business_owner(business_id));

-- Emission factors: Readable by everyone, writable by authenticated users updating their reference
CREATE POLICY emission_factors_read_policy ON public.emission_factors
  FOR SELECT USING (true);

-- Storage bucket for receipt photos (if Supabase storage is initialized)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY receipts_owner_select ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY receipts_owner_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY receipts_owner_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
