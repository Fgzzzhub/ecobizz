'use client';

import React, { useEffect, useState } from 'react';
import { DataConfidenceLevel, MetricProvenance } from '@/types';
import { Star, HelpCircle } from 'lucide-react';

interface GreenScoreStampProps {
  score: number;
  summary: string;
  dataConfidence: DataConfidenceLevel;
  daysLogged: number;
  provenance: MetricProvenance;
  onInspectProvenance: (p: MetricProvenance) => void;
}

/**
 * Green Score displayed as an Apple-style Electric Lime & Obsidian Bento Hero Widget,
 * preserving scientific honesty badges and provenance triggers.
 */
export function GreenScoreStamp({
  score,
  summary,
  dataConfidence,
  daysLogged,
  provenance,
  onInspectProvenance,
}: GreenScoreStampProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion || score <= 0) {
      setDisplayScore(score);
      return;
    }

    let frame = 0;
    const totalFrames = 24;
    const timer = window.setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (frame >= totalFrames) {
        setDisplayScore(score);
        window.clearInterval(timer);
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, [score]);

  const confidenceBadge = {
    tinggi: {
      label: 'Catatan lengkap',
      sub: `${daysLogged}/7 hari`,
    },
    sedang: {
      label: 'Catatan cukup',
      sub: `${daysLogged}/7 hari`,
    },
    rendah: {
      label: 'Baru sedikit dicatat',
      sub: `${daysLogged}/7 hari`,
    },
  }[dataConfidence];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
      {/* Left 5 cols: Electric Lime Score Bento Card (Image 1 & 2 Style) */}
      <div className="sm:col-span-5 bento-lime bento-lime-interactive p-6 flex flex-col justify-between stamp-drop-anim h-full">
        <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
          <span className="text-xs font-semibold tracking-wide text-[#0F0F0F]">
            CAP NOTA HIJAU
          </span>
          <span className="text-xs font-medium text-[#0F0F0F]/75">
            {daysLogged}/7 hari
          </span>
        </div>

        <div className="my-5 flex items-baseline gap-2">
          <Star className="w-8 h-8 fill-[#0F0F0F] text-[#0F0F0F] self-center shrink-0" />
          <span className="font-sans text-6xl font-bold text-[#0F0F0F] tracking-tight tabular-nums leading-none">
            {displayScore}
          </span>
          <span className="font-sans text-lg font-semibold text-[#0F0F0F]/75">
            / 100 pts
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="bento-pill-tag font-medium">
            Estimasi, bukan sertifikasi hijau
          </span>
        </div>
      </div>

      {/* Right 7 cols: Charcoal Meaning & Provenance Bento Card */}
      <div className="sm:col-span-7 nota-card nota-card-interactive p-6 flex flex-col justify-between h-full">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 nota-ReceiptDivider">
            <span className="text-xs font-medium text-[#808080]">
              Kabar dapur minggu ini
            </span>
            <span
              className="bento-pill-tag text-xs"
              title="Tingkat kelengkapan catatan harian dalam seminggu"
            >
              <span className="w-2 h-2 rounded-full bg-[#C7FF2E]" />
              {confidenceBadge.label} ({confidenceBadge.sub})
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--ink)] leading-snug">
            “{summary}”
          </h2>

          <p className="text-xs sm:text-sm text-[#808080] mt-2 leading-relaxed">
            Angka <strong className="text-[var(--ink)]">50</strong> itu patokan kebiasaan awal warungmu. Kalau tembus{' '}
            <strong className="text-[#C7FF2E]">80 ke atas</strong>, artinya dapurmu sudah jauh lebih irit.
          </p>
        </div>

        <div className="mt-5 pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onInspectProvenance(provenance)}
            className="apple-press min-h-[42px] px-4 py-2 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[#C7FF2E] inline-flex items-center gap-2 hover:bg-[#383838] transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            Dari mana angka ini?
          </button>
          <span className="text-[11px] text-[#808080]">
            Hitungan terbuka
          </span>
        </div>
      </div>
    </div>
  );
}
