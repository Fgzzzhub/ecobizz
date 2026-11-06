'use client';

import React, { useState } from 'react';
import {
  BusinessProfile,
  BusinessType,
  CatalogItem,
  RecordingMode,
} from '@/types';
import { getDefaultCatalogTemplates } from '@/lib/classify';
import {
  BaskomIllustration,
  GerobakWarungIllustration,
  KantongPlastikIllustration,
} from '@/components/illustrations/WarungIcons';
import { Plus, Trash2, ArrowRight, ArrowLeft, Camera, Check } from 'lucide-react';

interface OnboardingViewProps {
  onCompleteOnboarding: (
    business: BusinessProfile,
    catalog: CatalogItem[],
    defaultWasteUnit: 'kg' | 'baskom' | 'porsi'
  ) => Promise<void>;
  onLoadDemo: () => Promise<void>;
}

const BUSINESS_TYPES: Array<{
  id: BusinessType;
  label: string;
  desc: string;
  tag: string;
}> = [
  {
    id: 'gorengan',
    label: 'Warung Gorengan & Jajanan',
    desc: 'Tempe, tahu, bakwan, pisang goreng, jajanan sore',
    tag: 'Populer',
  },
  {
    id: 'warung_makan',
    label: 'Warung Makan / Nasi',
    desc: 'Warteg, pecel lele, soto, mie ayam, nasi rames',
    tag: 'Harian',
  },
  {
    id: 'kedai_kopi',
    label: 'Kedai Kopi & Minuman',
    desc: 'Warkop, es kopi susu, teh tarik, minuman cup',
    tag: 'Minuman',
  },
  {
    id: 'katering',
    label: 'Katering & Nasi Kotak',
    desc: 'Pesanan kotak rapat, tumpeng, rantangan harian',
    tag: 'Pesanan',
  },
];

