-- ============================================================================
-- EcoBiz — Seed Data (Emission Factors)
-- Note: Marked explicitly as PLACEHOLDER as required by Section 3.4
-- ============================================================================

INSERT INTO public.emission_factors (key, label, value, unit, source, version, valid_from, is_placeholder)
VALUES
  (
    'electricity_grid_id',
    'Listrik PLN (Grid Rata-Rata)',
    0.850000,
    'kg CO2e / kWh',
    'PLACEHOLDER, ganti dengan sumber resmi (Faktor Emisi GRK Sistem Ketenagalistrikan Kementerian ESDM)',
    1,
    '2025-01-01',
    true
  ),
  (
    'lpg_combustion',
    'Gas LPG (Tabung 3 kg / 12 kg)',
    3.000000,
    'kg CO2e / kg LPG',
    'PLACEHOLDER, ganti dengan sumber resmi (Pedoman Inventarisasi GRK Nasional KLHK / IPCC)',
    1,
    '2025-01-01',
    true
  ),
  (
    'water_supply',
    'Air Bersih / PDAM',
    0.344000,
    'kg CO2e / m3',
    'PLACEHOLDER, ganti dengan sumber resmi (Faktor Ilustrasi Pengolahan Air Bersih)',
    1,
    '2025-01-01',
    true
  ),
  (
    'organic_waste_landfill',
    'Sisa Bahan Pangan ke TPA',
    1.900000,
    'kg CO2e / kg limbah',
    'PLACEHOLDER, ganti dengan sumber resmi (Faktor Ilustrasi Limbah Pangan Organik)',
    1,
    '2025-01-01',
    true
  )
ON CONFLICT (key, version) DO NOTHING;
