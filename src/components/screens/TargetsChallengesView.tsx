'use client';

import React, { useState } from 'react';
import {
  BusinessProfile,
  ChallengeRecord,
  WeeklyReportComputed,
} from '@/types';
import { formatNum } from '@/lib/calc';
import { Check, Plus } from 'lucide-react';

interface TargetsChallengesViewProps {
  business: BusinessProfile;
  challenges: ChallengeRecord[];
  latestReport: WeeklyReportComputed | null;
  onUpdateTargetPct: (newTargetPct: number) => Promise<void>;
  onCheckInChallengeToday: (challengeId: string) => Promise<void>;
  onCreateChallenge: (template: {
    code: string;
    title: string;
    description: string;
    duration_days: 7 | 30;
  }) => Promise<void>;
}

const CHALLENGE_TEMPLATES: Array<{
  code: string;
  title: string;
  description: string;
  duration_days: 7 | 30;
}> = [
  {
    code: '7d_small_batch_dough',
    title: '7 Hari: Bagi Adonan Sore Jadi 2 Takaran',
    description:
      'Kurangi takaran adonan 2 jam sebelum tutup agar sisa adonan harian kurang dari setengah baskom.',
    duration_days: 7,
  },
  {
    code: '7d_no_double_plastic',
    title: '7 Hari: Tanya Pembeli Sebelum Kasih Kresek',
    description:
      'Tawarkan bungkus kertas langsung untuk pembelian kecil tanpa kantong plastik ganda.',
    duration_days: 7,
  },
  {
    code: '30d_jelantah_jeriken',
    title: '30 Hari: Rutin Saring & Setor Jelantah',
    description:
      'Tampung seluruh minyak jelantah di jeriken tertutup dan jual ke pengepul resmi setiap 2 minggu.',
    duration_days: 30,
  },
];

