'use client';

import React, { useState } from 'react';
import {
  BusinessProfile,
  MetricProvenance,
  WeeklyReportComputed,
} from '@/types';
import { formatIdr, formatNum } from '@/lib/calc';
import { GreenScoreStamp } from '@/components/report/GreenScoreStamp';
import {
  MetricSparkline,
  MinimalTrendChart,
} from '@/components/report/MinimalTrendChart';
import { PillSelect } from '@/components/ui/PillSelect';
import { Printer, Download, HelpCircle, Check, ArrowRight } from 'lucide-react';

interface WeeklyReportViewProps {
  business: BusinessProfile;
  reports: WeeklyReportComputed[];
  onInspectProvenance: (p: MetricProvenance) => void;
  onUpdateRecommendationStatus: (
    ruleId: string,
    status: 'applied' | 'dismissed'
  ) => Promise<void>;
}

export function WeeklyReportView({
  business,
  reports,
  onInspectProvenance,
  onUpdateRecommendationStatus,
}: WeeklyReportViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    Math.max(0, reports.length - 1)
  );
  const [activeChartMetric, setActiveChartMetric] = useState<
    'greenScore' | 'wastePct' | 'gasPerPortion' | 'packagingPerPortion'
  >('wastePct');

  const safeIndex = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, reports.length - 1)
  );
  const current = reports[safeIndex];

  if (!current) {
    return (
      <div className="nota-card p-7 text-center">
        <h2 className="font-serif text-2xl font-bold text-[var(--ink)]">
          Belum Ada Rapor Mingguan
        </h2>
        <p className="text-sm text-[#808080] mt-1">
          Mulai catat penjualan dan sisa bahan harian untuk melihat Skor Hijau warung Anda.
        </p>
      </div>
    );
  }

  /**
   * Export all weekly reports to CSV
   */
  const handleExportCsv = () => {
    const headers = [
      'Minggu Mulai',
      'Label Minggu',
      'Hari Tercatat',
      'Kepercayaan Data',
      'Porsi Terjual (P)',
      'Skor Hijau',
      'Sisa Bahan (%)',
      'Listrik (kWh)',
      'Listrik per Porsi (kWh/porsi)',
      'Gas LPG (kg)',
      'Gas per Porsi (kg/porsi)',
      'Air (m3)',
      'Kemasan Sekali Pakai (pcs)',
      'Jelantah (Liter)',
      'Biaya Lingkungan Bisa Dikurangi (Rp)',
      'Penghematan Terukur vs Baseline (Rp)',
      'Estimasi Emisi (kg CO2e)',
      'Status Faktor Emisi',
    ];

    const rows = reports.map((r) => [
      r.weekStart,
      `"${r.weekLabel}"`,
      r.raw.daysLogged,
      r.dataConfidence,
      r.raw.portionsSold,
      r.greenScore,
      r.intensities.wastePct.toFixed(2),
      r.raw.electricityKwh.toFixed(2),
      r.intensities.electricityPerPortion.toFixed(4),
      r.raw.gasKg.toFixed(2),
      r.intensities.gasPerPortion.toFixed(4),
      r.raw.waterM3.toFixed(3),
      r.raw.singleUsePackagingCount,
      r.raw.usedOilLiters.toFixed(2),
      r.avoidableCost.totalAvoidableCostIdr,
      r.totalMeasuredSavingsIdr,
      r.emissions.totalCo2Kg.toFixed(2),
      r.emissions.isPlaceholder
        ? '"PLACEHOLDER - Faktor Ilustrasi"'
        : '"Sumber Resmi"',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan-EcoBiz-${business.name.replace(/\s+/g, '-')}-${current.weekStart}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wasteSeries = reports.map((r) => r.intensities.wastePct);
  const energySeries = reports.map((r) => r.intensities.gasPerPortion);
  const waterSeries = reports.map((r) => r.intensities.waterPerPortion);
  const packagingSeries = reports.map((r) => r.intensities.packagingPerPortion);

  return (
    <div className="space-y-5">
      {/* Top Pill Header Bar: Week Selector + PDF / CSV Export Pills */}
      <div className="apple-stagger-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full border border-[#2E2E2E] text-xs font-medium text-[#808080]">
            Rapor Mingguan
          </span>
          <PillSelect
            ariaLabel="Pilih minggu laporan"
            value={String(safeIndex)}
            align="left"
            options={reports.map((r, idx) => ({
              value: String(idx),
              label: `${r.weekLabel} — Skor ${r.greenScore}`,
            }))}
            onChange={(val) => setSelectedIndex(Number(val))}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="apple-press min-h-[42px] px-4 py-2 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[var(--ink)] inline-flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / PDF
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            data-testid="btn-export-csv"
            className="apple-press min-h-[42px] px-4 py-2 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold inline-flex items-center gap-1.5 hover:brightness-105 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Simpan CSV
          </button>
        </div>
      </div>

      {/* 1. GREEN SCORE BENTO STAMP */}
      <div className="apple-stagger-2">
        <GreenScoreStamp
          score={current.greenScore}
          summary={current.greenScoreSummary}
          dataConfidence={current.dataConfidence}
          daysLogged={current.raw.daysLogged}
          provenance={current.greenScoreProvenance}
          onInspectProvenance={onInspectProvenance}
        />
      </div>

      {/* 2. FOUR CORE RESOURCE INTENSITY METRICS (Image 1 Style Bento Cards with Pill Tags) */}
      <div className="apple-stagger-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {/* Metric 1: Sisa Bahan % */}
        <div className="nota-card nota-card-interactive p-5 flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 nota-ReceiptDivider">
              <span className="font-serif text-lg text-[var(--ink)]">
                Sisa Adonan &amp; Bahan
              </span>
              <span className="text-xs text-[#808080]">
                Skor {Math.round(current.dimensions.waste.score)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="font-sans text-3xl font-bold text-[var(--ink)] tabular-nums">
                {formatNum(current.dimensions.waste.actual, 2)}%
              </div>
              <MetricSparkline values={wasteSeries} color="#C7FF2E" />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bento-pill-tag">
                Biasanya {formatNum(current.dimensions.waste.baseline, 1)}%
              </span>
              <span className="bento-pill-tag">
                Target {formatNum(current.dimensions.waste.target, 1)}%
              </span>
              <span className="bento-pill-tag">
                {formatNum(current.raw.wasteKg, 1)} kg sisa
              </span>
            </div>

            {current.dimensions.waste.alertConsecutiveTwoWeeks && (
              <div className="mt-3 px-3 py-1.5 rounded-full bg-[#FF5A36]/15 text-[11px] font-medium text-[#FF5A36]">
                2 minggu berturut-turut sisa adonan agak banyak
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onInspectProvenance(current.dimensions.waste.provenance)
            }
            className="apple-press pt-2 flex items-center justify-between text-xs font-medium text-[#C7FF2E] hover:underline cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Dari mana angka ini?
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 2: Energi per Porsi (Electric Lime Accent Bento Card) */}
        <div className="bento-lime bento-lime-interactive p-5 flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 nota-ReceiptDivider">
              <span className="font-serif text-lg text-[#0F0F0F]">
                Gas &amp; Listrik per Porsi
              </span>
              <span className="text-xs font-medium text-[#0F0F0F]/75">
                Skor {Math.round(current.dimensions.energy.score)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="font-sans text-xl sm:text-2xl font-bold text-[#0F0F0F] tabular-nums leading-tight">
                {formatNum(current.intensities.gasPerPortion * 1000, 1)} g LPG
                &amp; {formatNum(current.intensities.electricityPerPortion, 3)}{' '}
                kWh
              </div>
              <MetricSparkline values={energySeries} color="#0F0F0F" />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bento-pill-tag">
                Total gas {formatNum(current.raw.gasKg, 1)} kg
              </span>
              <span className="bento-pill-tag">
                Listrik {formatNum(current.raw.electricityKwh, 1)} kWh
              </span>
              <span className="bento-pill-tag">Per porsi</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onInspectProvenance(current.dimensions.energy.provenance)
            }
            className="apple-press pt-2 flex items-center justify-between text-xs font-semibold text-[#0F0F0F] hover:underline cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Dari mana angka ini?
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 3: Intensitas Air (A / P) */}
        <div className="nota-card nota-card-interactive p-5 flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 nota-ReceiptDivider">
              <span className="font-serif text-lg text-[var(--ink)]">
                Air Cuci &amp; Masak
              </span>
              <span className="text-xs text-[#808080]">
                Skor {Math.round(current.dimensions.water.score)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="font-sans text-3xl font-bold text-[var(--ink)] tabular-nums">
                {formatNum(current.intensities.waterPerPortion * 1000, 2)} L
              </div>
              <MetricSparkline values={waterSeries} color="#C7FF2E" />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bento-pill-tag">
                Total {formatNum(current.raw.waterM3, 2)} m³
              </span>
              <span className="bento-pill-tag">
                Target {formatNum(current.dimensions.water.target * 1000, 2)} L/porsi
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onInspectProvenance(current.dimensions.water.provenance)
            }
            className="apple-press pt-2 flex items-center justify-between text-xs font-medium text-[#C7FF2E] hover:underline cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Dari mana angka ini?
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 4: Kemasan Sekali Pakai (K / P) */}
        <div className="nota-card nota-card-interactive p-5 flex flex-col justify-between space-y-4 h-full">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 nota-ReceiptDivider">
              <span className="font-serif text-lg text-[var(--ink)]">
                Kresek &amp; Bungkus
              </span>
              <span className="text-xs text-[#808080]">
                Skor {Math.round(current.dimensions.packaging.score)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="font-sans text-3xl font-bold text-[var(--ink)] tabular-nums">
                {formatNum(current.intensities.packagingPerPortion, 2)}{' '}
                <span className="text-xs font-normal text-[#808080]">
                  lbr/porsi
                </span>
              </div>
              <MetricSparkline values={packagingSeries} color="#C7FF2E" />
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bento-pill-tag">
                Biasanya {formatNum(current.dimensions.packaging.baseline, 2)}
              </span>
              <span className="bento-pill-tag">
                Target {formatNum(current.dimensions.packaging.target, 2)}
              </span>
              <span className="bento-pill-tag">
                {current.raw.singleUsePackagingCount.toLocaleString('id-ID')} lbr
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onInspectProvenance(current.dimensions.packaging.provenance)
            }
            className="apple-press pt-2 flex items-center justify-between text-xs font-medium text-[#C7FF2E] hover:underline cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Dari mana angka ini?
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. ENVIRONMENTAL COST BREAKDOWN, MEASURED SAVINGS & EMISSIONS */}
      <div className="apple-stagger-4 nota-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 nota-ReceiptDivider">
          <div>
            <span className="text-xs text-[#808080]">
              Rincian uang dapur minggu ini
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
              Uang yang Bisa Diselamatkan
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onInspectProvenance(current.avoidableCost.provenance)}
            className="apple-press px-4 py-2 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[#C7FF2E] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Dari mana angka ini?
          </button>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="nota-leader-row">
            <span className="text-[#808080]">
              Sisa adonan/bahan yang terbuang ({formatNum(current.raw.wasteKg, 1)} kg)
            </span>
            <span className="nota-leader-dots" />
            <span className="font-mono font-semibold text-[var(--ink)]">
              {formatIdr(current.avoidableCost.wastedIngredientsCostIdr)}
            </span>
          </div>

          <div className="nota-leader-row">
            <span className="text-[#808080]">
              Minyak jelantah yang belum diuangkan ({formatNum(current.raw.unsoldOilLiters, 1)} L)
            </span>
            <span className="nota-leader-dots" />
            <span className="font-mono font-semibold text-[var(--ink)]">
              {formatIdr(current.avoidableCost.unsoldUsedOilRevenueIdr)}
            </span>
          </div>

          <div className="nota-leader-row">
            <span className="text-[#808080]">
              Pemakaian gas, listrik &amp; plastik di atas target
            </span>
            <span className="nota-leader-dots" />
            <span className="font-mono font-semibold text-[var(--ink)]">
              {formatIdr(current.avoidableCost.excessResourceCostIdr)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div className="p-4 rounded-2xl bg-[var(--bg-paper-subtle)] flex items-center justify-between">
              <span className="text-xs text-[#808080]">
                Masih bisa dihemat lagi
              </span>
              <span className="font-mono text-base font-bold text-[#FF5A36]">
                {formatIdr(current.avoidableCost.totalAvoidableCostIdr)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-between">
              <span className="text-xs font-medium">
                Sudah berhasil dihemat
              </span>
              <span className="font-mono text-base font-bold">
                {current.totalMeasuredSavingsIdr >= 0 ? '+' : ''}
                {formatIdr(current.totalMeasuredSavingsIdr)}
              </span>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#808080]">
                Perkiraan jejak asap dapur (Listrik + LPG)
              </span>
              {current.emissions.isPlaceholder && (
                <span className="bento-pill-tag text-[11px]">
                  Faktor ilustrasi (PLACEHOLDER)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onInspectProvenance(current.emissions.provenance)}
              className="font-mono text-xs font-semibold text-[#C7FF2E] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{formatNum(current.emissions.totalCo2Kg, 1)} kg CO₂e</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. ACTIONABLE RECOMMENDATIONS (Max 3 Bento Cards) */}
      <div className="nota-card p-6">
        <div className="flex items-center justify-between pb-4 mb-4 nota-ReceiptDivider">
          <h3 className="font-serif text-xl sm:text-2xl text-[var(--ink)]">
            Langkah Kecil Biar Minggu Depan Lebih Irit
          </h3>
          <span className="text-xs text-[#808080]">Saran praktis</span>
        </div>

        <div className="space-y-3">
          {current.recommendations.map((rec) => (
            <div
              key={rec.ruleId}
              className="p-4 rounded-[22px] bg-[var(--bg-paper-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-lg text-[var(--ink)]">
                    {rec.title}
                  </span>
                  {rec.status === 'applied' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-[11px] font-medium inline-flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Sudah dicoba
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#808080]">{rec.reasonText}</p>
                <p className="text-xs sm:text-sm font-medium text-[var(--ink)]">
                  Tips: {rec.actionText}
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-[11px] text-[#808080]">
                    Bisa hemat sekitar
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#C7FF2E]">
                    ~{formatIdr(rec.estimatedWeeklySavingsIdr)}/mgg
                  </div>
                </div>
                {rec.status !== 'applied' && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateRecommendationStatus(rec.ruleId, 'applied')
                    }
                    className="apple-press min-h-[38px] px-4 py-1.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold cursor-pointer"
                  >
                    Sudah dicoba
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 8-WEEK DIRECT-LABELED TREND CHART */}
      <div className="nota-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 nota-ReceiptDivider">
          <div>
            <span className="text-xs text-[#808080]">Catatan 8 minggu terakhir</span>
            <h3 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
              Perkembangan Dapur dari Minggu ke Minggu
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5 no-print">
            {(
              [
                { id: 'wastePct', label: 'Sisa Adonan' },
                { id: 'gasPerPortion', label: 'Gas / Porsi' },
                { id: 'packagingPerPortion', label: 'Kresek / Porsi' },
                { id: 'greenScore', label: 'Skor Hijau' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartMetric(tab.id)}
                className={`apple-press min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeChartMetric === tab.id
                    ? 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                    : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeChartMetric === 'wastePct' && (
          <MinimalTrendChart
            title="Persentase Sisa Adonan & Bahan"
            subtitle="Makin turun garisnya, makin sedikit bahan yang terbuang percuma"
            unit="%"
            points={reports.map((r) => ({
              label: r.weekLabel,
              value: r.intensities.wastePct,
            }))}
            baseline={current.dimensions.waste.baseline}
            target={current.dimensions.waste.target}
            decimals={2}
            highlightColor="#C7FF2E"
          />
        )}

        {activeChartMetric === 'gasPerPortion' && (
          <MinimalTrendChart
            title="Takaran Gas LPG per Porsi"
            subtitle="Makin rendah angkanya, makin awet tabung gas di dapur"
            unit="g/porsi"
            points={reports.map((r) => ({
              label: r.weekLabel,
              value: r.intensities.gasPerPortion * 1000,
            }))}
            baseline={current.gasIntensity.baseline * 1000}
            target={current.gasIntensity.target * 1000}
            decimals={1}
            highlightColor="#C7FF2E"
          />
        )}

        {activeChartMetric === 'packagingPerPortion' && (
          <MinimalTrendChart
            title="Pemakaian Kresek & Bungkus per Porsi"
            subtitle="Makin turun angkanya, makin irit belanja plastik mingguan"
            unit="lbr/porsi"
            points={reports.map((r) => ({
              label: r.weekLabel,
              value: r.intensities.packagingPerPortion,
            }))}
            baseline={current.dimensions.packaging.baseline}
            target={current.dimensions.packaging.target}
            decimals={2}
            highlightColor="#C7FF2E"
          />
        )}

        {activeChartMetric === 'greenScore' && (
          <MinimalTrendChart
            title="Perjalanan Skor Hijau Warungmu"
            subtitle="Angka 50 adalah kebiasaan awal, angka 80+ artinya target hemat tercapai"
            unit="poin"
            points={reports.map((r) => ({
              label: r.weekLabel,
              value: r.greenScore,
            }))}
            baseline={50}
            target={80}
            decimals={0}
            highlightColor="#C7FF2E"
          />
        )}
      </div>
    </div>
  );
}
