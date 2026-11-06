'use client';

import React, { useState } from 'react';
import {
  BusinessProfile,
  DailyLogRecord,
  MetricProvenance,
  TransactionRecord,
  WeeklyReportComputed,
} from '@/types';
import { formatIdr, formatNum } from '@/lib/calc';
import {
  BaskomIllustration,
  JerikenIllustration,
} from '@/components/illustrations/WarungIcons';
import { ArrowRight, Check, Star, HelpCircle } from 'lucide-react';

interface HomeTodayViewProps {
  business: BusinessProfile;
  todayLog: DailyLogRecord | null;
  todayTransactions: TransactionRecord[];
  latestReport: WeeklyReportComputed | null;
  defaultWasteUnit: 'kg' | 'baskom' | 'porsi';
  onOpenCatat: (templateText?: string) => void;
  onSaveDailyLog: (partial: {
    portions_sold?: number;
    waste_amount?: number;
    waste_unit?: 'kg' | 'baskom' | 'porsi';
    used_oil_liters?: number;
    oil_sold?: boolean;
  }) => Promise<void>;
  onOpenReport: () => void;
  onInspectProvenance: (p: MetricProvenance) => void;
}

export function HomeTodayView({
  business,
  todayLog,
  todayTransactions,
  latestReport,
  defaultWasteUnit,
  onOpenCatat,
  onSaveDailyLog,
  onOpenReport,
  onInspectProvenance,
}: HomeTodayViewProps) {
  const [skippedWasteCard, setSkippedWasteCard] = useState(false);
  const [skippedOilCard, setSkippedOilCard] = useState(false);

  const [portionsInput, setPortionsInput] = useState<string>(
    String(todayLog?.portions_sold ?? 330)
  );
  const [wasteInput, setWasteInput] = useState<string>(
    String(todayLog?.waste_amount ?? 0.5)
  );
  const [wasteUnit, setWasteUnit] = useState<'kg' | 'baskom' | 'porsi'>(
    (todayLog?.waste_unit as 'kg' | 'baskom' | 'porsi') || defaultWasteUnit
  );
  const [oilInput, setOilInput] = useState<string>(
    String(todayLog?.used_oil_liters ?? 0.5)
  );
  const [oilSold, setOilSold] = useState<boolean>(todayLog?.oil_sold ?? false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const todaySalesIdr = todayTransactions
    .filter((t) => t.type === 'sale')
    .reduce((acc, t) => acc + t.amount_idr, 0);

  const todayPurchasesIdr = todayTransactions
    .filter((t) => t.type === 'purchase' || t.type === 'utility')
    .reduce((acc, t) => acc + t.amount_idr, 0);

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2600);
  };

  return (
    <div className="space-y-5">
      {savedNotice && (
        <div
          role="status"
          className="dynamic-island-toast px-5 py-3.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg shadow-[#C7FF2E]/25"
        >
          <span>{savedNotice}</span>
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* 1. Large Manjari Greeting + Circular Lime Avatar (Exact Specification from Image 2) */}
      <div className="flex items-start justify-between gap-4 pt-1 apple-stagger-1">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[var(--ink)] leading-[1.06] tracking-tight">
            Halo,
            <br />
            {business.name}
          </h1>
          <p className="text-sm font-medium text-[var(--ink-muted)] mt-2.5">
            Kondisi dapur hari ini •{' '}
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReport}
          aria-label="Buka Rapor Hijau"
          className="w-14 h-14 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex flex-col items-center justify-center shrink-0 apple-press hover:scale-105 shadow-lg shadow-[#C7FF2E]/20 cursor-pointer"
        >
          <span className="font-mono text-base font-bold leading-none">
            {latestReport?.greenScore ?? 50}
          </span>
          <span className="text-[10px] font-medium">
            poin
          </span>
        </button>
      </div>

      {/* 2. Dark Grid Canvas Visual Card with Animated Lime Trajectory Pin & White Pill Button */}
      <div className="bento-grid-canvas p-6 sm:p-7 min-h-[228px] flex flex-col justify-between apple-stagger-2">
        <div className="flex items-center justify-between gap-2">
          <span className="bento-pill-tag bg-[#222226] text-white border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#C7FF2E] animate-pulse" />
            Arah hemat minggu ini
          </span>
          <span className="text-xs font-mono text-[#8E8E93]">
            Sisa adonan:{' '}
            {formatNum(latestReport?.intensities.wastePct ?? 4.2, 1)}%
          </span>
        </div>

        {/* Visual Route SVG (White start dot -> Animated Lime path -> Floating Lime Location Pin) */}
        <div className="my-4 relative">
          <svg
            viewBox="0 0 420 96"
            className="w-full h-24 overflow-visible"
            aria-hidden="true"
          >
            {/* Subtle background grid roads */}
            <path
              d="M 10 80 Q 120 20, 260 65 T 410 30"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
            {/* Start label */}
            <text
              x="44"
              y="52"
              fill="#FFFFFF"
              fontSize="11"
              className="font-sans"
              opacity="0.85"
            >
              Minggu awal (50)
            </text>
            {/* Lime destination label */}
            <text
              x="292"
              y="12"
              fill="#C7FF2E"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="font-sans"
            >
              Minggu ini ({latestReport?.greenScore ?? 82} poin)
            </text>
            {/* Animated Glowing Lime Route Line */}
            <path
              d="M 56 66 L 276 66 Q 292 66 292 50 L 292 42"
              fill="none"
              stroke="#C7FF2E"
              strokeWidth="3.2"
              strokeLinecap="round"
              className="route-path-anim"
            />
            {/* White start dot */}
            <circle cx="56" cy="66" r="4.5" fill="#FFFFFF" />
            {/* Lime target dot */}
            <circle cx="292" cy="42" r="4.5" fill="#C7FF2E" />
            {/* Floating Lime Teardrop Pin above target dot */}
            <g className="pin-float-anim" transform="translate(292, 26)">
              <circle cx="0" cy="-4" r="13" fill="#C7FF2E" />
              <path d="M -9 3 L 0 15 L 9 3 Z" fill="#C7FF2E" />
              <circle cx="0" cy="-4" r="5" fill="#0F0F0F" />
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                label: 'Belanja pasar',
                tpl: 'Beli tepung & minyak goreng 5 liter 85 ribu',
              },
              {
                label: 'Beli token',
                tpl: 'Bayar token listrik 50 ribu',
              },
              {
                label: 'Tukar gas 3kg',
                tpl: 'Beli gas LPG 3kg 2 tabung 44 ribu',
              },
              {
                label: 'Hasil jualan',
                tpl: 'Jualan hari ini 340 porsi 680 ribu',
              },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => onOpenCatat(q.tpl)}
                className="px-3.5 py-1.5 rounded-full bg-[#222226] hover:bg-[#C7FF2E] hover:text-[#0F0F0F] text-white text-xs font-medium apple-press cursor-pointer"
              >
                + {q.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-6 py-2.5 rounded-full bg-white text-[#0F0F0F] font-semibold text-xs sm:text-sm apple-press hover:scale-105 cursor-pointer"
          >
            Lihat Rapor
          </button>
        </div>
      </div>

      {/* 3. Full-Width Electric Lime Pill CTA (Exact Match to Image 2 "Book a ride") */}
      <button
        type="button"
        data-testid="btn-hero-catat"
        onClick={() => onOpenCatat()}
        className="w-full p-5 pl-7 pill-cta-lime flex items-center justify-between gap-4 text-left apple-stagger-3 cursor-pointer"
      >
        <div>
          <div className="font-serif text-xl sm:text-2xl text-[#0F0F0F] leading-tight">
            Buka Kasir POS atau Catat Belanja
          </div>
          <div className="text-xs sm:text-sm text-[#0F0F0F]/70 font-medium mt-0.5">
            Kasir jualan 1-ketuk, didikte suara, atau foto nota multi-barang
          </div>
        </div>
        <div className="cta-arrow-circle w-12 h-12 rounded-full bg-[#0F0F0F] text-white flex items-center justify-center shrink-0">
          <ArrowRight className="w-5 h-5" />
        </div>
      </button>

      {/* 4. Dual Pill Stat Cards (Exact Match to Image 2 "12 Rides taken" & "★ 320 pts Rewards") */}
      <div className="grid grid-cols-2 gap-4 apple-stagger-3">
        {/* Left Stat Pill */}
        <div className="nota-card nota-card-interactive rounded-[32px] p-5 sm:p-6 flex flex-col justify-center">
          <div className="font-sans text-3xl sm:text-4xl font-bold text-[var(--ink)] tracking-tight tabular-nums">
            {(latestReport?.raw.portionsSold ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[var(--ink-muted)] font-medium mt-1">
            Porsi laku minggu ini
          </div>
        </div>

        {/* Right Stat Pill (Obsidian with Electric Lime Star & Score) */}
        <button
          type="button"
          onClick={onOpenReport}
          className="nota-card-interactive rounded-[32px] bg-[#121214] border border-white/10 p-5 sm:p-6 flex flex-col justify-center text-left hover:border-[#C7FF2E] transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-[#C7FF2E] font-sans text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
            <Star className="w-6 h-6 fill-[#C7FF2E] text-[#C7FF2E] shrink-0" />
            <span>{latestReport?.greenScore ?? 50} pts</span>
          </div>
          <div className="text-xs text-[#8E8E93] font-medium mt-1">
            Skor hemat dapurmu
          </div>
        </button>
      </div>

      {/* 5. Two Balanced Bento Cards for Daily Questions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch apple-stagger-4">
        {/* Question 1: Sisa Bahan / Adonan */}
        {!skippedWasteCard && (
          <div className="nota-card nota-card-interactive p-6 flex flex-col justify-between gap-4 h-full">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 nota-ReceiptDivider">
                <div>
                  <span className="font-serif text-lg text-[var(--ink)]">
                    Sisa adonan sore ini
                  </span>
                  <div className="text-xs text-[#808080]">
                    Cek cepat sebelum tutup
                  </div>
                </div>
                <BaskomIllustration className="w-10 h-10 text-[#C7FF2E] shrink-0" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-[#808080]">
                    Kira-kira laku berapa porsi?
                  </label>
                  <input
                    type="number"
                    value={portionsInput}
                    onChange={(e) => setPortionsInput(e.target.value)}
                    className="w-28 min-h-[40px] px-3 nota-input-line font-mono text-sm font-semibold text-right"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-[#808080]">
                    Sisa bahan yang nggak kepakai
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.25"
                      value={wasteInput}
                      onChange={(e) => setWasteInput(e.target.value)}
                      className="w-20 min-h-[40px] px-2.5 nota-input-line font-mono text-sm font-semibold text-right"
                    />
                    <select
                      aria-label="Satuan sisa bahan"
                      value={wasteUnit}
                      onChange={(e) =>
                        setWasteUnit(
                          e.target.value as 'kg' | 'baskom' | 'porsi'
                        )
                      }
                      className="min-h-[40px] px-2.5 nota-input-line text-xs font-medium"
                    >
                      <option value="baskom">baskom</option>
                      <option value="kg">kg</option>
                      <option value="porsi">porsi</option>
                    </select>
                  </div>
                </div>

                {/* Pill Tags Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['0', '0.5', '1', '1.5'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setWasteInput(val)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition cursor-pointer ${
                        wasteInput === val
                          ? 'bg-[#C7FF2E] text-[#0F0F0F]'
                          : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)]'
                      }`}
                    >
                      {val.replace('.', ',')} {wasteUnit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSkippedWasteCard(true)}
                className="text-xs text-[#808080] hover:text-[var(--ink)] cursor-pointer"
              >
                Besok aja
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSaveDailyLog({
                    portions_sold: parseInt(portionsInput, 10) || 0,
                    waste_amount: parseFloat(wasteInput) || 0,
                    waste_unit: wasteUnit,
                  });
                  showNotice('Catatan porsi & sisa adonan hari ini disimpan.');
                }}
                className="min-h-[40px] px-4 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          </div>
        )}

        {/* Question 2: Minyak Jelantah (Electric Lime Accent Bento Card) */}
        {!skippedOilCard && (
          <div className="bento-lime bento-lime-interactive p-6 flex flex-col justify-between gap-4 h-full">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 nota-ReceiptDivider">
                <div>
                  <span className="font-serif text-lg text-[#0F0F0F]">
                    Minyak jelantah terkumpul
                  </span>
                  <div className="text-xs text-[#0F0F0F]/70">
                    Tabungan minyak bekas
                  </div>
                </div>
                <JerikenIllustration className="w-10 h-10 text-[#0F0F0F] shrink-0" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-[#0F0F0F]/80">
                    Masuk jeriken hari ini (Liter)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={oilInput}
                    onChange={(e) => setOilInput(e.target.value)}
                    className="w-24 min-h-[40px] px-3 rounded-2xl bg-[#0F0F0F]/10 text-[#0F0F0F] font-mono text-sm font-semibold text-right focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['0', '0.4', '0.5', '1.0'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOilInput(val)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition cursor-pointer ${
                        oilInput === val
                          ? 'bg-[#0F0F0F] text-[#C7FF2E]'
                          : 'bg-[#0F0F0F]/10 text-[#0F0F0F]'
                      }`}
                    >
                      {val.replace('.', ',')} L
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-[#0F0F0F] pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oilSold}
                    onChange={(e) => setOilSold(e.target.checked)}
                    className="w-4 h-4 accent-[#0F0F0F]"
                  />
                  <span>Sudah diambil pengepul jelantah</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSkippedOilCard(true)}
                className="text-xs text-[#0F0F0F]/70 hover:text-[#0F0F0F] cursor-pointer"
              >
                Besok aja
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSaveDailyLog({
                    used_oil_liters: parseFloat(oilInput) || 0,
                    oil_sold: oilSold,
                  });
                  showNotice('Tabungan jelantah hari ini disimpan.');
                }}
                className="min-h-[40px] px-4 rounded-full bg-[#0F0F0F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-[#C7FF2E]" />
                Simpan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Ringkasan Nota Hari Ini & Minggu Berjalan */}
      <div className="nota-card p-6 sm:p-7 apple-stagger-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 nota-ReceiptDivider">
          <h2 className="font-serif text-xl sm:text-2xl text-[var(--ink)]">
            Ringkasan Nota Hari Ini &amp; Minggu Berjalan
          </h2>
          {latestReport && (
            <button
              type="button"
              onClick={() =>
                onInspectProvenance(latestReport.avoidableCost.provenance)
              }
              className="px-3.5 py-1.5 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[#C7FF2E] inline-flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Dari mana angka ini?
            </button>
          )}
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="nota-leader-row">
            <span className="text-[#808080]">Omzet kasir masuk hari ini</span>
            <span className="nota-leader-dots" />
            <span className="font-mono font-semibold text-[var(--ink)]">
              {formatIdr(todaySalesIdr)}
            </span>
          </div>

          <div className="nota-leader-row">
            <span className="text-[#808080]">
              Belanja bahan, gas &amp; operasional hari ini
            </span>
            <span className="nota-leader-dots" />
            <span className="font-mono font-semibold text-[var(--ink)]">
              {formatIdr(todayPurchasesIdr)}
            </span>
          </div>

          <div className="nota-leader-row">
            <span className="text-[#808080]">
              Laba kas bersih hari ini (Omzet − Belanja)
            </span>
            <span className="nota-leader-dots" />
            <span
              className={`font-mono font-bold ${
                todaySalesIdr - todayPurchasesIdr >= 0
                  ? 'text-[#C7FF2E]'
                  : 'text-[#FF5A36]'
              }`}
            >
              {formatIdr(todaySalesIdr - todayPurchasesIdr)}
            </span>
          </div>

          <div className="nota-leader-row">
            <span className="text-[#808080]">
              Uang dapur yang masih bisa diselamatkan
            </span>
            <span className="nota-leader-dots" />
            <span className="font-mono font-semibold text-[#FF5A36]">
              {formatIdr(
                latestReport?.avoidableCost.totalAvoidableCostIdr ?? 0
              )}
            </span>
          </div>

          <div className="mt-3 p-4 rounded-2xl bg-[var(--bg-paper-subtle)] flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-[var(--ink)]">
              Bonus laba dari penghematan dapur minggu ini
            </span>
            <span className="font-mono text-base font-semibold text-[#C7FF2E]">
              +{formatIdr(Math.max(0, latestReport?.totalMeasuredSavingsIdr ?? 0))}
            </span>
          </div>
        </div>

        {/* Recent Transactions Pill List */}
        {todayTransactions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[var(--line)]">
            <div className="text-xs font-medium text-[#808080] mb-2.5">
              Baru saja dicatat
            </div>
            <div className="space-y-2">
              {todayTransactions.slice(0, 4).map((tx) => (
                <div
                  key={tx.id}
                  className="text-xs flex items-center justify-between py-2.5 px-4 rounded-full bg-[var(--bg-paper-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C7FF2E]" />
                    <span className="font-medium text-[var(--ink)]">
                      {tx.item_name}
                    </span>
                    <span className="text-[#808080] font-mono">
                      ({formatNum(tx.qty, 1)} {tx.unit})
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--ink)]">
                    {formatIdr(tx.amount_idr)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