export function OnboardingView({
  onCompleteOnboarding,
  onLoadDemo,
}: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('Warung Berkah Ibu');
  const [type, setType] = useState<BusinessType>('gorengan');
  const [mode, setMode] = useState<RecordingMode>('cepat');
  const [catalog, setCatalog] = useState<CatalogItem[]>(() =>
    getDefaultCatalogTemplates('gorengan', 'new-biz')
  );
  const [newItemName, setNewItemName] = useState('');
  const [newItemKind, setNewItemKind] = useState<'bahan' | 'kemasan'>('bahan');
  const [newItemCost, setNewItemCost] = useState('15000');
  const [energySources, setEnergySources] = useState<string[]>([
    'listrik',
    'lpg_3kg',
  ]);
  const [defaultWasteUnit, setDefaultWasteUnit] = useState<
    'baskom' | 'kg' | 'porsi'
  >('baskom');
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleTypeSelect = (newType: BusinessType) => {
    setType(newType);
    setCatalog(getDefaultCatalogTemplates(newType, 'new-biz'));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const cost = parseInt(newItemCost.replace(/\D/g, ''), 10) || 10000;
    const item: CatalogItem = {
      id: `cat-custom-${Date.now()}`,
      business_id: 'new-biz',
      client_id: `cat-custom-${Date.now()}`,
      name: newItemName.trim(),
      kind: newItemKind,
      unit: newItemKind === 'kemasan' ? 'pak' : 'kg',
      pack_size: newItemKind === 'kemasan' ? 50 : 1,
      unit_cost: cost,
      is_single_use: newItemKind === 'kemasan',
      tags: ['kustom'],
      sync_status: 'local_only',
    };
    setCatalog((prev) => [...prev, item]);
    setNewItemName('');
  };

  const handlePhotoCatalogQuickAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const added: CatalogItem = {
      id: `cat-photo-${Date.now()}`,
      business_id: 'new-biz',
      client_id: `cat-photo-${Date.now()}`,
      name: `Bahan dari Foto (${file.name.slice(0, 16)})`,
      kind: 'bahan',
      unit: 'kg',
      pack_size: 1,
      unit_cost: 16000,
      is_single_use: false,
      tags: ['foto'],
      sync_status: 'local_only',
    };
    setCatalog((prev) => [...prev, added]);
  };

  const toggleEnergy = (src: string) => {
    setEnergySources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  const handleFinish = async () => {
    const bizId = `biz-${Date.now()}`;
    const newBiz: BusinessProfile = {
      id: bizId,
      name: name.trim() || 'Warung Saya',
      type,
      energy_sources:
        energySources.length > 0 ? energySources : ['listrik', 'lpg_3kg'],
      mode,
      weights: { waste: 0.3, energy: 0.3, water: 0.2, packaging: 0.2 },
      target_pct: 10,
      tariffs: {
        electricity_per_kwh: 1445,
        lpg_per_kg: 7333,
        water_per_m3: 7500,
        used_oil_price_per_liter: 6500,
        avg_ingredient_cost_per_kg: 18000,
      },
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const linkedCatalog = catalog.map((c) => ({
      ...c,
      business_id: bizId,
    }));

    await onCompleteOnboarding(newBiz, linkedCatalog, defaultWasteUnit);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Apple-Style Hero Header & Outlined Pill (Exact Specification from Image 1) */}
      <div className="text-center max-w-xl mx-auto space-y-4 pt-3 apple-stagger-1">
        <h1 className="font-serif text-3xl sm:text-5xl font-normal leading-[1.12] tracking-tight">
          <span className="text-[var(--ink)]">Catat belanja &amp; dapur warung, </span>
          <span className="text-[var(--ink-muted)]">
            tanpa ribet mikir rumus.
          </span>
        </h1>

        <div>
          <span className="inline-block px-5 py-2 rounded-full border border-[var(--line)] bg-[var(--bg-paper-card)] text-xs font-medium text-[var(--ink-muted)]">
            Cara kerjanya simpel
          </span>
        </div>
      </div>

      {/* Balanced 3-Column Bento Process Cards (Image 1 Specification + Staggered Spring Reveal) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {/* Card 1: Charcoal Bento */}
        <div className="nota-card nota-card-interactive p-5 flex flex-col justify-between gap-4 apple-stagger-1">
          <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
            <span className="font-serif text-lg text-[var(--ink)]">
              Catat Sambil Jualan
            </span>
            <span className="text-xs text-[var(--ink-muted)]">10 detik</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bento-pill-tag">Tinggal ngomong</span>
            <span className="bento-pill-tag">Jepret struk pasar</span>
            <span className="bento-pill-tag">Catat sisa adonan</span>
          </div>
        </div>

        {/* Card 2: Electric Lime Bento (Demo Mode "Warung Bu Ani") */}
        <div className="bento-lime bento-lime-interactive p-5 flex flex-col justify-between gap-4 apple-stagger-2">
          <div>
            <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
              <span className="font-serif text-lg text-[#0F0F0F]">
                Warung Bu Ani
              </span>
              <span className="text-xs font-medium text-[#0F0F0F]/75">
                Contoh 8 minggu
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="bento-pill-tag">4 minggu awal</span>
              <span className="bento-pill-tag">4 minggu mulai irit</span>
              <span className="bento-pill-tag">Hemat Rp 165rb/mgg</span>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoadingDemo}
            onClick={async () => {
              setIsLoadingDemo(true);
              await onLoadDemo();
              setIsLoadingDemo(false);
            }}
            data-testid="btn-load-demo-onboarding"
            className="w-full min-h-[48px] pl-4 pr-2 py-1.5 rounded-full bg-[#0F0F0F] text-white text-xs font-semibold flex items-center justify-between gap-2 apple-press cursor-pointer"
          >
            <span>
              {isLoadingDemo
                ? 'Membuka catatan Bu Ani...'
                : 'Lihat Contoh Warung Bu Ani'}
            </span>
            <span className="w-8 h-8 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

        {/* Card 3: Charcoal Bento */}
        <div className="nota-card nota-card-interactive p-5 flex flex-col justify-between gap-4 apple-stagger-3">
          <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
            <span className="font-serif text-lg text-[var(--ink)]">
              Hitungan Terbuka
            </span>
            <span className="text-xs text-[var(--ink-muted)]">Jujur &amp; jelas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bento-pill-tag">Bisa dicek asalnya</span>
            <span className="bento-pill-tag">Tanpa tebak-tebakan</span>
            <span className="bento-pill-tag">Jalan tanpa sinyal</span>
          </div>
        </div>
      </div>

      {/* 3-Step Onboarding Bento Form */}
      <div className="nota-card p-6 sm:p-8 apple-stagger-4">
        {/* Step Progress Indicator Pills */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-[#C7FF2E]' : 'bg-[var(--bg-paper-subtle)]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pb-5 mb-6 nota-ReceiptDivider">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--bg-paper-subtle)] text-[11px] font-medium text-[var(--ink-muted)] mb-2">
              Langkah {step} dari 3
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)]">
              {step === 1 && 'Kenalan dulu sama warungmu'}
              {step === 2 && 'Bahan & bungkus yang sering dibeli'}
              {step === 3 && 'Takaran dapur sehari-hari'}
            </h2>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center shrink-0 shadow-lg shadow-[#C7FF2E]/20">
            {step === 1 && <GerobakWarungIllustration className="w-9 h-9" />}
            {step === 2 && <KantongPlastikIllustration className="w-9 h-9" />}
            {step === 3 && <BaskomIllustration className="w-9 h-9" />}
          </div>
        </div>

        {/* STEP 1: Business Profile */}
        {step === 1 && (
          <div key="step-1" className="space-y-5 apple-scale-in">
            <div>
              <label
                htmlFor="warung-name-input"
                className="block text-xs font-medium text-[#808080] mb-2"
              >
                Nama warung atau usaha
              </label>
              <input
                id="warung-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Warung Gorengan Bu Ani"
                className="w-full min-h-[52px] px-4 py-3 nota-input-line text-base font-medium text-[var(--ink)]"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-[#808080] mb-2.5">
                Sehari-hari jualan apa?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((bt) => {
                  const selected = type === bt.id;
                  return (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => handleTypeSelect(bt.id)}
                      className={`p-4 rounded-[22px] text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                        selected
                          ? 'bg-[#C7FF2E] text-[#0F0F0F]'
                          : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)] hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                            selected
                              ? 'bg-[#0F0F0F]/15 text-[#0F0F0F]'
                              : 'bg-black/20 text-[#808080]'
                          }`}
                        >
                          {bt.tag}
                        </span>
                        {selected && <Check className="w-4 h-4 text-[#0F0F0F]" />}
                      </div>
                      <div>
                        <div className="font-serif text-lg leading-snug">
                          {bt.label}
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            selected ? 'text-[#0F0F0F]/75' : 'text-[#808080]'
                          }`}
                        >
                          {bt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#808080] mb-2.5">
                Gaya nyatat yang kamu suka
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      id: 'cepat',
                      title: 'Santai & Cepat',
                      desc: 'Cukup porsi, sisa adonan & belanja utama',
                    },
                    {
                      id: 'rinci',
                      title: 'Lengkap & Detail',
                      desc: 'Ikut catat timbangan bahan & meteran',
                    },
                  ] as const
                ).map((m) => {
                  const active = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`p-4 rounded-[22px] text-left transition cursor-pointer ${
                        active
                          ? 'bg-[var(--ink)] text-[var(--bg-paper)]'
                          : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)]'
                      }`}
                    >
                      <div className="font-serif text-base">
                        {m.title}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          active ? 'opacity-75' : 'text-[#808080]'
                        }`}
                      >
                        {m.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[56px] pl-6 pr-3 py-2 pill-cta-lime flex items-center justify-between cursor-pointer"
            >
              <span className="font-serif text-lg">
                Lanjut pilih bahan belanjaan
              </span>
              <span className="w-10 h-10 rounded-full bg-[#0F0F0F] text-white flex items-center justify-center">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </div>
        )}

        {/* STEP 2: Catalog Items */}
        {step === 2 && (
          <div key="step-2" className="space-y-4 apple-scale-in">
            <p className="text-xs sm:text-sm text-[#808080]">
              Kami sudah siapkan daftar belanjaan yang biasa dipakai. Hapus atau tambah kalau ada yang kurang.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {catalog.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 rounded-2xl bg-[var(--bg-paper-subtle)] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--ink)]">
                      {item.name}
                    </div>
                    <div className="text-xs text-[#808080] font-mono">
                      {item.kind === 'kemasan' ? 'Kemasan' : 'Bahan'} • Rp{' '}
                      {item.unit_cost.toLocaleString('id-ID')}/{item.unit}
                      {item.is_single_use ? ' • Sekali pakai' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Hapus ${item.name}`}
                    onClick={() =>
                      setCatalog((prev) => prev.filter((c) => c.id !== item.id))
                    }
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#FF5A36] hover:bg-black/20 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Row */}
            <div className="p-4 rounded-[22px] bg-[var(--bg-paper)] border border-[var(--line)] space-y-3">
              <div className="text-xs font-medium text-[#808080]">
                Tambah barang langganan lain
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Misal: Tepung beras, plastik es..."
                  className="flex-1 min-h-[44px] px-3.5 nota-input-line text-sm"
                />
                <select
                  aria-label="Jenis barang"
                  value={newItemKind}
                  onChange={(e) =>
                    setNewItemKind(e.target.value as 'bahan' | 'kemasan')
                  }
                  className="min-h-[44px] px-3 nota-input-line text-xs font-medium"
                >
                  <option value="bahan">Bahan</option>
                  <option value="kemasan">Kemasan</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="Harga satuan (Rp)"
                  className="flex-1 min-h-[44px] px-3.5 nota-input-line text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="min-h-[44px] px-4 nota-btn-leaf text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </button>
                <label className="min-h-[44px] px-3.5 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                  <Camera className="w-4 h-4 text-[#C7FF2E]" />
                  Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoCatalogQuickAdd}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[52px] px-5 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 min-h-[52px] pl-5 pr-2.5 pill-cta-lime flex items-center justify-between cursor-pointer"
              >
                <span className="font-serif text-base sm:text-lg">
                  Lanjut ke takaran dapur
                </span>
                <span className="w-9 h-9 rounded-full bg-[#0F0F0F] text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Units & Energy Sources */}
        {step === 3 && (
          <div key="step-3" className="space-y-5 apple-scale-in">
            <div>
              <span className="block text-xs font-medium text-[#808080] mb-2.5">
                Kalau ada sisa adonan/makanan, paling gampang diukur pakai apa?
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'baskom', label: 'Baskom', sub: '≈ 2,5 kg' },
                    { id: 'kg', label: 'Kilogram', sub: 'Timbangan kg' },
                    { id: 'porsi', label: 'Porsi', sub: '≈ 0,25 kg' },
                  ] as const
                ).map((u) => {
                  const active = defaultWasteUnit === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setDefaultWasteUnit(u.id)}
                      className={`min-h-[64px] p-3 rounded-[20px] text-center transition cursor-pointer ${
                        active
                          ? 'bg-[#C7FF2E] text-[#0F0F0F]'
                          : 'bg-[var(--bg-paper-subtle)] text-[var(--ink)]'
                      }`}
                    >
                      <div className="font-serif text-base">
                        {u.label}
                      </div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          active ? 'text-[#0F0F0F]/75' : 'text-[#808080]'
                        }`}
                      >
                        {u.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#808080] mb-2.5">
                Di warung pakai listrik, gas, dan air apa saja?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'listrik', label: 'Listrik PLN (Token / Bulanan)' },
                  { id: 'lpg_3kg', label: 'Gas LPG 3 kg (Melon)' },
                  { id: 'lpg_12kg', label: 'Gas LPG 12 kg' },
                  { id: 'pdam', label: 'Air PDAM / Sumur Pompa' },
                ].map((src) => {
                  const active = energySources.includes(src.id);
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => toggleEnergy(src.id)}
                      className={`min-h-[50px] px-4 py-3 rounded-full text-left text-xs font-medium flex items-center justify-between gap-2 transition cursor-pointer ${
                        active
                          ? 'bg-[var(--ink)] text-[var(--bg-paper)]'
                          : 'bg-[var(--bg-paper-subtle)] text-[#808080]'
                      }`}
                    >
                      <span>{src.label}</span>
                      {active && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[52px] px-5 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                type="button"
                onClick={handleFinish}
                data-testid="btn-finish-onboarding"
                className="flex-1 min-h-[52px] pl-5 pr-2.5 pill-cta-lime flex items-center justify-between cursor-pointer"
              >
                <span className="font-serif text-base sm:text-lg">
                  Buka buku warung sekarang
                </span>
                <span className="w-9 h-9 rounded-full bg-[#0F0F0F] text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
