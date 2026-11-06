import { describe, expect, it } from 'vitest';
import {
  calculateAvoidableCost,
  calculateBaselineAndTarget,
  calculateDataConfidence,
  calculateDimensionScore,
  calculateEmissions,
  calculateGreenScore,
  calculateIntensities,
  calculateMeasuredSavings,
  computeAllWeeklyReports,
  isConsecutiveAlert,
} from './index';
import { BusinessTariffs, EmissionFactorRecord, WeeklyRawTotals } from '@/types';

const DEFAULT_TARIFFS: BusinessTariffs = {
  electricity_per_kwh: 1445,
  lpg_per_kg: 7333,
  water_per_m3: 7500,
  used_oil_price_per_liter: 6500,
  avg_ingredient_cost_per_kg: 18000,
};

const DEFAULT_FACTORS: EmissionFactorRecord[] = [
  {
    id: 'ef-1',
    key: 'electricity_grid_id',
    label: 'Listrik PLN',
    value: 0.85,
    unit: 'kg CO2e / kWh',
    source: 'PLACEHOLDER, ganti dengan sumber resmi',
    version: 1,
    valid_from: '2025-01-01',
    is_placeholder: true,
  },
  {
    id: 'ef-2',
    key: 'lpg_combustion',
    label: 'Gas LPG',
    value: 3.0,
    unit: 'kg CO2e / kg LPG',
    source: 'PLACEHOLDER, ganti dengan sumber resmi',
    version: 1,
    valid_from: '2025-01-01',
    is_placeholder: true,
  },
];

