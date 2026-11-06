import { describe, expect, it } from 'vitest';
import {
  buildWeeklyRawTotals,
  generateWarungBuAniDataset,
} from './warungBuAni';
import { computeAllWeeklyReports } from '@/lib/calc';

describe('Warung Bu Ani 8-Week Demo Dataset & Report Pipeline', () => {
  it('generates 8 weeks of realistic non-linear data with improving Green Score', () => {
    const dataset = generateWarungBuAniDataset();
    expect(dataset.dailyLogs).toHaveLength(56); // 8 weeks * 7 days
    expect(dataset.utilityReadings).toHaveLength(8);
    expect(
      dataset.emissionFactors.every((f) => f.is_placeholder === true)
    ).toBe(true);

    const weeklyRaw = buildWeeklyRawTotals({
      dailyLogs: dataset.dailyLogs,
      utilityReadings: dataset.utilityReadings,
      transactions: dataset.transactions,
    });

    expect(weeklyRaw).toHaveLength(8);

    const reports = computeAllWeeklyReports({
      weeklyRawList: weeklyRaw,
      targetPct: dataset.business.target_pct,
      weights: dataset.business.weights,
      tariffs: dataset.business.tariffs,
      emissionFactors: dataset.emissionFactors,
    });

    expect(reports).toHaveLength(8);

    // Calibration weeks 1-4 average waste is around 8.0%
    const week1 = reports[0];
    const week6 = reports[5];
    const week5 = reports[4];
    const week8 = reports[7];

    expect(week1.dimensions.waste.baseline).toBeGreaterThan(7.8);
    expect(week1.dimensions.waste.baseline).toBeLessThan(8.2);

    // Realistic variation: Week 6 has a rainy-day bump compared to Week 5 (not a fake smooth curve)
    expect(week6.intensities.wastePct).toBeGreaterThan(
      week5.intensities.wastePct
    );

    // Overall strong improvement by Week 8
    expect(week8.greenScore).toBeGreaterThanOrEqual(80);
    expect(week8.dataConfidence).toBe('tinggi');
    expect(week8.totalMeasuredSavingsIdr).toBeGreaterThan(0);
    expect(week8.recommendations.length).toBeGreaterThan(0);
    expect(week8.recommendations.length).toBeLessThanOrEqual(3);
  });
});
