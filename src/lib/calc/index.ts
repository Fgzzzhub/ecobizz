import {
  AvoidableCostBreakdown,
  BusinessTariffs,
  DataConfidenceLevel,
  DimensionMetrics,
  DimensionWeights,
  EmissionBreakdown,
  EmissionFactorRecord,
  GeneratedRecommendation,
  RecommendationStatusRecord,
  WeeklyIntensities,
  WeeklyRawTotals,
  WeeklyReportComputed,
} from '@/types';

/**
 * Normalize waste units to kilograms (kg) for consistent calculation.
 * - 1 baskom adonan/sisa warung ≈ 2.5 kg
 * - 1 porsi sisa ≈ 0.25 kg
 * - 1 liter ≈ 1.0 kg
 */
export function convertWasteToKg(
  amount: number,
  unit: 'kg' | 'baskom' | 'porsi' | 'liter' | string
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  switch (unit) {
    case 'baskom':
      return amount * 2.5;
    case 'porsi':
      return amount * 0.25;
    case 'liter':
      return amount * 1.0;
    case 'kg':
    default:
      return amount;
  }
}

/**
 * Format Indonesian Rupiah with tabular clarity.
 */
export function formatIdr(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = safe < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(safe).toLocaleString('id-ID')}`;
}

/**
 * Format decimal numbers in Indonesian locale.
 */
export function formatNum(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Safe division helper that avoids NaN/Infinity on zero denominator.
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

/**
 * Compute weekly resource intensities per portion and waste percentage.
 * Per minggu: P = porsi terjual, L = kWh, G = kg gas, A = m3 air,
 * W = bahan terbuang (kg), K = kemasan sekali pakai, J = liter jelantah.
 */
export function calculateIntensities(raw: WeeklyRawTotals): WeeklyIntensities {
  const hasZeroPortions = raw.portionsSold <= 0;
  const hasZeroIngredients = raw.ingredientsUsedKg <= 0;

  const electricityPerPortion = safeDivide(raw.electricityKwh, raw.portionsSold);
  const gasPerPortion = safeDivide(raw.gasKg, raw.portionsSold);
  // Combined energy index (kWh equivalent where 1 kg LPG ≈ 13.6 kWh thermal, or weighted resource units)
  // For clear warung auditability, we also track electricity and gas directly and combine them into an energy index:
  // Energy index per portion = L/P + (G/P * 5) so both kWh and LPG kg have balanced sensitivity
  const energyEquivalentPerPortion = electricityPerPortion + gasPerPortion * 5;
  const waterPerPortion = safeDivide(raw.waterM3, raw.portionsSold);
  const packagingPerPortion = safeDivide(raw.singleUsePackagingCount, raw.portionsSold);
  const wastePct = safeDivide(raw.wasteKg * 100, raw.ingredientsUsedKg);

  return {
    electricityPerPortion,
    gasPerPortion,
    energyEquivalentPerPortion,
    waterPerPortion,
    packagingPerPortion,
    wastePct,
    hasZeroDenominator: hasZeroPortions || hasZeroIngredients,
  };
}

/**
 * Calculate baseline (average of up to first 4 calibration weeks with active data)
 * and target = baseline * (1 - t), where t is target reduction fraction (default 0.10, range 0.05..0.20).
 */
export function calculateBaselineAndTarget(
  calibrationValues: number[],
  targetPct = 10
): { baseline: number; target: number; tFraction: number } {
  const clampedPct = Math.min(20, Math.max(5, targetPct));
  const tFraction = clampedPct / 100;

  const validValues = calibrationValues
    .slice(0, 4)
    .filter((v) => Number.isFinite(v) && v > 0);

  if (validValues.length === 0) {
    return { baseline: 0, target: 0, tFraction };
  }

  const sum = validValues.reduce((acc, v) => acc + v, 0);
  const baseline = sum / validValues.length;
  const target = baseline * (1 - tFraction);

  return { baseline, target, tFraction };
}

/**
 * Calculate single dimension score:
 * Score = 50 + 50 * (baseline - actual) / (baseline * t), clamped to [0, 100].
 *
 * Mandatory test verification:
 * baseline = 8%, targetPct = 10% (target = 7.2%), actual = 7.6%
 * => 50 + 50 * (8 - 7.6) / (8 * 0.10) = 50 + 50 * (0.4 / 0.8) = 75.
 */
export function calculateDimensionScore(
  baseline: number,
  actual: number,
  targetPct = 10,
  hasData = true
): number {
  if (!hasData) return 0;
  if (!Number.isFinite(baseline) || !Number.isFinite(actual)) return 0;

  const t = Math.min(20, Math.max(5, targetPct)) / 100;

  if (baseline <= 0) {
    return actual <= 0 ? 100 : 0;
  }

  const denominator = baseline * t;
  if (denominator <= 0) return 50;

  const rawScore = 50 + 50 * ((baseline - actual) / denominator);
  const clamped = Math.min(100, Math.max(0, rawScore));
  return Math.round(clamped * 100) / 100;
}

/**
 * Calculate overall Green Score (Skor Hijau):
 * Default weights: 0.30 waste + 0.30 energy + 0.20 water + 0.20 packaging
 * Weights are configurable per business and automatically normalized if needed.
 */
export function calculateGreenScore(
  scores: {
    waste: number;
    energy: number;
    water: number;
    packaging: number;
  },
  weights: DimensionWeights = {
    waste: 0.3,
    energy: 0.3,
    water: 0.2,
    packaging: 0.2,
  },
  hasData = true
): number {
  if (!hasData) return 0;

  const totalWeight =
    weights.waste + weights.energy + weights.water + weights.packaging;
  const norm = totalWeight > 0 ? totalWeight : 1;

  const weighted =
    (scores.waste * weights.waste +
      scores.energy * weights.energy +
      scores.water * weights.water +
      scores.packaging * weights.packaging) /
    norm;

  return Math.round(Math.min(100, Math.max(0, weighted)));
}

/**
 * Human-friendly 1-sentence stamp meaning for the Green Score.
 */
export function getGreenScoreSummary(score: number, hasData: boolean): string {
  if (!hasData) {
    return 'Belum ada catatan minggu ini — yuk mulai catat hari ini.';
  }
  if (score >= 80) {
    return 'Dapurmu jauh lebih irit dibanding biasanya, target minggu ini tembus!';
  }
  if (score >= 65) {
    return 'Sudah lebih hemat dari biasanya, tinggal sedikit lagi capai target.';
  }
  if (score >= 50) {
    return 'Masih sama seperti kebiasaan awal, ada celah buat lebih hemat.';
  }
  return 'Minggu ini pemakaian bahan & gas agak boros, coba cek tips di bawah.';
}

/**
 * Data confidence level based on days logged in a week:
 * >= 6 days = 'tinggi', 4-5 days = 'sedang', < 4 days = 'rendah'
 */
export function calculateDataConfidence(daysLogged: number): DataConfidenceLevel {
  if (daysLogged >= 6) return 'tinggi';
  if (daysLogged >= 4) return 'sedang';
  return 'rendah';
}

/**
 * Alert detection:
 * Returns true if intensity > target * 1.1 for two consecutive periods.
 */
export function isConsecutiveAlert(
  currentActual: number,
  previousActual: number | null | undefined,
  target: number
): boolean {
  if (target <= 0 || previousActual === null || previousActual === undefined) {
    return false;
  }
  const threshold = target * 1.1;
  return currentActual > threshold && previousActual > threshold;
}

/**
 * Calculate measured savings compared to baseline:
 * (baselineIntensity - actualIntensity) * P * tariff
 * Also checks if portion volume changed > 20% compared to baseline portions.
 */
export function calculateMeasuredSavings(params: {
  baselineIntensity: number;
  actualIntensity: number;
  portionsSold: number;
  baselinePortionsAvg: number;
  unitTariffIdr: number;
}): {
  savingsIdr: number;
  productionChangedOver20Pct: boolean;
} {
  const {
    baselineIntensity,
    actualIntensity,
    portionsSold,
    baselinePortionsAvg,
    unitTariffIdr,
  } = params;

  const productionChangedOver20Pct =
    baselinePortionsAvg > 0
      ? Math.abs(portionsSold - baselinePortionsAvg) / baselinePortionsAvg > 0.2
      : false;

  if (portionsSold <= 0 || baselineIntensity <= 0 || unitTariffIdr <= 0) {
    return { savingsIdr: 0, productionChangedOver20Pct };
  }

  const savingsIdr =
    (baselineIntensity - actualIntensity) * portionsSold * unitTariffIdr;

  return {
    savingsIdr: Math.round(savingsIdr),
    productionChangedOver20Pct,
  };
}

/**
 * Calculate avoidable environmental cost (Biaya lingkungan yang bisa dikurangi):
 * = nilai bahan terbuang
 * + (J * harga jual jelantah, bila tidak dijual)
 * + Σ max(0, intensitas aktual - intensitas target) * P * tarif
 */
export function calculateAvoidableCost(params: {
  wasteKg: number;
  unsoldOilLiters: number;
  portionsSold: number;
  actualIntensities: {
    electricityPerPortion: number;
    gasPerPortion: number;
    waterPerPortion: number;
    packagingPerPortion: number;
  };
  targetIntensities: {
    electricityPerPortion: number;
    gasPerPortion: number;
    waterPerPortion: number;
    packagingPerPortion: number;
  };
  tariffs: BusinessTariffs;
  avgPackagingCostIdr?: number;
}): AvoidableCostBreakdown {
  const {
    wasteKg,
    unsoldOilLiters,
    portionsSold,
    actualIntensities,
    targetIntensities,
    tariffs,
    avgPackagingCostIdr = 350,
  } = params;

  const wastedIngredientsCostIdr = Math.round(
    Math.max(0, wasteKg) * tariffs.avg_ingredient_cost_per_kg
  );

  const unsoldUsedOilRevenueIdr = Math.round(
    Math.max(0, unsoldOilLiters) * tariffs.used_oil_price_per_liter
  );

  const excessElectricityCost =
    Math.max(
      0,
      actualIntensities.electricityPerPortion -
        targetIntensities.electricityPerPortion
    ) *
    Math.max(0, portionsSold) *
    tariffs.electricity_per_kwh;

  const excessGasCost =
    Math.max(
      0,
      actualIntensities.gasPerPortion - targetIntensities.gasPerPortion
    ) *
    Math.max(0, portionsSold) *
    tariffs.lpg_per_kg;

  const excessWaterCost =
    Math.max(
      0,
      actualIntensities.waterPerPortion - targetIntensities.waterPerPortion
    ) *
    Math.max(0, portionsSold) *
    tariffs.water_per_m3;

  const excessPackagingCost =
    Math.max(
      0,
      actualIntensities.packagingPerPortion -
        targetIntensities.packagingPerPortion
    ) *
    Math.max(0, portionsSold) *
    avgPackagingCostIdr;

  const excessResourceCostIdr = Math.round(
    excessElectricityCost + excessGasCost + excessWaterCost + excessPackagingCost
  );

  const totalAvoidableCostIdr =
    wastedIngredientsCostIdr + unsoldUsedOilRevenueIdr + excessResourceCostIdr;

  return {
    wastedIngredientsCostIdr,
    unsoldUsedOilRevenueIdr,
    excessResourceCostIdr,
    totalAvoidableCostIdr,
    provenance: {
      title: 'Biaya Lingkungan yang Bisa Dikurangi',
      finalValueFormatted: formatIdr(totalAvoidableCostIdr),
      formulaText:
        'Nilai bahan terbuang + (J × harga jual jelantah bila belum dijual) + Σ max(0, intensitas aktual − intensitas target) × P × tarif',
      inputs: [
        {
          label: 'Nilai bahan terbuang (W × harga bahan/kg)',
          value: `${formatNum(wasteKg, 1)} kg × ${formatIdr(tariffs.avg_ingredient_cost_per_kg)} = ${formatIdr(wastedIngredientsCostIdr)}`,
          sourceNote: 'Catatan sisa bahan harian & rata-rata harga bahan baku',
        },
        {
          label: 'Jelantah belum dijual (J × harga pengepul)',
          value: `${formatNum(unsoldOilLiters, 1)} L × ${formatIdr(tariffs.used_oil_price_per_liter)} = ${formatIdr(unsoldUsedOilRevenueIdr)}`,
          sourceNote: 'Catatan jelantah harian dengan status belum dijual ke pengepul',
        },
        {
          label: 'Kelebihan intensitas listrik, gas, air, & kemasan di atas target',
          value: formatIdr(excessResourceCostIdr),
          sourceNote: `Dihitung pada ${portionsSold.toLocaleString('id-ID')} porsi terjual minggu ini`,
        },
      ],
      assumptions: [
        'Harga bahan baku rata-rata dan tarif energi dapat diubah di menu Pengaturan.',
        'Hanya menghitung selisih positif saat intensitas aktual melebihi target penghematan.',
      ],
    },
  };
}

/**
 * Calculate estimated emissions:
 * Emisi = L * faktor listrik + G * faktor LPG
 */
export function calculateEmissions(params: {
  electricityKwh: number;
  gasKg: number;
  factors: EmissionFactorRecord[];
}): EmissionBreakdown {
  const { electricityKwh, gasKg, factors } = params;

  const elecFactor = factors.find((f) => f.key === 'electricity_grid_id') ?? {
    value: 0.85,
    unit: 'kg CO2e / kWh',
    source: 'PLACEHOLDER, ganti dengan sumber resmi',
    version: 1,
    is_placeholder: true,
  };

  const lpgFactor = factors.find((f) => f.key === 'lpg_combustion') ?? {
    value: 3.0,
    unit: 'kg CO2e / kg LPG',
    source: 'PLACEHOLDER, ganti dengan sumber resmi',
    version: 1,
    is_placeholder: true,
  };

  const electricityCo2Kg =
    Math.round(Math.max(0, electricityKwh) * elecFactor.value * 100) / 100;
  const lpgCo2Kg =
    Math.round(Math.max(0, gasKg) * lpgFactor.value * 100) / 100;
  const totalCo2Kg = Math.round((electricityCo2Kg + lpgCo2Kg) * 100) / 100;
  const isPlaceholder = Boolean(
    elecFactor.is_placeholder || lpgFactor.is_placeholder
  );

  return {
    electricityCo2Kg,
    lpgCo2Kg,
    totalCo2Kg,
    isPlaceholder,
    factorVersion: Math.max(elecFactor.version, lpgFactor.version),
    factorSource: `${elecFactor.source}`,
    provenance: {
      title: 'Estimasi Emisi Gas Rumah Kaca (CO₂e)',
      finalValueFormatted: `${formatNum(totalCo2Kg, 1)} kg CO₂e`,
      formulaText: '(L × Faktor Emisi Listrik) + (G × Faktor Emisi LPG)',
      inputs: [
        {
          label: 'Listrik (L × faktor listrik)',
          value: `${formatNum(electricityKwh, 1)} kWh × ${formatNum(elecFactor.value, 2)} = ${formatNum(electricityCo2Kg, 1)} kg CO₂e`,
          sourceNote: `Versi v${elecFactor.version} (${elecFactor.is_placeholder ? 'Faktor ilustrasi / PLACEHOLDER' : elecFactor.source})`,
        },
        {
          label: 'Gas LPG (G × faktor LPG)',
          value: `${formatNum(gasKg, 1)} kg × ${formatNum(lpgFactor.value, 2)} = ${formatNum(lpgCo2Kg, 1)} kg CO₂e`,
          sourceNote: `Versi v${lpgFactor.version} (${lpgFactor.is_placeholder ? 'Faktor ilustrasi / PLACEHOLDER' : lpgFactor.source})`,
        },
      ],
      assumptions: [
        'Estimasi indikatif untuk pemantauan internal warung, bukan sertifikasi karbon resmi.',
        isPlaceholder
          ? 'PERHATIAN: Menggunakan faktor ilustrasi (PLACEHOLDER, ganti dengan sumber resmi Kementerian ESDM / IPCC di Pengaturan).'
          : 'Menggunakan faktor emisi yang telah diperbarui di Pengaturan.',
      ],
      isPlaceholderFactor: isPlaceholder,
    },
  };
}

/**
 * Deterministic rule-based recommendation engine (Max 3 actionable tips).
 */
export function generateRecommendations(params: {
  raw: WeeklyRawTotals;
  wasteMetric: DimensionMetrics;
  energyMetric: DimensionMetrics;
  waterMetric: DimensionMetrics;
  packagingMetric: DimensionMetrics;
  tariffs: BusinessTariffs;
  savedStatuses?: RecommendationStatusRecord[];
}): GeneratedRecommendation[] {
  const {
    raw,
    wasteMetric,
    energyMetric,
    waterMetric,
    packagingMetric,
    tariffs,
    savedStatuses = [],
  } = params;

  const statusMap = new Map(savedStatuses.map((s) => [s.rule_id, s.status]));
  const candidates: GeneratedRecommendation[] = [];

  // Rule 1: Unsold used cooking oil (Jelantah)
  if (raw.unsoldOilLiters >= 1.5) {
    const potential = Math.round(
      raw.unsoldOilLiters * tariffs.used_oil_price_per_liter
    );
    candidates.push({
      ruleId: 'rule_sell_jelantah',
      title: 'Kumpulkan & jual jelantah ke pengepul resmi',
      actionText: `Tampung ${formatNum(raw.unsoldOilLiters, 1)} liter jelantah minggu ini di jeriken tertutup, jangan dibuang ke selokan.`,
      reasonText: `Ada ${formatNum(raw.unsoldOilLiters, 1)} L jelantah yang belum terjual minggu ini.`,
      estimatedWeeklySavingsIdr: potential,
      dimension: 'oil',
      status: statusMap.get('rule_sell_jelantah') ?? 'active',
    });
  }

  // Rule 2: High dough/ingredient waste
  if (wasteMetric.actual > wasteMetric.target && raw.wasteKg > 0.5) {
    const reducibleKg = Math.max(0.5, raw.wasteKg * 0.4);
    const potential = Math.round(
      reducibleKg * tariffs.avg_ingredient_cost_per_kg
    );
    candidates.push({
      ruleId: 'rule_small_batch_dough',
      title: 'Bagi adonan sore jadi 2 takaran kecil',
      actionText:
        'Kurangi takaran adonan 2 jam sebelum tutup; bikin adonan tambahan hanya bila antrean masih ramai.',
      reasonText: `Sisa bahan minggu ini ${formatNum(wasteMetric.actual, 1)}% (target ${formatNum(wasteMetric.target, 1)}%).`,
      estimatedWeeklySavingsIdr: potential,
      dimension: 'waste',
      status: statusMap.get('rule_small_batch_dough') ?? 'active',
    });
  }

  // Rule 3: Energy intensity above target or consecutive alert
  if (
    energyMetric.actual > energyMetric.target ||
    energyMetric.alertConsecutiveTwoWeeks
  ) {
    const potential = Math.max(
      15000,
      Math.round(energyMetric.avoidableCostIdr || 22000)
    );
    candidates.push({
      ruleId: 'rule_stove_heat_control',
      title: 'Kecilkan api kompor saat jeda gorengan & bersihkan kerak wajan',
      actionText:
        'Matikan salah satu tungku di luar jam puncak dan gunakan tutup panci saat merebus air/kuah.',
      reasonText: energyMetric.alertConsecutiveTwoWeeks
        ? 'Pemakaian energi per porsi melewati batas peringatan 2 minggu berturut-turut.'
        : `Intensitas energi (${formatNum(energyMetric.actual, 3)}) di atas target (${formatNum(energyMetric.target, 3)}).`,
      estimatedWeeklySavingsIdr: potential,
      dimension: 'energy',
      status: statusMap.get('rule_stove_heat_control') ?? 'active',
    });
  }

  // Rule 4: Single-use packaging reduction
  if (packagingMetric.actual > packagingMetric.target && raw.singleUsePackagingCount > 20) {
    const potential = Math.max(
      12000,
      Math.round(raw.singleUsePackagingCount * 0.2 * 350)
    );
    candidates.push({
      ruleId: 'rule_ask_plastic_bag',
      title: 'Tawarkan bungkus kertas langsung tanpa kresek ganda',
      actionText:
        'Tanya pembeli "Langsung masuk tas/kantong sendiri, Bu/Pak?" untuk pembelian di bawah 10 potong.',
      reasonText: `Pemakaian kemasan sekali pakai ${formatNum(packagingMetric.actual, 2)} pcs/porsi (target ${formatNum(packagingMetric.target, 2)}).`,
      estimatedWeeklySavingsIdr: potential,
      dimension: 'packaging',
      status: statusMap.get('rule_ask_plastic_bag') ?? 'active',
    });
  }

  // Rule 5: Water washing basin optimization
  if (waterMetric.actual > waterMetric.target) {
    candidates.push({
      ruleId: 'rule_pre_soak_dishes',
      title: 'Rendam peralatan masak di baskom sebelum dibilas keran',
      actionText:
        'Gunakan 1 baskom air sabun hangat untuk merontokkan minyak sebelum bilas air mengalir.',
      reasonText: `Pemakaian air ${formatNum(waterMetric.actual, 4)} m³/porsi melebihi target ${formatNum(waterMetric.target, 4)} m³/porsi.`,
      estimatedWeeklySavingsIdr: Math.max(8000, waterMetric.avoidableCostIdr),
      dimension: 'water',
      status: statusMap.get('rule_pre_soak_dishes') ?? 'active',
    });
  }

  // Fallback positive maintenance tip if everything is already beating target
  if (candidates.length === 0 && raw.portionsSold > 0) {
    candidates.push({
      ruleId: 'rule_maintain_calibration',
      title: 'Pertahankan takaran adonan & jadwal saring minyak',
      actionText:
        'Saring remah gorengan tiap 2 jam agar minyak tidak cepat menghitam dan hemat gas.',
      reasonText:
        'Semua metrik minggu ini sudah mencapai atau melampaui target penghematan.',
      estimatedWeeklySavingsIdr: 25000,
      dimension: 'energy',
      status: statusMap.get('rule_maintain_calibration') ?? 'active',
    });
  }

  return candidates
    .filter((c) => c.status !== 'dismissed')
    .sort((a, b) => b.estimatedWeeklySavingsIdr - a.estimatedWeeklySavingsIdr)
    .slice(0, 3);
}

/**
 * Compute full multi-week series of WeeklyReportComputed from raw weekly totals.
 * Uses the first up to 4 weeks as calibration baseline.
 */
export function computeAllWeeklyReports(params: {
  weeklyRawList: WeeklyRawTotals[];
  targetPct: number;
  weights: DimensionWeights;
  tariffs: BusinessTariffs;
  emissionFactors: EmissionFactorRecord[];
  recommendationStatuses?: RecommendationStatusRecord[];
}): WeeklyReportComputed[] {
  const {
    weeklyRawList,
    targetPct,
    weights,
    tariffs,
    emissionFactors,
    recommendationStatuses = [],
  } = params;

  if (weeklyRawList.length === 0) return [];

  const allIntensities = weeklyRawList.map((raw) => calculateIntensities(raw));

  // Calibration weeks: first up to 4 weeks that have portionsSold > 0
  const activeCalibrationIndices = weeklyRawList
    .map((r, idx) => (r.portionsSold > 0 ? idx : -1))
    .filter((idx) => idx >= 0)
    .slice(0, 4);

  const pickCal = (getter: (i: WeeklyIntensities) => number): number[] =>
    activeCalibrationIndices.map((idx) => getter(allIntensities[idx]));

  const wasteCal = calculateBaselineAndTarget(
    pickCal((i) => i.wastePct),
    targetPct
  );
  const elecCal = calculateBaselineAndTarget(
    pickCal((i) => i.electricityPerPortion),
    targetPct
  );
  const gasCal = calculateBaselineAndTarget(
    pickCal((i) => i.gasPerPortion),
    targetPct
  );
  const energyCal = calculateBaselineAndTarget(
    pickCal((i) => i.energyEquivalentPerPortion),
    targetPct
  );
  const waterCal = calculateBaselineAndTarget(
    pickCal((i) => i.waterPerPortion),
    targetPct
  );
  const packagingCal = calculateBaselineAndTarget(
    pickCal((i) => i.packagingPerPortion),
    targetPct
  );

  const baselinePortionsAvg =
    activeCalibrationIndices.length > 0
      ? activeCalibrationIndices.reduce(
          (acc, idx) => acc + weeklyRawList[idx].portionsSold,
          0
        ) / activeCalibrationIndices.length
      : 0;

  return weeklyRawList.map((raw, idx) => {
    const intensities = allIntensities[idx];
    const prevIntensities = idx > 0 ? allIntensities[idx - 1] : null;
    const hasData = raw.daysLogged > 0 && raw.portionsSold > 0;
    const dataConfidence = calculateDataConfidence(raw.daysLogged);

    // Scores
    const wasteScore = calculateDimensionScore(
      wasteCal.baseline,
      intensities.wastePct,
      targetPct,
      hasData
    );
    const elecScore = calculateDimensionScore(
      elecCal.baseline,
      intensities.electricityPerPortion,
      targetPct,
      hasData
    );
    const gasScore = calculateDimensionScore(
      gasCal.baseline,
      intensities.gasPerPortion,
      targetPct,
      hasData
    );
    const energyScore = calculateDimensionScore(
      energyCal.baseline,
      intensities.energyEquivalentPerPortion,
      targetPct,
      hasData
    );
    const waterScore = calculateDimensionScore(
      waterCal.baseline,
      intensities.waterPerPortion,
      targetPct,
      hasData
    );
    const packagingScore = calculateDimensionScore(
      packagingCal.baseline,
      intensities.packagingPerPortion,
      targetPct,
      hasData
    );

    const greenScore = calculateGreenScore(
      {
        waste: wasteScore,
        energy: energyScore,
        water: waterScore,
        packaging: packagingScore,
      },
      weights,
      hasData
    );

    // Measured savings vs baseline
    const elecSavings = calculateMeasuredSavings({
      baselineIntensity: elecCal.baseline,
      actualIntensity: intensities.electricityPerPortion,
      portionsSold: raw.portionsSold,
      baselinePortionsAvg,
      unitTariffIdr: tariffs.electricity_per_kwh,
    });

    const gasSavings = calculateMeasuredSavings({
      baselineIntensity: gasCal.baseline,
      actualIntensity: intensities.gasPerPortion,
      portionsSold: raw.portionsSold,
      baselinePortionsAvg,
      unitTariffIdr: tariffs.lpg_per_kg,
    });

    const waterSavings = calculateMeasuredSavings({
      baselineIntensity: waterCal.baseline,
      actualIntensity: intensities.waterPerPortion,
      portionsSold: raw.portionsSold,
      baselinePortionsAvg,
      unitTariffIdr: tariffs.water_per_m3,
    });

    const packagingSavings = calculateMeasuredSavings({
      baselineIntensity: packagingCal.baseline,
      actualIntensity: intensities.packagingPerPortion,
      portionsSold: raw.portionsSold,
      baselinePortionsAvg,
      unitTariffIdr: 350,
    });

    // Waste savings in IDR compared to baseline waste %
    const baselineWasteKgExpected =
      (wasteCal.baseline / 100) * raw.ingredientsUsedKg;
    const wasteSavingsIdr = hasData
      ? Math.round(
          (baselineWasteKgExpected - raw.wasteKg) *
            tariffs.avg_ingredient_cost_per_kg
        )
      : 0;

    const totalMeasuredSavingsIdr =
      wasteSavingsIdr +
      elecSavings.savingsIdr +
      gasSavings.savingsIdr +
      waterSavings.savingsIdr +
      packagingSavings.savingsIdr;

    const avoidableCost = calculateAvoidableCost({
      wasteKg: raw.wasteKg,
      unsoldOilLiters: raw.unsoldOilLiters,
      portionsSold: raw.portionsSold,
      actualIntensities: {
        electricityPerPortion: intensities.electricityPerPortion,
        gasPerPortion: intensities.gasPerPortion,
        waterPerPortion: intensities.waterPerPortion,
        packagingPerPortion: intensities.packagingPerPortion,
      },
      targetIntensities: {
        electricityPerPortion: elecCal.target,
        gasPerPortion: gasCal.target,
        waterPerPortion: waterCal.target,
        packagingPerPortion: packagingCal.target,
      },
      tariffs,
    });

    const emissions = calculateEmissions({
      electricityKwh: raw.electricityKwh,
      gasKg: raw.gasKg,
      factors: emissionFactors,
    });

    const wasteDimension: DimensionMetrics = {
      baseline: wasteCal.baseline,
      target: wasteCal.target,
      actual: intensities.wastePct,
      score: wasteScore,
      unit: '%',
      alertConsecutiveTwoWeeks: isConsecutiveAlert(
        intensities.wastePct,
        prevIntensities?.wastePct,
        wasteCal.target
      ),
      measuredSavingsIdr: wasteSavingsIdr,
      avoidableCostIdr: avoidableCost.wastedIngredientsCostIdr,
      provenance: {
        title: 'Persentase Bahan Terbuang (W / Bahan Terpakai)',
        finalValueFormatted: `${formatNum(intensities.wastePct, 2)}% (Skor ${Math.round(wasteScore)})`,
        formulaText:
          'Bahan Terbuang % = (W / Bahan Terpakai) × 100; Skor = 50 + 50 × (Baseline − Aktual) / (Baseline × t)',
        inputs: [
          {
            label: 'Sisa bahan minggu ini (W)',
            value: `${formatNum(raw.wasteKg, 2)} kg`,
            sourceNote: `Dari ${raw.daysLogged} hari catatan harian`,
          },
          {
            label: 'Total bahan baku terpakai',
            value: `${formatNum(raw.ingredientsUsedKg, 1)} kg`,
            sourceNote: 'Dari belanja bahan & takaran porsi terjual',
          },
          {
            label: `Baseline 4 minggu awal & Target (−${targetPct}%)`,
            value: `Baseline ${formatNum(wasteCal.baseline, 2)}% → Target ${formatNum(wasteCal.target, 2)}%`,
            sourceNote: 'Rata-rata masa kalibrasi 4 minggu pertama',
          },
        ],
        assumptions: [
          '1 baskom sisa adonan disetarakan 2,5 kg bila dicatat dalam satuan baskom.',
          'Skor dibatasi pada rentang 0 hingga 100.',
        ],
      },
    };

    const electricityDimension: DimensionMetrics = {
      baseline: elecCal.baseline,
      target: elecCal.target,
      actual: intensities.electricityPerPortion,
      score: elecScore,
      unit: 'kWh/porsi',
      alertConsecutiveTwoWeeks: isConsecutiveAlert(
        intensities.electricityPerPortion,
        prevIntensities?.electricityPerPortion,
        elecCal.target
      ),
      measuredSavingsIdr: elecSavings.savingsIdr,
      avoidableCostIdr: Math.round(
        Math.max(0, intensities.electricityPerPortion - elecCal.target) *
          raw.portionsSold *
          tariffs.electricity_per_kwh
      ),
      provenance: {
        title: 'Intensitas Listrik per Porsi (L / P)',
        finalValueFormatted: `${formatNum(intensities.electricityPerPortion, 3)} kWh/porsi`,
        formulaText: 'Intensitas Listrik = L (kWh) / P (porsi terjual)',
        inputs: [
          {
            label: 'Pemakaian listrik minggu ini (L)',
            value: `${formatNum(raw.electricityKwh, 1)} kWh`,
            sourceNote: 'Catatan token/meteran listrik mingguan',
          },
          {
            label: 'Porsi terjual (P)',
            value: `${raw.portionsSold.toLocaleString('id-ID')} porsi`,
            sourceNote: 'Akumulasi porsi terjual minggu ini',
          },
        ],
        assumptions: [
          `Tarif listrik dihitung Rp ${tariffs.electricity_per_kwh.toLocaleString('id-ID')}/kWh.`,
        ],
      },
    };

    const gasDimension: DimensionMetrics = {
      baseline: gasCal.baseline,
      target: gasCal.target,
      actual: intensities.gasPerPortion,
      score: gasScore,
      unit: 'kg LPG/porsi',
      alertConsecutiveTwoWeeks: isConsecutiveAlert(
        intensities.gasPerPortion,
        prevIntensities?.gasPerPortion,
        gasCal.target
      ),
      measuredSavingsIdr: gasSavings.savingsIdr,
      avoidableCostIdr: Math.round(
        Math.max(0, intensities.gasPerPortion - gasCal.target) *
          raw.portionsSold *
          tariffs.lpg_per_kg
      ),
      provenance: {
        title: 'Intensitas Gas LPG per Porsi (G / P)',
        finalValueFormatted: `${formatNum(intensities.gasPerPortion, 4)} kg/porsi`,
        formulaText: 'Intensitas Gas = G (kg LPG) / P (porsi terjual)',
        inputs: [
          {
            label: 'Pemakaian gas LPG minggu ini (G)',
            value: `${formatNum(raw.gasKg, 1)} kg`,
            sourceNote: 'Catatan pembelian/pemakaian tabung LPG',
          },
          {
            label: 'Porsi terjual (P)',
            value: `${raw.portionsSold.toLocaleString('id-ID')} porsi`,
            sourceNote: 'Akumulasi porsi terjual minggu ini',
          },
        ],
        assumptions: [
          `Harga LPG dihitung Rp ${tariffs.lpg_per_kg.toLocaleString('id-ID')}/kg (setara Rp ${(tariffs.lpg_per_kg * 3).toLocaleString('id-ID')}/tabung 3 kg).`,
        ],
      },
    };

    const energyDimension: DimensionMetrics = {
      baseline: energyCal.baseline,
      target: energyCal.target,
      actual: intensities.energyEquivalentPerPortion,
      score: energyScore,
      unit: 'indeks/porsi',
      alertConsecutiveTwoWeeks:
        electricityDimension.alertConsecutiveTwoWeeks ||
        gasDimension.alertConsecutiveTwoWeeks ||
        isConsecutiveAlert(
          intensities.energyEquivalentPerPortion,
          prevIntensities?.energyEquivalentPerPortion,
          energyCal.target
        ),
      measuredSavingsIdr: elecSavings.savingsIdr + gasSavings.savingsIdr,
      avoidableCostIdr:
        electricityDimension.avoidableCostIdr + gasDimension.avoidableCostIdr,
      provenance: {
        title: 'Intensitas Energi Gabungan (Listrik L/P & Gas G/P)',
        finalValueFormatted: `Listrik ${formatNum(intensities.electricityPerPortion, 3)} kWh & Gas ${formatNum(intensities.gasPerPortion, 3)} kg / porsi (Skor ${Math.round(energyScore)})`,
        formulaText:
          'L/P (kWh/porsi) dan G/P (kg LPG/porsi); Skor = 50 + 50 × (Baseline − Aktual) / (Baseline × t)',
        inputs: [
          {
            label: 'Listrik (L) & Intensitas (L/P)',
            value: `${formatNum(raw.electricityKwh, 1)} kWh ÷ ${raw.portionsSold} porsi = ${formatNum(intensities.electricityPerPortion, 3)} kWh/porsi`,
            sourceNote: `Baseline: ${formatNum(elecCal.baseline, 3)} → Target: ${formatNum(elecCal.target, 3)} kWh/porsi`,
          },
          {
            label: 'Gas LPG (G) & Intensitas (G/P)',
            value: `${formatNum(raw.gasKg, 1)} kg ÷ ${raw.portionsSold} porsi = ${formatNum(intensities.gasPerPortion, 3)} kg/porsi`,
            sourceNote: `Baseline: ${formatNum(gasCal.baseline, 3)} → Target: ${formatNum(gasCal.target, 3)} kg/porsi`,
          },
        ],
        assumptions: [
          `Tarif listrik Rp ${tariffs.electricity_per_kwh.toLocaleString('id-ID')}/kWh dan LPG Rp ${tariffs.lpg_per_kg.toLocaleString('id-ID')}/kg.`,
          'Menggabungkan efisiensi pemakaian listrik dan LPG per porsi makanan/minuman.',
        ],
      },
    };

    const waterDimension: DimensionMetrics = {
      baseline: waterCal.baseline,
      target: waterCal.target,
      actual: intensities.waterPerPortion,
      score: waterScore,
      unit: 'm³/porsi',
      alertConsecutiveTwoWeeks: isConsecutiveAlert(
        intensities.waterPerPortion,
        prevIntensities?.waterPerPortion,
        waterCal.target
      ),
      measuredSavingsIdr: waterSavings.savingsIdr,
      avoidableCostIdr: Math.round(
        Math.max(0, intensities.waterPerPortion - waterCal.target) *
          raw.portionsSold *
          tariffs.water_per_m3
      ),
      provenance: {
        title: 'Intensitas Air per Porsi (A / P)',
        finalValueFormatted: `${formatNum(intensities.waterPerPortion, 4)} m³/porsi (Skor ${Math.round(waterScore)})`,
        formulaText:
          'Intensitas Air = A (m³) / P (porsi terjual); Skor = 50 + 50 × (Baseline − Aktual) / (Baseline × t)',
        inputs: [
          {
            label: 'Pemakaian air minggu ini (A)',
            value: `${formatNum(raw.waterM3, 2)} m³ (${formatNum(raw.waterM3 * 1000, 0)} liter)`,
            sourceNote: 'Catatan meteran air / estimasi pemakaian harian',
          },
          {
            label: 'Porsi terjual (P)',
            value: `${raw.portionsSold.toLocaleString('id-ID')} porsi`,
            sourceNote: 'Akumulasi porsi terjual minggu ini',
          },
          {
            label: `Baseline & Target (−${targetPct}%)`,
            value: `Baseline ${formatNum(waterCal.baseline, 4)} → Target ${formatNum(waterCal.target, 4)} m³/porsi`,
            sourceNote: 'Rata-rata 4 minggu kalibrasi',
          },
        ],
        assumptions: [
          `Tarif air bersih dihitung Rp ${tariffs.water_per_m3.toLocaleString('id-ID')}/m³.`,
        ],
      },
    };

    const packagingDimension: DimensionMetrics = {
      baseline: packagingCal.baseline,
      target: packagingCal.target,
      actual: intensities.packagingPerPortion,
      score: packagingScore,
      unit: 'pcs/porsi',
      alertConsecutiveTwoWeeks: isConsecutiveAlert(
        intensities.packagingPerPortion,
        prevIntensities?.packagingPerPortion,
        packagingCal.target
      ),
      measuredSavingsIdr: packagingSavings.savingsIdr,
      avoidableCostIdr: Math.round(
        Math.max(0, intensities.packagingPerPortion - packagingCal.target) *
          raw.portionsSold *
          350
      ),
      provenance: {
        title: 'Intensitas Kemasan Sekali Pakai (K / P)',
        finalValueFormatted: `${formatNum(intensities.packagingPerPortion, 2)} pcs/porsi (Skor ${Math.round(packagingScore)})`,
        formulaText:
          'Intensitas Kemasan = K (unit sekali pakai) / P (porsi terjual); Skor = 50 + 50 × (Baseline − Aktual) / (Baseline × t)',
        inputs: [
          {
            label: 'Kemasan sekali pakai terpakai (K)',
            value: `${raw.singleUsePackagingCount.toLocaleString('id-ID')} pcs`,
            sourceNote: 'Kantong kresek, mika, kertas bungkus, atau cup plastik',
          },
          {
            label: 'Porsi terjual (P)',
            value: `${raw.portionsSold.toLocaleString('id-ID')} porsi`,
            sourceNote: 'Akumulasi porsi terjual minggu ini',
          },
          {
            label: `Baseline & Target (−${targetPct}%)`,
            value: `Baseline ${formatNum(packagingCal.baseline, 2)} → Target ${formatNum(packagingCal.target, 2)} pcs/porsi`,
            sourceNote: 'Rata-rata 4 minggu kalibrasi',
          },
        ],
        assumptions: [
          'Biaya rata-rata kemasan sekali pakai diestimasi Rp 350/pcs bila tidak dirinci per item.',
        ],
      },
    };

    const greenScoreProvenance = {
      title: 'Skor Hijau Mingguan',
      finalValueFormatted: `${greenScore} / 100`,
      formulaText: `${formatNum(weights.waste * 100, 0)}% Skor Sisa Bahan + ${formatNum(weights.energy * 100, 0)}% Skor Energi + ${formatNum(weights.water * 100, 0)}% Skor Air + ${formatNum(weights.packaging * 100, 0)}% Skor Kemasan`,
      inputs: [
        {
          label: `Sisa Bahan (bobot ${Math.round(weights.waste * 100)}%)`,
          value: `Skor ${Math.round(wasteScore)} (aktual ${formatNum(intensities.wastePct, 1)}% vs target ${formatNum(wasteCal.target, 1)}%)`,
          sourceNote: 'Rumus: 50 + 50 × (baseline − aktual) / (baseline × t)',
        },
        {
          label: `Energi Listrik & LPG (bobot ${Math.round(weights.energy * 100)}%)`,
          value: `Skor ${Math.round(energyScore)}`,
          sourceNote: `Listrik ${formatNum(intensities.electricityPerPortion, 3)} kWh/porsi, LPG ${formatNum(intensities.gasPerPortion, 3)} kg/porsi`,
        },
        {
          label: `Air Bersih (bobot ${Math.round(weights.water * 100)}%)`,
          value: `Skor ${Math.round(waterScore)} (${formatNum(intensities.waterPerPortion, 4)} m³/porsi)`,
          sourceNote: 'Dibandingkan rata-rata 4 minggu kalibrasi',
        },
        {
          label: `Kemasan Sekali Pakai (bobot ${Math.round(weights.packaging * 100)}%)`,
          value: `Skor ${Math.round(packagingScore)} (${formatNum(intensities.packagingPerPortion, 2)} pcs/porsi)`,
          sourceNote: 'Dibandingkan rata-rata 4 minggu kalibrasi',
        },
      ],
      assumptions: [
        'Skor 50 berarti sama dengan rata-rata 4 minggu awal (baseline).',
        `Skor 100 berarti mencapai atau melampaui target penghematan ${targetPct}%.`,
        'Estimasi internal warung, bukan sertifikasi hijau resmi.',
      ],
    };

    const recommendations = generateRecommendations({
      raw,
      wasteMetric: wasteDimension,
      energyMetric: energyDimension,
      waterMetric: waterDimension,
      packagingMetric: packagingDimension,
      tariffs,
      savedStatuses: recommendationStatuses,
    });

    return {
      weekStart: raw.weekStart,
      weekLabel: raw.weekLabel,
      raw,
      intensities,
      dataConfidence,
      greenScore,
      greenScoreSummary: getGreenScoreSummary(greenScore, hasData),
      greenScoreProvenance,
      dimensions: {
        waste: wasteDimension,
        energy: energyDimension,
        water: waterDimension,
        packaging: packagingDimension,
      },
      electricityIntensity: electricityDimension,
      gasIntensity: gasDimension,
      avoidableCost,
      emissions,
      totalMeasuredSavingsIdr,
      productionChangedOver20Pct: elecSavings.productionChangedOver20Pct,
      baselinePortionsAvg: Math.round(baselinePortionsAvg),
      recommendations,
    };
  });
}