describe('EcoBiz Deterministic Calculations (lib/calc)', () => {
  it('verifies mandatory test case: baseline 8%, target 7.2% (t=10%), actual 7.6% produces score 75', () => {
    const { baseline, target } = calculateBaselineAndTarget([8, 8, 8, 8], 10);
    expect(baseline).toBeCloseTo(8.0, 5);
    expect(target).toBeCloseTo(7.2, 5);

    const score = calculateDimensionScore(baseline, 7.6, 10, true);
    expect(score).toBe(75);
  });

  it('clamps dimension score between 0 and 100', () => {
    // Better than target (actual = 6.0 when target is 7.2) => clamped at 100
    expect(calculateDimensionScore(8.0, 6.0, 10, true)).toBe(100);
    // Worse than baseline by more than t (actual = 9.5 when baseline = 8.0, t = 10%) => clamped at 0
    expect(calculateDimensionScore(8.0, 9.5, 10, true)).toBe(0);
    // Equal to baseline => 50
    expect(calculateDimensionScore(8.0, 8.0, 10, true)).toBe(50);
  });

  it('handles zero denominator cases safely without NaN or Infinity', () => {
    const zeroRaw: WeeklyRawTotals = {
      weekStart: '2026-10-05',
      weekLabel: 'Minggu Kosong',
      daysLogged: 0,
      portionsSold: 0,
      electricityKwh: 25,
      gasKg: 6,
      waterM3: 1.2,
      wasteKg: 2,
      ingredientsUsedKg: 0,
      singleUsePackagingCount: 50,
      usedOilLiters: 1.5,
      unsoldOilLiters: 1.5,
      salesIdr: 0,
      purchaseIdr: 0,
    };

    const intensities = calculateIntensities(zeroRaw);
    expect(intensities.hasZeroDenominator).toBe(true);
    expect(intensities.electricityPerPortion).toBe(0);
    expect(intensities.gasPerPortion).toBe(0);
    expect(intensities.waterPerPortion).toBe(0);
    expect(intensities.packagingPerPortion).toBe(0);
    expect(intensities.wastePct).toBe(0);
    expect(Number.isNaN(intensities.wastePct)).toBe(false);
  });

  it('handles week without data gracefully', () => {
    const emptyWeek: WeeklyRawTotals = {
      weekStart: '2026-10-12',
      weekLabel: 'Minggu Tanpa Data',
      daysLogged: 0,
      portionsSold: 0,
      electricityKwh: 0,
      gasKg: 0,
      waterM3: 0,
      wasteKg: 0,
      ingredientsUsedKg: 0,
      singleUsePackagingCount: 0,
      usedOilLiters: 0,
      unsoldOilLiters: 0,
      salesIdr: 0,
      purchaseIdr: 0,
    };

    const reports = computeAllWeeklyReports({
      weeklyRawList: [emptyWeek],
      targetPct: 10,
      weights: { waste: 0.3, energy: 0.3, water: 0.2, packaging: 0.2 },
      tariffs: DEFAULT_TARIFFS,
      emissionFactors: DEFAULT_FACTORS,
    });

    expect(reports).toHaveLength(1);
    expect(reports[0].dataConfidence).toBe('rendah');
    expect(reports[0].greenScore).toBe(0);
    expect(reports[0].avoidableCost.totalAvoidableCostIdr).toBe(0);
    expect(reports[0].emissions.totalCo2Kg).toBe(0);
  });

  it('calculates weighted Green Score accurately with default and custom weights', () => {
    const scoreDefault = calculateGreenScore(
      { waste: 80, energy: 70, water: 60, packaging: 90 },
      { waste: 0.3, energy: 0.3, water: 0.2, packaging: 0.2 },
      true
    );
    // 0.3*80 (24) + 0.3*70 (21) + 0.2*60 (12) + 0.2*90 (18) = 75
    expect(scoreDefault).toBe(75);
  });

  it('calculates avoidable environmental cost accurately', () => {
    const cost = calculateAvoidableCost({
      wasteKg: 4, // 4 * 18,000 = 72,000
      unsoldOilLiters: 3, // 3 * 6,500 = 19,500
      portionsSold: 1000,
      actualIntensities: {
        electricityPerPortion: 0.05, // excess 0.01 * 1000 * 1445 = 14,450
        gasPerPortion: 0.02, // no excess
        waterPerPortion: 0.002, // no excess
        packagingPerPortion: 1.0, // no excess
      },
      targetIntensities: {
        electricityPerPortion: 0.04,
        gasPerPortion: 0.025,
        waterPerPortion: 0.0025,
        packagingPerPortion: 1.1,
      },
      tariffs: DEFAULT_TARIFFS,
    });

    expect(cost.wastedIngredientsCostIdr).toBe(72000);
    expect(cost.unsoldUsedOilRevenueIdr).toBe(19500);
    expect(cost.excessResourceCostIdr).toBe(14450);
    expect(cost.totalAvoidableCostIdr).toBe(105950);
  });

  it('calculates emissions and preserves placeholder flag', () => {
    const emissions = calculateEmissions({
      electricityKwh: 100, // 100 * 0.85 = 85
      gasKg: 12, // 12 * 3.0 = 36
      factors: DEFAULT_FACTORS,
    });

    expect(emissions.electricityCo2Kg).toBe(85);
    expect(emissions.lpgCo2Kg).toBe(36);
    expect(emissions.totalCo2Kg).toBe(121);
    expect(emissions.isPlaceholder).toBe(true);
  });

  it('calculates measured savings and flags >20% portion volume change', () => {
    const result = calculateMeasuredSavings({
      baselineIntensity: 0.06,
      actualIntensity: 0.05,
      portionsSold: 1300, // +30% vs 1000 baseline
      baselinePortionsAvg: 1000,
      unitTariffIdr: 1445,
    });

    // (0.06 - 0.05) * 1300 * 1445 = 13 * 1445 = 18785
    expect(result.savingsIdr).toBe(18785);
    expect(result.productionChangedOver20Pct).toBe(true);
  });

  it('triggers warning when intensity exceeds target * 1.1 for two consecutive periods', () => {
    const target = 10; // threshold = 11
    expect(isConsecutiveAlert(11.5, 11.2, target)).toBe(true);
    expect(isConsecutiveAlert(11.5, 10.8, target)).toBe(false);
    expect(isConsecutiveAlert(10.5, 12.0, target)).toBe(false);
  });

  it('assigns data confidence levels based on days logged', () => {
    expect(calculateDataConfidence(7)).toBe('tinggi');
    expect(calculateDataConfidence(6)).toBe('tinggi');
    expect(calculateDataConfidence(5)).toBe('sedang');
    expect(calculateDataConfidence(4)).toBe('sedang');
    expect(calculateDataConfidence(3)).toBe('rendah');
    expect(calculateDataConfidence(0)).toBe('rendah');
  });
});
