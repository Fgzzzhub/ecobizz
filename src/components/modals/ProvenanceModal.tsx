'use client';

import React from 'react';
import { MetricProvenance } from '@/types';
import { X } from 'lucide-react';

interface ProvenanceModalProps {
  provenance: MetricProvenance | null;
  onClose: () => void;
}

/**
 * "Dari mana angka ini?" Audit & Transparency Modal.
 * Styled in Apple Bento Obsidian + Electric Lime (#C7FF2E) aesthetic.
 */
export function ProvenanceModal({ provenance, onClose }: ProvenanceModalProps) {
  if (!provenance) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provenance-modal-title"
      onClick={onClose}
    >
      <div
        className="apple-scale-in w-full max-w-lg nota-card p-6 sm:p-7 max-h-[88vh] overflow-y-auto shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-4 nota-ReceiptDivider">
          <div>
            <span className="bento-pill-tag text-[11px] font-medium text-[#C7FF2E]">
              Transparansi Hitungan Deterministik
            </span>
            <h2
              id="provenance-modal-title"
              className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-2"
            >
              {provenance.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup rincian hitungan"
            className="apple-press w-10 h-10 rounded-full bg-[var(--bg-paper-subtle)] flex items-center justify-center text-[var(--ink)] hover:bg-[#C7FF2E] hover:text-[#0F0F0F] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Final Computed Number Pill */}
        <div className="my-5 p-4 rounded-[22px] bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-between">
          <span className="text-xs font-medium">
            Hasil hitungan
          </span>
          <span className="font-mono text-lg sm:text-xl font-bold">
            {provenance.finalValueFormatted}
          </span>
        </div>

        {/* Placeholder Warning if applicable */}
        {provenance.isPlaceholderFactor && (
          <div className="mb-4 p-4 rounded-2xl bg-[var(--bg-paper-subtle)] text-xs text-[#808080]">
            <strong className="text-[#C7FF2E]">Catatan:</strong>{' '}
            Angka ini memakai patokan berlabel{' '}
            <code className="font-mono text-[var(--ink)]">
              PLACEHOLDER, ganti dengan sumber resmi
            </code>
            . Kamu bisa mengubahnya kapan saja di menu Atur.
          </div>
        )}

        {/* Deterministic Formula */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-[#808080] mb-2">
            Cara menghitungnya
          </h3>
          <div className="p-4 rounded-2xl bg-[var(--bg-paper)] border border-[var(--line)] font-mono text-xs sm:text-sm text-[#C7FF2E] leading-relaxed">
            {provenance.formulaText}
          </div>
        </div>

        {/* Input Values Table */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-[#808080] mb-2">
            Dari catatan warungmu minggu ini
          </h3>
          <div className="space-y-2">
            {provenance.inputs.map((inp, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-2xl bg-[var(--bg-paper-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--ink)]">
                    {inp.label}
                  </div>
                  <div className="text-xs text-[#808080]">{inp.sourceNote}</div>
                </div>
                <div className="font-mono text-sm font-semibold text-right text-[#C7FF2E]">
                  {inp.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assumptions */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-[#808080] mb-2">
            Hal yang perlu diketahui
          </h3>
          <ul className="space-y-1.5 text-xs text-[#808080] list-disc pl-4">
            {provenance.assumptions.map((assump, idx) => (
              <li key={idx}>{assump}</li>
            ))}
            <li>
              Semua angka dihitung langsung dari catatan harianmu, bukan karangan AI.
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="apple-press w-full min-h-[50px] rounded-full bg-[#C7FF2E] text-[#0F0F0F] font-semibold text-sm hover:brightness-105 transition cursor-pointer"
        >
          Mengerti, Tutup Rincian
        </button>
      </div>
    </div>
  );
}