export function TargetsChallengesView({
  business,
  challenges,
  latestReport,
  onUpdateTargetPct,
  onCheckInChallengeToday,
  onCreateChallenge,
}: TargetsChallengesViewProps) {
  const [targetSlider, setTargetSlider] = useState<number>(business.target_pct);
  const [savedBanner, setSavedBanner] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSaveTarget = async (val: number) => {
    setTargetSlider(val);
    await onUpdateTargetPct(val);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1. Target Reduction t (5% - 20%) Bento Card */}
      <div className="apple-stagger-1 nota-card p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 mb-4 nota-ReceiptDivider">
          <div>
            <span className="text-xs text-[#808080]">Atur patokan dapur</span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] mt-0.5">
              Mau seberapa irit minggu ini?
            </h1>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] font-mono text-lg font-bold">
            −{targetSlider}%
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#808080] mb-4">
          Patokan awal dihitung dari kebiasaan 4 minggu pertama warungmu. Cukup mulai dari{' '}
          <strong className="text-[var(--ink)]">10% lebih irit</strong> biar tetap nyaman dijalankan setiap hari.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { val: 5, label: '−5% Santai' },
            { val: 10, label: '−10% Pas buat mulai' },
            { val: 15, label: '−15% Lebih serius' },
            { val: 20, label: '−20% Paling hemat' },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => handleSaveTarget(preset.val)}
              className={`apple-press px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer ${
                targetSlider === preset.val
                  ? 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                  : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <input
          type="range"
          min={5}
          max={20}
          step={1}
          value={targetSlider}
          aria-label="Persentase target penghematan"
          onChange={(e) => handleSaveTarget(Number(e.target.value))}
          className="w-full accent-[#C7FF2E] cursor-pointer"
        />

        {savedBanner && (
          <div className="dynamic-island-toast mt-3 px-4 py-2.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold">
            Target hemat diubah ke −{targetSlider}%. Rapor langsung menyesuaikan.
          </div>
        )}

        {latestReport && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-[20px] bg-[var(--bg-paper-subtle)]">
              <div className="text-[#808080]">Patokan sisa adonan</div>
              <div className="font-mono font-semibold text-sm text-[var(--ink)] mt-1">
                {formatNum(latestReport.dimensions.waste.baseline, 2)}% →{' '}
                <span className="text-[#C7FF2E]">
                  {formatNum(latestReport.dimensions.waste.target, 2)}%
                </span>
              </div>
            </div>
            <div className="p-4 rounded-[20px] bg-[var(--bg-paper-subtle)]">
              <div className="text-[#808080]">Patokan gas per porsi</div>
              <div className="font-mono font-semibold text-sm text-[var(--ink)] mt-1">
                {formatNum(latestReport.gasIntensity.baseline * 1000, 1)}g →{' '}
                <span className="text-[#C7FF2E]">
                  {formatNum(latestReport.gasIntensity.target * 1000, 1)}g
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Active 7-Day & 30-Day Challenges */}
      <div className="apple-stagger-2 nota-card p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 mb-4 nota-ReceiptDivider">
          <div>
            <span className="text-xs text-[#808080]">Kebiasaan kecil di dapur</span>
            <h2 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
              Latihan Rutin 7 &amp; 30 Hari
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {challenges.map((chal, idx) => {
            const pct = Math.min(
              100,
              Math.round((chal.progress_days / chal.duration_days) * 100)
            );
            const checkedToday = chal.checked_dates.includes(todayStr);
            const isLime = idx === 0;

            return (
              <div
                key={chal.id}
                className={`p-5 rounded-[24px] space-y-4 ${
                  isLime
                    ? 'bg-[#C7FF2E] text-[#0F0F0F]'
                    : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block text-[11px] font-medium px-3 py-0.5 rounded-full ${
                        isLime
                          ? 'bg-[#0F0F0F]/10 text-[#0F0F0F]'
                          : 'bg-black/25 text-[#808080]'
                      }`}
                    >
                      {chal.duration_days} hari •{' '}
                      {chal.status === 'completed' ? 'Tuntas' : 'Sedang jalan'}
                    </span>
                    <h3 className="font-serif text-lg mt-2">
                      {chal.title}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 ${
                        isLime ? 'text-[#0F0F0F]/75' : 'text-[#808080]'
                      }`}
                    >
                      {chal.description}
                    </p>
                  </div>
                  <div className="font-mono text-sm font-semibold shrink-0">
                    {chal.progress_days}/{chal.duration_days} hr
                  </div>
                </div>

                {chal.duration_days === 7 && (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const done = dayIdx < chal.progress_days;
                      return (
                        <div
                          key={dayIdx}
                          className={`flex-1 h-8 rounded-full font-mono text-xs flex items-center justify-center ${
                            done
                              ? isLime
                                ? 'bg-[#0F0F0F] text-[#C7FF2E] font-semibold'
                                : 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                              : isLime
                                ? 'bg-[#0F0F0F]/10 text-[#0F0F0F]/60'
                                : 'bg-black/20 text-[#808080]'
                          }`}
                        >
                          H{dayIdx + 1}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`text-xs font-mono ${
                      isLime ? 'text-[#0F0F0F]/75' : 'text-[#808080]'
                    }`}
                  >
                    Sudah jalan {pct}%
                  </span>
                  {chal.status !== 'completed' && (
                    <button
                      type="button"
                      disabled={checkedToday}
                      onClick={() => onCheckInChallengeToday(chal.id)}
                      className={`apple-press min-h-[42px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        checkedToday
                          ? 'bg-black/15 opacity-70'
                          : isLime
                            ? 'bg-[#0F0F0F] text-white'
                            : 'bg-[#C7FF2E] text-[#0F0F0F]'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {checkedToday
                        ? 'Tercatat hari ini'
                        : 'Sudah dilakukan hari ini'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Challenge Templates */}
        <div className="mt-6 pt-4 border-t border-[var(--line)]">
          <div className="text-xs font-medium text-[#808080] mb-3">
            Coba latihan lainnya
          </div>
          <div className="space-y-2.5">
            {CHALLENGE_TEMPLATES.filter(
              (tpl) => !challenges.some((c) => c.code === tpl.code)
            ).map((tpl) => (
              <div
                key={tpl.code}
                className="p-4 rounded-[22px] bg-[var(--bg-paper-subtle)] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-serif text-base text-[var(--ink)]">
                    {tpl.title}
                  </div>
                  <div className="text-xs text-[#808080]">
                    {tpl.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateChallenge(tpl)}
                  className="apple-press min-h-[40px] px-4 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Ikut
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
