export type BusinessType = 'gorengan' | 'warung_makan' | 'kedai_kopi' | 'katering';
export type RecordingMode = 'cepat' | 'rinci';
export type ItemKind = 'bahan' | 'kemasan' | 'energi' | 'lain';
export type TransactionType = 'sale' | 'purchase' | 'utility';
export type TransactionSource = 'voice' | 'ocr' | 'manual';
export type TransactionStatus = 'pending' | 'confirmed';
export type DataConfidenceLevel = 'rendah' | 'sedang' | 'tinggi';
export type SyncState = 'local_only' | 'pending_sync' | 'synced';

export interface DimensionWeights {
  waste: number;     // default 0.30
  energy: number;    // default 0.30
  water: number;     // default 0.20
  packaging: number; // default 0.20
}

export interface BusinessTariffs {
  electricity_per_kwh: number;      // IDR per kWh (default 1445)
  lpg_per_kg: number;               // IDR per kg LPG (default 7333, i.e. 22000 / 3kg)
  water_per_m3: number;             // IDR per m3 (default 7500)
  used_oil_price_per_liter: number; // IDR per liter jelantah (default 6500)
  avg_ingredient_cost_per_kg: number; // IDR per kg bahan baku (default 18000)
}

export interface BusinessProfile {
  id: string;
  owner_id?: string;
  name: string;
  type: BusinessType;
  energy_sources: string[];
  mode: RecordingMode;
  weights: DimensionWeights;
  target_pct: number; // 5 to 20, default 10
  tariffs: BusinessTariffs;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogItem {
  id: string;
  business_id: string;
  client_id: string;
  name: string;
  kind: ItemKind;
  unit: string;
  pack_size: number;
  unit_cost: number;
  is_single_use: boolean;
  tags: string[];
  sync_status: SyncState;
}

export interface TransactionRecord {
  id: string;
  business_id: string;
  client_id: string;
  type: TransactionType;
  item_id?: string;
  item_name: string;
  kind: ItemKind | 'penjualan';
  qty: number;
  unit: string;
  amount_idr: number;
  is_single_use: boolean;
  occurred_at: string; // ISO string or YYYY-MM-DD
  source: TransactionSource;
  confidence: number;  // 0.0 to 1.0
  status: TransactionStatus;
  receipt_url?: string;
  sync_status: SyncState;
}

export interface DailyLogRecord {
  id: string;
  business_id: string;
  client_id: string;
  date: string; // YYYY-MM-DD
  portions_sold: number;
  waste_amount: number; // in kg or converted unit
  waste_unit: 'kg' | 'baskom' | 'porsi' | 'liter';
  used_oil_liters: number;
  oil_sold: boolean;
  ingredients_used_kg?: number; // optional explicit input in rinci mode
  note?: string;
  sync_status: SyncState;
}

export interface UtilityReadingRecord {
  id: string;
  business_id: string;
  client_id: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  kwh: number;
  gas_kg: number;
  water_m3: number;
  source: string;
  sync_status: SyncState;
}

export interface EmissionFactorRecord {
  id: string;
  key: 'electricity_grid_id' | 'lpg_combustion' | 'water_supply' | 'organic_waste_landfill';
  label: string;
  value: number;
  unit: string;
  source: string;
  version: number;
  valid_from: string;
  is_placeholder: boolean;
}

export interface ChallengeRecord {
  id: string;
  business_id: string;
  code: string;
  title: string;
  description: string;
  duration_days: 7 | 30;
  progress_days: number;
  checked_dates: string[]; // YYYY-MM-DD
  status: 'active' | 'completed' | 'paused';
  started_at: string;
  updated_at: string;
}

export interface RecommendationStatusRecord {
  id: string;
  business_id: string;
  rule_id: string;
  status: 'active' | 'applied' | 'dismissed';
  updated_at: string;
}

// ============================================================================
// Provenance ("Dari mana angka ini?") & Calculation Types
// ============================================================================

export interface MetricProvenance {
  title: string;
  finalValueFormatted: string;
  formulaText: string;
  inputs: Array<{
    label: string;
    value: string;
    sourceNote: string;
  }>;
  assumptions: string[];
  isPlaceholderFactor?: boolean;
}

export interface WeeklyRawTotals {
  weekStart: string;           // YYYY-MM-DD (Monday)
  weekLabel: string;           // e.g. "Minggu 8 (20–26 Okt)"
  daysLogged: number;          // 0..7
  portionsSold: number;        // P
  electricityKwh: number;      // L
  gasKg: number;               // G
  waterM3: number;             // A
  wasteKg: number;             // W (normalized to kg)
  ingredientsUsedKg: number;   // Bahan terpakai (kg)
  singleUsePackagingCount: number; // K
  usedOilLiters: number;       // J
  unsoldOilLiters: number;     // J where oil_sold === false
  salesIdr: number;
  purchaseIdr: number;
}

export interface WeeklyIntensities {
  electricityPerPortion: number; // L / P (kWh/porsi)
  gasPerPortion: number;         // G / P (kg/porsi)
  energyEquivalentPerPortion: number; // Combined normalized energy intensity (kWh + gas_kg * 3.5) / P
  waterPerPortion: number;       // A / P (m3/porsi)
  packagingPerPortion: number;   // K / P (pcs/porsi)
  wastePct: number;              // (W / ingredientsUsedKg) * 100
  hasZeroDenominator: boolean;
}

export interface DimensionMetrics {
  baseline: number;
  target: number;
  actual: number;
  score: number; // 0..100
  unit: string;
  alertConsecutiveTwoWeeks: boolean;
  measuredSavingsIdr: number;
  avoidableCostIdr: number;
  provenance: MetricProvenance;
}

export interface AvoidableCostBreakdown {
  wastedIngredientsCostIdr: number;
  unsoldUsedOilRevenueIdr: number;
  excessResourceCostIdr: number;
  totalAvoidableCostIdr: number;
  provenance: MetricProvenance;
}

export interface EmissionBreakdown {
  electricityCo2Kg: number;
  lpgCo2Kg: number;
  totalCo2Kg: number;
  isPlaceholder: boolean;
  factorVersion: number;
  factorSource: string;
  provenance: MetricProvenance;
}

export interface GeneratedRecommendation {
  ruleId: string;
  title: string;
  actionText: string;
  reasonText: string;
  estimatedWeeklySavingsIdr: number;
  dimension: 'waste' | 'energy' | 'water' | 'packaging' | 'oil';
  status: 'active' | 'applied' | 'dismissed';
}

export interface WeeklyReportComputed {
  weekStart: string;
  weekLabel: string;
  raw: WeeklyRawTotals;
  intensities: WeeklyIntensities;
  dataConfidence: DataConfidenceLevel;
  greenScore: number; // 0..100
  greenScoreSummary: string;
  greenScoreProvenance: MetricProvenance;
  dimensions: {
    waste: DimensionMetrics;
    energy: DimensionMetrics;
    water: DimensionMetrics;
    packaging: DimensionMetrics;
  };
  electricityIntensity: DimensionMetrics;
  gasIntensity: DimensionMetrics;
  avoidableCost: AvoidableCostBreakdown;
  emissions: EmissionBreakdown;
  totalMeasuredSavingsIdr: number;
  productionChangedOver20Pct: boolean;
  baselinePortionsAvg: number;
  recommendations: GeneratedRecommendation[];
}
