'use client';

import React, { useState } from 'react';
import {
  BusinessProfile,
  DimensionWeights,
  EmissionFactorRecord,
} from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  RefreshCw,
  Trash2,
  Download,
  Moon,
  Sun,
  Mail,
  Check,
  ArrowRight,
} from 'lucide-react';

interface SettingsViewProps {
  business: BusinessProfile;
  emissionFactors: EmissionFactorRecord[];
  syncState: {
    pendingCount: number;
    mode: 'cloud_synced' | 'offline_queue' | 'local_only';
  };
  themeMode: 'emerald' | 'dark' | 'light';
  onSelectThemeMode: (nextTheme: 'emerald' | 'dark' | 'light') => void;
  onUpdateBusiness: (updated: BusinessProfile) => Promise<void>;
  onUpdateEmissionFactor: (factor: EmissionFactorRecord) => Promise<void>;
  onLoadDemo: () => Promise<void>;
  onResetAllData: () => Promise<void>;
  onExportJsonBackup: () => Promise<void>;
  onTriggerSync: () => Promise<void>;
}

export function SettingsView({
  business,
  emissionFactors,
  syncState,
  themeMode,
  onSelectThemeMode,
  onUpdateBusiness,
  onUpdateEmissionFactor,
  onLoadDemo,
  onResetAllData,
  onExportJsonBackup,
  onTriggerSync,
}: SettingsViewProps) {
  const [tariffs, setTariffs] = useState(business.tariffs);
  const [weights, setWeights] = useState<DimensionWeights>(business.weights);
  const [mode, setMode] = useState(business.mode);
  const [emailInput, setEmailInput] = useState('');
  const [authStatusMsg, setAuthStatusMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const flashSaved = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 2600);
  };

  const handleSaveSettings = async () => {
    const sumWeights =
      weights.waste + weights.energy + weights.water + weights.packaging || 1;
    const normalizedWeights: DimensionWeights = {
      waste: Math.round((weights.waste / sumWeights) * 100) / 100,
      energy: Math.round((weights.energy / sumWeights) * 100) / 100,
      water: Math.round((weights.water / sumWeights) * 100) / 100,
      packaging: Math.round((weights.packaging / sumWeights) * 100) / 100,
    };

    await onUpdateBusiness({
      ...business,
      mode,
      tariffs,
      weights: normalizedWeights,
      updated_at: new Date().toISOString(),
    });
    setWeights(normalizedWeights);
    flashSaved('Pengaturan tarif, bobot skor, dan mode pencatatan disimpan.');
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthStatusMsg(
        'Kredensial Supabase belum diatur di .env. Aplikasi berjalan penuh dalam Mode Offline-First di perangkat ini.'
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput.trim(),
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setAuthStatusMsg(`Gagal mengirim tautan: ${error.message}`);
    } else {
      setAuthStatusMsg(
        'Tautan masuk (Magic Link) telah dikirim ke email Anda. Cek kotak masuk.'
      );
    }
  };

  return (
    <div className="space-y-5">
      {savedMsg && (
        <div className="dynamic-island-toast px-5 py-3.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs sm:text-sm font-semibold flex items-center justify-between">
          <span>{savedMsg}</span>
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* 1. Demo Mode & Judge Quick Controls (Electric Lime Bento Card) */}
      <div className="apple-stagger-1 bento-lime bento-lime-interactive p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
          <div>
            <span className="text-xs font-medium text-[#0F0F0F]/75">
              Coba data contoh
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-[#0F0F0F] mt-0.5">
              Cerita 8 Minggu Warung Bu Ani
            </h2>
          </div>
          <span className="bento-pill-tag font-medium">8 minggu</span>
        </div>

        <p className="text-xs text-[#0F0F0F]/80">
          Lihat langsung bagaimana Warung Gorengan Bu Ani menghemat belanja bahan, gas, dan plastik selama 8 minggu, atau hapus untuk mulai dari nol.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-testid="btn-settings-load-demo"
            onClick={async () => {
              await onLoadDemo();
              flashSaved('Catatan 8 minggu Warung Bu Ani siap dilihat.');
            }}
            className="apple-press flex-1 min-h-[48px] pl-5 pr-3 rounded-full bg-[#0F0F0F] text-white text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 cursor-pointer"
          >
            <span>Buka Contoh Warung Bu Ani</span>
            <span className="w-8 h-8 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              data-testid="btn-settings-reset-demo"
              onClick={() => setConfirmReset(true)}
              className="apple-press min-h-[48px] px-5 rounded-full bg-[#0F0F0F]/10 text-[#0F0F0F] text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Mulai dari Nol
            </button>
          ) : (
            <button
              type="button"
              data-testid="btn-confirm-reset-demo"
              onClick={async () => {
                setConfirmReset(false);
                await onResetAllData();
              }}
              className="apple-press min-h-[48px] px-5 rounded-full bg-[#FF5A36] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Ya, Kosongkan Catatan
            </button>
          )}
        </div>
      </div>

      {/* 2. 3-Layer Appearance Theme Selector & Recording Mode */}
      <div className="apple-stagger-2 nota-card p-6 space-y-4">
        <div className="pb-3 nota-ReceiptDivider">
          <span className="text-xs text-[#808080]">3 Pilihan Tema Warna</span>
          <h2 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
            Warna Layar &amp; Gaya Nyatat
          </h2>
        </div>

        {/* 3-Layer Theme Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Layer 1: Default Zamrud & Krem (#FFEFB3, #013E37, #4D694E, #FFF3D5) */}
          <button
            type="button"
            onClick={() => onSelectThemeMode('emerald')}
            className={`apple-press p-4 rounded-[22px] border text-left transition cursor-pointer ${
              themeMode === 'emerald'
                ? 'border-2 border-[#013E37] bg-[#FFEFB3]/45 shadow-md'
                : 'border-[var(--line)] bg-[var(--bg-paper-subtle)] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center -space-x-1.5">
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#013E37' }}
                  title="#013E37"
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#FFEFB3' }}
                  title="#FFEFB3"
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#4D694E' }}
                  title="#4D694E"
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#FFF3D5' }}
                  title="#FFF3D5"
                />
              </div>
              {themeMode === 'emerald' && (
                <span className="px-2 py-0.5 rounded-full bg-[#013E37] text-[#FFF3D5] text-[10px] font-semibold">
                  Aktif
                </span>
              )}
            </div>
            <div className="font-serif text-base text-[var(--ink)]">
              1. Zamrud &amp; Krem
            </div>
            <div className="text-[11px] text-[#808080] mt-0.5">
              Tema utama (Default) • Hangat &amp; elegan
            </div>
          </button>

          {/* Layer 2: Gelap Obsidian (#0F0F0F & #C7FF2E) */}
          <button
            type="button"
            onClick={() => onSelectThemeMode('dark')}
            className={`apple-press p-4 rounded-[22px] border text-left transition cursor-pointer ${
              themeMode === 'dark'
                ? 'border-2 border-[#C7FF2E] bg-[#18181A] shadow-md'
                : 'border-[var(--line)] bg-[var(--bg-paper-subtle)] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center -space-x-1.5">
                <span
                  className="w-5 h-5 rounded-full border border-white/20"
                  style={{ backgroundColor: '#0F0F0F' }}
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/20"
                  style={{ backgroundColor: '#C7FF2E' }}
                />
                <span
                  className="w-5 h-5 rounded-full border border-white/20"
                  style={{ backgroundColor: '#2E2E2E' }}
                />
              </div>
              {themeMode === 'dark' && (
                <span className="px-2 py-0.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-[10px] font-semibold">
                  Aktif
                </span>
              )}
            </div>
            <div className="font-serif text-base text-[var(--ink)] flex items-center gap-1.5">
              <span>2. Gelap Obsidian</span>
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] text-[#808080] mt-0.5">
              Mode malam kontras tinggi
            </div>
          </button>

          {/* Layer 3: Terang Bersih (#F5F5F7 & #FFFFFF) */}
          <button
            type="button"
            onClick={() => onSelectThemeMode('light')}
            className={`apple-press p-4 rounded-[22px] border text-left transition cursor-pointer ${
              themeMode === 'light'
                ? 'border-2 border-[#0F0F0F] bg-white shadow-md'
                : 'border-[var(--line)] bg-[var(--bg-paper-subtle)] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center -space-x-1.5">
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#FFFFFF' }}
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#F5F5F7' }}
                />
                <span
                  className="w-5 h-5 rounded-full border border-black/15"
                  style={{ backgroundColor: '#C7FF2E' }}
                />
              </div>
              {themeMode === 'light' && (
                <span className="px-2 py-0.5 rounded-full bg-[#0F0F0F] text-white text-[10px] font-semibold">
                  Aktif
                </span>
              )}
            </div>
            <div className="font-serif text-base text-[var(--ink)] flex items-center gap-1.5">
              <span>3. Terang Bersih</span>
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className="text-[11px] text-[#808080] mt-0.5">
              Putih bersih siang hari
            </div>
          </button>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setMode(mode === 'cepat' ? 'rinci' : 'cepat')}
            className="apple-press w-full min-h-[50px] px-5 py-3 rounded-full bg-[var(--bg-paper-subtle)] flex items-center justify-between text-xs sm:text-sm font-medium text-[var(--ink)] cursor-pointer"
          >
            <span>Gaya catat: {mode === 'cepat' ? 'Santai & Cepat' : 'Lengkap'}</span>
            <span className="text-xs text-[#C7FF2E]">Ketuk untuk ganti</span>
          </button>
        </div>
      </div>

      {/* 3. Tariffs & Weights */}
      <div className="apple-stagger-3 nota-card p-6 space-y-4">
        <div className="pb-3 nota-ReceiptDivider">
          <span className="text-xs text-[#808080]">
            Harga patokan di daerahmu
          </span>
          <h2 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
            Tarif Listrik, Gas, Air &amp; Jelantah
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[#808080] mb-1">
              Tarif Listrik (Rp / kWh)
            </label>
            <input
              type="number"
              value={tariffs.electricity_per_kwh}
              onChange={(e) =>
                setTariffs({
                  ...tariffs,
                  electricity_per_kwh: Number(e.target.value) || 0,
                })
              }
              className="w-full min-h-[44px] px-3.5 nota-input-line font-mono text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[#808080] mb-1">
              Harga Gas LPG (Rp / kg)
            </label>
            <input
              type="number"
              value={tariffs.lpg_per_kg}
              onChange={(e) =>
                setTariffs({
                  ...tariffs,
                  lpg_per_kg: Number(e.target.value) || 0,
                })
              }
              className="w-full min-h-[44px] px-3.5 nota-input-line font-mono text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[#808080] mb-1">
              Tarif Air Bersih (Rp / m³)
            </label>
            <input
              type="number"
              value={tariffs.water_per_m3}
              onChange={(e) =>
                setTariffs({
                  ...tariffs,
                  water_per_m3: Number(e.target.value) || 0,
                })
              }
              className="w-full min-h-[44px] px-3.5 nota-input-line font-mono text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[#808080] mb-1">
              Harga Jual Jelantah (Rp / Liter)
            </label>
            <input
              type="number"
              value={tariffs.used_oil_price_per_liter}
              onChange={(e) =>
                setTariffs({
                  ...tariffs,
                  used_oil_price_per_liter: Number(e.target.value) || 0,
                })
              }
              className="w-full min-h-[44px] px-3.5 nota-input-line font-mono text-sm font-bold"
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs text-[#808080] mb-2">
            Bobot Skor Hijau (Default: 30% Sisa Bahan, 30% Energi, 20% Air, 20% Kemasan)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(
              [
                { key: 'waste', label: 'Sisa Bahan' },
                { key: 'energy', label: 'Energi' },
                { key: 'water', label: 'Air' },
                { key: 'packaging', label: 'Kemasan' },
              ] as const
            ).map((dim) => (
              <div key={dim.key}>
                <label className="block text-[#808080] mb-1">{dim.label}</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="0.7"
                  value={weights[dim.key]}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      [dim.key]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full min-h-[42px] px-3 nota-input-line font-mono text-sm font-bold"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="w-full min-h-[50px] rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs sm:text-sm font-semibold cursor-pointer"
        >
          Simpan Perubahan Tarif &amp; Bobot
        </button>
      </div>

      {/* 4. Emission Factors Table */}
      <div className="nota-card p-6 space-y-4">
        <div className="pb-3 nota-ReceiptDivider">
          <span className="text-xs text-[#808080]">Patokan hitung jejak karbon</span>
          <h2 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
            Angka Konversi Listrik &amp; Gas
          </h2>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-paper-subtle)] text-xs text-[#808080]">
          Supaya tetap jujur, angka bawaan ini diberi tanda{' '}
          <code className="font-mono text-[#C7FF2E]">
            PLACEHOLDER, ganti dengan sumber resmi
          </code>{' '}
          dan disebut <strong className="text-[var(--ink)]">Faktor ilustrasi</strong> sampai kamu menggantinya dengan angka resmi.
        </div>

        <div className="space-y-3">
          {emissionFactors.map((ef) => (
            <div
              key={ef.id}
              className="p-4 rounded-[22px] bg-[var(--bg-paper)] border border-[var(--line)] space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-sm text-[var(--ink)]">
                    {ef.label}
                  </span>{' '}
                  <span className="font-mono text-xs text-[#808080]">
                    (v{ef.version})
                  </span>
                </div>
                <span className="bento-pill-tag text-[11px] font-mono">
                  {ef.is_placeholder
                    ? 'Faktor Ilustrasi (PLACEHOLDER)'
                    : 'Sumber Resmi'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[#808080] mb-1">
                    Nilai ({ef.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ef.value}
                    onChange={(e) =>
                      onUpdateEmissionFactor({
                        ...ef,
                        value: parseFloat(e.target.value) || 0,
                        version: ef.version + 1,
                      })
                    }
                    className="w-full min-h-[40px] px-3 nota-input-line font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#808080] mb-1">
                    Asal angka
                  </label>
                  <input
                    type="text"
                    value={ef.source}
                    onChange={(e) =>
                      onUpdateEmissionFactor({
                        ...ef,
                        source: e.target.value,
                        is_placeholder: e.target.value
                          .toUpperCase()
                          .includes('PLACEHOLDER'),
                      })
                    }
                    className="w-full min-h-[40px] px-3 nota-input-line font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Sync Status & Data Export */}
      <div className="nota-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
          <div>
            <span className="text-xs text-[#808080]">
              Cadangan catatan warung
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-[var(--ink)] mt-0.5">
              Simpan di HP &amp; Cadangan Online
            </h2>
          </div>
          <button
            type="button"
            onClick={onTriggerSync}
            className="apple-press min-h-[40px] px-4 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cek Sinkron
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-paper-subtle)] text-xs space-y-1">
          <div className="font-medium text-[var(--ink)]">
            Kondisi saat ini:{' '}
            {syncState.mode === 'cloud_synced'
              ? 'Tersimpan di Cloud & HP'
              : 'Tersimpan aman di memori HP ini'}
          </div>
          <div className="text-[#808080] font-mono">
            Catatan menunggu sinyal: {syncState.pendingCount} item
          </div>
        </div>

        <form onSubmit={handleSendMagicLink} className="space-y-2">
          <label className="block text-xs text-[#808080]">
            Simpan cadangan ke email (opsional)
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="nama@email.com"
              className="flex-1 min-h-[46px] px-4 nota-input-line text-sm"
            />
            <button
              type="submit"
              className="apple-press min-h-[46px] px-5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Kirim Link
            </button>
          </div>
          {!isSupabaseConfigured && (
            <p className="text-[11px] text-[#808080]">
              Saat ini aplikasi berjalan penuh di memori HP kamu tanpa perlu akun atau kuota internet.
            </p>
          )}
          {authStatusMsg && (
            <div className="p-3 rounded-2xl bg-[var(--bg-paper-subtle)] text-xs text-[var(--ink)]">
              {authStatusMsg}
            </div>
          )}
        </form>

        <div className="pt-2">
          <button
            type="button"
            onClick={onExportJsonBackup}
            className="apple-press w-full min-h-[48px] px-4 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[var(--ink)] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Cadangan Catatan (.JSON)
          </button>
        </div>
      </div>
    </div>
  );
}
