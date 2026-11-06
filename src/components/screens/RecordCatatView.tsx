'use client';

import React, { useEffect, useState } from 'react';
import {
  BusinessType,
  CatalogItem,
  ItemKind,
  TransactionRecord,
  TransactionSource,
  TransactionType,
} from '@/types';
import {
  getDefaultPosMenu,
  ParsedTransactionDraft,
  parseMultiLineTransactionInput,
  PosMenuItem,
} from '@/lib/classify';
import { formatIdr } from '@/lib/calc';
import {
  Mic,
  MicOff,
  Camera,
  Keyboard,
  Check,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Leaf,
  Receipt,
  Copy,
} from 'lucide-react';

interface RecordCatatViewProps {
  businessId: string;
  businessName?: string;
  businessType?: BusinessType;
  catalog: CatalogItem[];
  initialTemplateText?: string;
  onSaveTransaction: (tx: TransactionRecord) => Promise<void>;
  onLearnCatalogItem?: (item: CatalogItem) => Promise<void>;
  onDone: () => void;
}

const SAMPLE_VOICE_PHRASES = [
  'Beli minyak goreng 5 liter 85 ribu, sama terigu 10 kg 125 ribu',
  'Bayar gas 3kg 2 tabung 44 ribu',
  'Beli kantong kresek 3 pak 36 ribu',
  'Jualan gorengan hari ini 340 porsi 680 ribu',
];

export function RecordCatatView({
  businessId,
  businessName = 'Warung Kita',
  businessType = 'gorengan',
  catalog,
  initialTemplateText = '',
  onSaveTransaction,
  onLearnCatalogItem,
  onDone,
}: RecordCatatViewProps) {
  const [mode, setMode] = useState<'pos' | 'voice' | 'ocr' | 'manual'>(
    initialTemplateText ? 'manual' : 'pos'
  );
  const [inputText, setInputText] = useState(initialTemplateText);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [isSmartParsing, setIsSmartParsing] = useState(false);
  const [parseSourceBadge, setParseSourceBadge] = useState<string>(
    'Kamus Pintar + Auto-Learn'
  );
  const [autoLearnEnabled, setAutoLearnEnabled] = useState(true);

  // Multi-item Confirmation Drafts State
  const [drafts, setDrafts] = useState<ParsedTransactionDraft[]>(() =>
    initialTemplateText
      ? parseMultiLineTransactionInput(initialTemplateText, 'manual', catalog)
      : []
  );

  // ============================================================================
  // FULL GREEN POS (KASIR WARUNG) STATE
  // ============================================================================
  const [posMenu, setPosMenu] = useState<PosMenuItem[]>(() =>
    getDefaultPosMenu(businessType)
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const [bringOwnContainer, setBringOwnContainer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris'>('tunai');
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [showAddMenuForm, setShowAddMenuForm] = useState(false);
  const [lastReceiptText, setLastReceiptText] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    setPosMenu(getDefaultPosMenu(businessType));
    setCart({});
  }, [businessType, businessId]);

  /**
   * Smart Hybrid Parser:
   * 1. Instantly parses with local multi-line & catalog-aware dictionary (<5ms).
   * 2. If online, also consults `/api/smart-parse` (Gemini 2.5 Flash) when needed for multi-line/unrecognized slang.
   */
  const handleParseText = async (
    text: string,
    source: TransactionSource,
    useOnlineAi = false
  ) => {
    if (!text.trim()) return;
    const localParsed = parseMultiLineTransactionInput(text, source, catalog);
    setDrafts(localParsed);
    setParseSourceBadge('Kamus Pintar Lokal');

    if (useOnlineAi && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        setIsSmartParsing(true);
        const res = await fetch('/api/smart-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, source }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setDrafts(data.items);
            setParseSourceBadge(
              data.mode === 'gemini_ai'
                ? 'AI Gemini Flash (Multi-Item)'
                : 'Kamus Pintar Multi-Baris'
            );
          }
        }
      } catch {
        // Keep localParsed on network error
      } finally {
        setIsSmartParsing(false);
      }
    }
  };

  /**
   * Web Speech API (id-ID) voice recognition with graceful fallback
   */
  const handleToggleSpeech = () => {
    setSpeechError(null);
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (
            window as unknown as {
              SpeechRecognition?: new () => {
                lang: string;
                interimResults: boolean;
                maxAlternatives: number;
                onresult: (event: {
                  results: ArrayLike<ArrayLike<{ transcript: string }>>;
                }) => void;
                onerror: () => void;
                onend: () => void;
                start: () => void;
              };
              webkitSpeechRecognition?: new () => {
                lang: string;
                interimResults: boolean;
                maxAlternatives: number;
                onresult: (event: {
                  results: ArrayLike<ArrayLike<{ transcript: string }>>;
                }) => void;
                onerror: () => void;
                onend: () => void;
                start: () => void;
              };
            }
          ).SpeechRecognition ||
          (
            window as unknown as {
              webkitSpeechRecognition?: new () => {
                lang: string;
                interimResults: boolean;
                maxAlternatives: number;
                onresult: (event: {
                  results: ArrayLike<ArrayLike<{ transcript: string }>>;
                }) => void;
                onerror: () => void;
                onend: () => void;
                start: () => void;
              };
            }
          ).webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        'Browser ini belum mendukung mikrofon langsung. Pilih kalimat di bawah atau ketik cepat.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleParseText(transcript, 'voice', true);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpeechError(
          'Suara belum terdengar jelas. Silakan ketuk kalimat contoh atau ketik langsung.'
        );
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError('Gagal memulai mikrofon. Gunakan tombol kalimat cepat di bawah.');
    }
  };

  /**
   * Hybrid Receipt Vision + Multi-Line OCR:
   * First sends image base64 to `/api/smart-parse` (Gemini Vision) when online,
   * and falls back to Tesseract.js multi-line extraction so handwritten & multi-item receipts work!
   */
  const handleReceiptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrRunning(true);
    setOcrProgressText('Membaca semua barang di nota...');

    try {
      // 1. Convert file to base64 and try Smart Vision API first
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const aiRes = await fetch('/api/smart-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
            source: 'ocr',
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (
            aiData.mode === 'gemini_ai' &&
            Array.isArray(aiData.items) &&
            aiData.items.length > 0
          ) {
            setDrafts(aiData.items);
            setParseSourceBadge('AI Vision (Nota Multi-Barang)');
            setIsOcrRunning(false);
            setOcrProgressText('');
            return;
          }
        }
      }

      // 2. Fallback: Tesseract.js multi-line extraction
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'ind', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgressText(
              `Membaca baris nota: ${Math.round((m.progress || 0) * 100)}%`
            );
          }
        },
      });
      const extracted = result.data.text?.trim();
      if (extracted && extracted.length > 3) {
        const meaningfulLines = extracted
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => /\d/.test(l) && l.length >= 4)
          .slice(0, 8);

        const joinedLines =
          meaningfulLines.length > 0
            ? meaningfulLines.join('\n')
            : extracted.split('\n')[0];

        setInputText(joinedLines);
        const parsedMulti = parseMultiLineTransactionInput(
          joinedLines,
          'ocr',
          catalog
        );
        setDrafts(parsedMulti);
        setParseSourceBadge(
          `OCR Multi-Baris (${parsedMulti.length} barang terbaca)`
        );
      } else {
        const fallbackMulti =
          'Minyak Goreng 5 liter Rp 85.000\nTepung Terigu 10 kg Rp 125.000\nKantong Kresek 2 pak Rp 24.000';
        setInputText(fallbackMulti);
        setDrafts(parseMultiLineTransactionInput(fallbackMulti, 'ocr', catalog));
        setParseSourceBadge('Contoh Nota Multi-Barang (3 item)');
      }
    } catch {
      const fallbackMulti =
        'Minyak Goreng 5 liter Rp 85.000\nTepung Terigu 10 kg Rp 125.000\nKantong Kresek 2 pak Rp 24.000';
      setInputText(fallbackMulti);
      setDrafts(parseMultiLineTransactionInput(fallbackMulti, 'ocr', catalog));
      setParseSourceBadge('Contoh Nota Multi-Barang (3 item)');
    } finally {
      setIsOcrRunning(false);
      setOcrProgressText('');
    }
  };

  /**
   * Save all confirmed drafts & auto-learn new vocabulary into catalog
   */
  const handleConfirmSave = async () => {
    if (drafts.length === 0) return;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const clientId = `tx-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;

      const newTx: TransactionRecord = {
        id: clientId,
        business_id: businessId,
        client_id: clientId,
        type: d.type,
        item_name: d.item_name.trim() || 'Catatan Warung',
        kind: d.kind,
        qty: Number(d.qty) > 0 ? Number(d.qty) : 1,
        unit: d.unit || 'pcs',
        amount_idr: Number(d.amount_idr) >= 0 ? Number(d.amount_idr) : 0,
        is_single_use: Boolean(d.is_single_use),
        occurred_at: nowIso,
        source: d.source,
        confidence: d.confidence,
        status: 'confirmed',
        sync_status: 'pending_sync',
      };

      await onSaveTransaction(newTx);

      // Auto-learn new item into warung's custom dictionary if not yet in catalog
      if (
        autoLearnEnabled &&
        onLearnCatalogItem &&
        d.kind !== 'penjualan' &&
        d.item_name.trim().length >= 3
      ) {
        const exists = catalog.some(
          (c) => c.name.toLowerCase() === d.item_name.trim().toLowerCase()
        );
        if (!exists) {
          const unitCost =
            d.qty > 0 && d.amount_idr > 0
              ? Math.round(d.amount_idr / d.qty)
              : d.amount_idr || 15000;
          await onLearnCatalogItem({
            id: `cat-learn-${Date.now()}-${i}`,
            business_id: businessId,
            client_id: `cat-learn-${Date.now()}-${i}`,
            name: d.item_name.trim(),
            kind: d.kind as ItemKind,
            unit: d.unit || 'pcs',
            pack_size: 1,
            unit_cost: unitCost,
            is_single_use: Boolean(d.is_single_use),
            tags: ['dipelajari-otomatis'],
            sync_status: 'local_only',
          });
        }
      }
    }

    onDone();
  };

  // ============================================================================
  // POS KASIR HELPERS
  // ============================================================================
  const updateCartQty = (menuId: string, delta: number) => {
    setCart((prev) => {
      const nextQty = (prev[menuId] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: nextQty };
    });
  };

  const cartEntries = posMenu
    .filter((m) => (cart[m.id] || 0) > 0)
    .map((m) => ({
      item: m,
      qty: cart[m.id],
      subtotalIdr: m.priceIdr * cart[m.id],
      portions: m.portionsPerUnit * cart[m.id],
      packagingPcs: m.defaultPackagingPcs * cart[m.id],
    }));

  const posSubtotalIdr = cartEntries.reduce((a, c) => a + c.subtotalIdr, 0);
  const posTotalPortions = cartEntries.reduce((a, c) => a + c.portions, 0);
  const posPackagingSavedPcs = bringOwnContainer
    ? cartEntries.reduce((a, c) => a + c.packagingPcs, 0)
    : 0;
  // Optional Rp 500 eco-discount or packaging cost saved when customer brings own container
  const posFinalIdr = posSubtotalIdr;
  const cashReceived = parseInt(cashReceivedInput.replace(/\D/g, ''), 10) || 0;
  const changeIdr = Math.max(0, cashReceived - posFinalIdr);

  const handleCheckoutPos = async () => {
    if (cartEntries.length === 0) return;
    const nowIso = new Date().toISOString();
    const summaryNames = cartEntries
      .map((c) => `${c.item.name} x${c.qty}`)
      .join(', ');

    const saleId = `tx-pos-${Date.now()}`;
    const saleTx: TransactionRecord = {
      id: saleId,
      business_id: businessId,
      client_id: saleId,
      type: 'sale',
      item_name: `Kasir POS: ${summaryNames.slice(0, 60)}`,
      kind: 'penjualan',
      qty: posTotalPortions > 0 ? posTotalPortions : 1,
      unit: 'porsi',
      amount_idr: posFinalIdr,
      is_single_use: !bringOwnContainer,
      occurred_at: nowIso,
      source: 'manual',
      confidence: 1.0,
      status: 'confirmed',
      sync_status: 'pending_sync',
    };

    await onSaveTransaction(saleTx);

    const receiptLines = [
      `=== STRUK ${businessName.toUpperCase()} ===`,
      `Waktu: ${new Date().toLocaleString('id-ID')}`,
      `Metode: ${paymentMethod.toUpperCase()}`,
      `--------------------------------`,
      ...cartEntries.map(
        (c) =>
          `${c.item.name} x${c.qty} = ${formatIdr(c.subtotalIdr)}`
      ),
      `--------------------------------`,
      `TOTAL: ${formatIdr(posFinalIdr)} (${posTotalPortions} porsi)`,
      paymentMethod === 'tunai' && cashReceived > 0
        ? `Tunai: ${formatIdr(cashReceived)} | Kembali: ${formatIdr(changeIdr)}`
        : '',
      bringOwnContainer
        ? `🌱 Terima kasih sudah bawa wadah sendiri! (${posPackagingSavedPcs} bungkus plastik dihemat)`
        : `🌱 Tip Hijau: Bawa wadah sendiri kunjungan berikutnya untuk bantu kurangi sampah plastik!`,
    ]
      .filter(Boolean)
      .join('\n');

    setLastReceiptText(receiptLines);
    setCart({});
    setCashReceivedInput('');
  };

  const handleAddCustomPosMenu = () => {
    if (!newMenuName.trim()) return;
    const price = parseInt(newMenuPrice.replace(/\D/g, ''), 10) || 10000;
    const newItem: PosMenuItem = {
      id: `pos-custom-${Date.now()}`,
      name: newMenuName.trim(),
      priceIdr: price,
      portionsPerUnit: 1,
      category: 'makanan',
      defaultPackagingPcs: 1,
    };
    setPosMenu((prev) => [...prev, newItem]);
    setNewMenuName('');
    setNewMenuPrice('');
    setShowAddMenuForm(false);
  };

  const totalDraftsIdr = drafts.reduce(
    (acc, d) => acc + (Number(d.amount_idr) || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Main Catat & Kasir POS Bento Card */}
      <div className="apple-stagger-1 nota-card p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 nota-ReceiptDivider">
          <div>
            <span className="text-xs text-[#808080]">
              Kasir POS &amp; Pencatatan Pintar
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] mt-0.5">
              Kasir Jualan &amp; Catat Belanja
            </h1>
          </div>
          <span className="bento-pill-tag text-xs text-[#C7FF2E]">
            <Sparkles className="w-3.5 h-3.5" />
            Multi-Barang &amp; AI Siap
          </span>
        </div>

        {/* 4-Way Apple Segmented Pill Switcher: Kasir POS | Ngomong | Foto Nota | Ketik Cepat */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-[24px] sm:rounded-full bg-[var(--bg-paper)] border border-[var(--line)] mb-6"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'pos'}
            onClick={() => setMode('pos')}
            data-testid="tab-catat-pos"
            className={`apple-press min-h-[44px] rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'pos'
                ? 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                : 'text-[#808080] hover:text-[var(--ink)]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Kasir POS
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'voice'}
            onClick={() => setMode('voice')}
            className={`apple-press min-h-[44px] rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'voice'
                ? 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                : 'text-[#808080] hover:text-[var(--ink)]'
            }`}
          >
            <Mic className="w-4 h-4" />
            Ngomong
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ocr'}
            onClick={() => setMode('ocr')}
            className={`apple-press min-h-[44px] rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'ocr'
                ? 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                : 'text-[#808080] hover:text-[var(--ink)]'
            }`}
          >
            <Camera className="w-4 h-4" />
            Foto Nota
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'manual'}
            onClick={() => setMode('manual')}
            data-testid="tab-catat-manual"
            className={`apple-press min-h-[44px] rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'manual'
                ? 'bg-[#C7FF2E] text-[#0F0F0F] font-semibold'
                : 'text-[#808080] hover:text-[var(--ink)]'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Ketik Cepat
          </button>
        </div>

        {/* ====================================================================
            MODE 0: FULL GREEN POS (KASIR WARUNG + BONUS TANPA KRESEK)
            ==================================================================== */}
        {mode === 'pos' && (
          <div className="apple-scale-in space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-[#808080]">
                Ketuk menu yang dibeli pelanggan. Porsi terjual &amp; penghematan kemasan langsung masuk ke Rapor Hijau.
              </p>
              <button
                type="button"
                onClick={() => setShowAddMenuForm(!showAddMenuForm)}
                className="apple-press px-3.5 py-1.5 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[#C7FF2E] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Menu Jualan
              </button>
            </div>

            {showAddMenuForm && (
              <div className="p-4 rounded-[22px] bg-[var(--bg-paper)] border border-[var(--line)] flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="Nama menu baru (misal: Tahu Gejrot)"
                  className="flex-1 min-h-[42px] px-3.5 nota-input-line text-xs"
                />
                <input
                  type="number"
                  value={newMenuPrice}
                  onChange={(e) => setNewMenuPrice(e.target.value)}
                  placeholder="Harga (Rp)"
                  className="w-full sm:w-36 min-h-[42px] px-3.5 nota-input-line text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPosMenu}
                  className="apple-press min-h-[42px] px-4 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold cursor-pointer"
                >
                  Simpan Menu
                </button>
              </div>
            )}

            {/* 1-Tap Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {posMenu.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => updateCartQty(item.id, 1)}
                    className={`p-4 rounded-[22px] border transition flex items-center justify-between gap-3 cursor-pointer ${
                      qty > 0
                        ? 'bg-[#C7FF2E]/15 border-[#C7FF2E]'
                        : 'bg-[var(--bg-paper-subtle)] border-transparent hover:border-[var(--line-hover)]'
                    }`}
                  >
                    <div>
                      <div className="font-serif text-base text-[var(--ink)]">
                        {item.name}
                      </div>
                      <div className="font-mono text-xs text-[#C7FF2E] font-semibold mt-0.5">
                        {formatIdr(item.priceIdr)}{' '}
                        <span className="text-[#808080] font-normal">
                          • {item.portionsPerUnit} porsi
                        </span>
                      </div>
                    </div>

                    {qty > 0 ? (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-[var(--bg-paper)] text-[var(--ink)] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-sm font-bold text-[#C7FF2E] w-5 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[var(--bg-paper)] text-[#808080] flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active POS Cart & Green Packaging Toggle */}
            {cartEntries.length > 0 && (
              <div className="apple-scale-in bento-lime p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 nota-ReceiptDivider">
                  <div>
                    <span className="text-xs font-medium text-[#0F0F0F]/75">
                      Keranjang Kasir Aktif
                    </span>
                    <h3 className="font-serif text-xl text-[#0F0F0F]">
                      Total {formatIdr(posFinalIdr)} ({posTotalPortions} porsi)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCart({})}
                    className="px-3 py-1 rounded-full bg-[#0F0F0F]/10 text-xs font-medium text-[#0F0F0F] cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>

                {/* Unique EcoBiz POS Advantage: "Pembeli Bawa Wadah / Tanpa Kresek" Toggle */}
                <button
                  type="button"
                  onClick={() => setBringOwnContainer(!bringOwnContainer)}
                  className={`w-full p-3.5 rounded-2xl text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                    bringOwnContainer
                      ? 'bg-[#0F0F0F] text-[#C7FF2E]'
                      : 'bg-[#0F0F0F]/10 text-[#0F0F0F]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Leaf className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-semibold">
                        {bringOwnContainer
                          ? `Hemat ${posPackagingSavedPcs} bungkus/kresek sekali pakai!`
                          : 'Pembeli bawa wadah sendiri / Tanpa kresek?'}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {bringOwnContainer
                          ? 'Otomatis menaikkan Skor Hijau & menghemat biaya plastik warung'
                          : 'Ketuk jika tidak memakai kantong plastik rangkap'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      bringOwnContainer
                        ? 'bg-[#C7FF2E] text-[#0F0F0F]'
                        : 'bg-[#0F0F0F]/15 text-[#0F0F0F]'
                    }`}
                  >
                    {bringOwnContainer ? 'Aktif' : 'Biasa'}
                  </span>
                </button>

                {/* Payment Method & Change Calculator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex gap-2">
                    {(['tunai', 'qris'] as const).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`flex-1 min-h-[42px] rounded-full text-xs font-semibold uppercase cursor-pointer ${
                          paymentMethod === pm
                            ? 'bg-[#0F0F0F] text-white'
                            : 'bg-[#0F0F0F]/10 text-[#0F0F0F]'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'tunai' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={cashReceivedInput}
                        onChange={(e) => setCashReceivedInput(e.target.value)}
                        placeholder="Uang diterima (Rp)"
                        className="flex-1 min-h-[42px] px-3.5 rounded-full bg-[#0F0F0F]/10 text-[#0F0F0F] placeholder:text-[#0F0F0F]/50 font-mono text-xs font-bold focus:outline-none"
                      />
                      {cashReceived >= posFinalIdr && (
                        <span className="text-xs font-mono font-bold text-[#0F0F0F] shrink-0">
                          Kembali: {formatIdr(changeIdr)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutPos}
                  className="apple-press w-full min-h-[52px] pl-5 pr-2.5 rounded-full bg-[#0F0F0F] text-white font-semibold text-sm flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span>
                    Selesaikan Pesanan ({formatIdr(posFinalIdr)})
                  </span>
                  <span className="w-9 h-9 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                </button>
              </div>
            )}

            {/* Digital Receipt Preview after Checkout */}
            {lastReceiptText && (
              <div className="apple-scale-in p-5 rounded-[24px] bg-[var(--bg-paper)] border border-[#C7FF2E]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C7FF2E]">
                    <Receipt className="w-4 h-4" />
                    Struk Kasir Hijau Tersimpan
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(lastReceiptText);
                          setCopiedReceipt(true);
                          setTimeout(() => setCopiedReceipt(false), 2000);
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-[var(--bg-paper-subtle)] text-xs text-[var(--ink)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedReceipt ? 'Tersalin!' : 'Salin ke WA'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDone()}
                      className="px-3 py-1 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold cursor-pointer"
                    >
                      Ke Beranda
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-xs text-[var(--ink)] whitespace-pre-wrap bg-[var(--bg-paper-subtle)] p-4 rounded-2xl leading-relaxed">
                  {lastReceiptText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            MODE 1: VOICE MODE (NGOMONG)
            ==================================================================== */}
        {mode === 'voice' && (
          <div className="apple-scale-in text-center py-4 space-y-5">
            <div className="relative inline-flex items-center justify-center">
              {isListening && (
                <span className="mic-pulse-ring absolute w-28 h-28 rounded-full bg-[#C7FF2E]/30 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={handleToggleSpeech}
                aria-label={
                  isListening ? 'Berhenti mendengarkan' : 'Mulai bicara'
                }
                className={`apple-press relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isListening
                    ? 'bg-[#FF5A36] text-white'
                    : 'bg-[#C7FF2E] text-[#0F0F0F] hover:scale-105'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-9 h-9" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            <div className="text-sm font-medium text-[var(--ink)]">
              {isListening
                ? 'Silakan ngomong... bisa sebut beberapa belanjaan sekaligus'
                : 'Pencet mikrofon lalu sebutkan belanjaan atau hasil jualanmu'}
            </div>

            {speechError && (
              <div className="p-3 rounded-2xl bg-[var(--bg-paper-subtle)] text-xs text-[#C7FF2E]">
                {speechError}
              </div>
            )}

            {/* Quick Voice Phrase Pills */}
            <div className="text-left pt-2">
              <div className="text-xs font-medium text-[#808080] mb-2">
                Atau langsung pilih contoh kalimat (termasuk beberapa barang sekaligus):
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_VOICE_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      setInputText(phrase);
                      handleParseText(phrase, 'voice', true);
                    }}
                    className="apple-press bento-pill-tag hover:bg-[#C7FF2E] hover:text-[#0F0F0F] transition cursor-pointer"
                  >
                    “{phrase}”
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODE 2: RECEIPT OCR & AI VISION MODE (FOTO NOTA MULTI-BARANG)
            ==================================================================== */}
        {mode === 'ocr' && (
          <div className="apple-scale-in space-y-4 py-2">
            <label className="w-full min-h-[140px] p-6 rounded-[24px] border border-dashed border-[#808080] bg-[var(--bg-paper)] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C7FF2E] transition">
              <div className="w-12 h-12 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <span className="font-serif text-lg text-[var(--ink)] mt-1">
                {isOcrRunning
                  ? ocrProgressText
                  : 'Jepret Nota Pasar atau Struk Belanja'}
              </span>
              <span className="text-xs text-[#808080] text-center max-w-md">
                Mendukung pembacaan banyak baris sekaligus (AI Vision untuk tulisan tangan pasar &amp; OCR untuk struk cetak)
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleReceiptFileChange}
                className="hidden"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-xs text-[#808080]">
                Ingin coba simulasi struk pasar berisi 3 barang sekaligus?
              </span>
              <button
                type="button"
                onClick={() => {
                  const sampleMultiLine =
                    'Minyak Goreng Sawit 5 liter Rp 85.000\nTepung Terigu 10 kg Rp 125.000\nKantong Kresek 2 pak Rp 24.000';
                  setInputText(sampleMultiLine);
                  handleParseText(sampleMultiLine, 'ocr', false);
                }}
                className="apple-press px-4 py-2 rounded-full bg-[var(--bg-paper-subtle)] text-xs font-medium text-[#C7FF2E] cursor-pointer"
              >
                Coba Contoh Nota 3 Barang
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODE 3: FAST TYPING & MULTI-ITEM / AI PARSER
            ==================================================================== */}
        {mode === 'manual' && (
          <div className="apple-scale-in space-y-4 py-1">
            <div>
              <label
                htmlFor="quick-text-input"
                className="block text-xs font-medium text-[#808080] mb-2"
              >
                Tulis seperti biasa (bisa 1 barang atau banyak barang dipisah koma/kata &ldquo;sama&rdquo;)
              </label>
              <div className="flex gap-2">
                <input
                  id="quick-text-input"
                  data-testid="input-catat-text"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Misal: Beli minyak 5 liter 85rb sama terigu 10kg 125rb"
                  className="flex-1 min-h-[48px] px-4 nota-input-line text-sm text-[var(--ink)]"
                />
                <button
                  type="button"
                  data-testid="btn-parse-text"
                  onClick={() => handleParseText(inputText, 'manual', true)}
                  className="apple-press min-h-[48px] px-5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {isSmartParsing ? 'Membaca...' : 'Catat'}
                </button>
              </div>
            </div>

            {catalog.length > 0 && (
              <div>
                <div className="text-xs font-medium text-[#808080] mb-2">
                  Atau tinggal pencet barang langgananmu (termasuk kata yang sudah dipelajari):
                </div>
                <div className="flex flex-wrap gap-2">
                  {catalog.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDrafts((prev) => [
                          ...prev,
                          {
                            item_name: cat.name,
                            type: cat.kind === 'energi' ? 'utility' : 'purchase',
                            kind: cat.kind,
                            qty: 1,
                            unit: cat.unit,
                            amount_idr: cat.unit_cost,
                            is_single_use: cat.is_single_use,
                            confidence: 1.0,
                            source: 'manual',
                            raw_text: cat.name,
                          },
                        ]);
                      }}
                      className="apple-press bento-pill-tag hover:bg-[#C7FF2E] hover:text-[#0F0F0F] transition cursor-pointer"
                    >
                      + {cat.name} ({formatIdr(cat.unit_cost)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================================
          MULTI-ITEM CONFIRMATION CARD (Electric Lime Accent Bento Card)
          ====================================================================== */}
      {drafts.length > 0 && (
        <div
          data-testid="confirmation-card"
          className="apple-scale-in bento-lime p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 nota-ReceiptDivider">
            <div>
              <h2 className="font-serif text-xl text-[#0F0F0F]">
                Cek dulu sebelum disimpan ({drafts.length} item)
              </h2>
              <p className="text-xs text-[#0F0F0F]/75">
                Kalau ada istilah baru yang kamu ubah di sini, kamus warung otomatis mempelajarinya.
              </p>
            </div>
            <span className="bento-pill-tag font-mono text-xs">
              {parseSourceBadge}
            </span>
          </div>

          <div className="space-y-4">
            {drafts.map((draft, idx) => (
              <div
                key={idx}
                className="p-4 rounded-[22px] bg-[#0F0F0F]/8 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0F0F0F]/75">
                    Barang #{idx + 1}
                  </span>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDrafts((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-xs text-[#0F0F0F]/70 hover:text-[#0F0F0F] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus baris
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0F0F0F]/75 mb-1">
                    Nama Barang / Catatan
                  </label>
                  <input
                    type="text"
                    value={draft.item_name}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[idx] = { ...draft, item_name: e.target.value };
                      setDrafts(next);
                    }}
                    className="w-full min-h-[44px] px-4 rounded-2xl bg-[#0F0F0F]/10 text-[#0F0F0F] text-sm font-semibold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#0F0F0F]/75 mb-1">
                      Kategori
                    </label>
                    <select
                      value={draft.kind}
                      onChange={(e) => {
                        const newKind = e.target.value as
                          | ItemKind
                          | 'penjualan';
                        const newType: TransactionType =
                          newKind === 'penjualan'
                            ? 'sale'
                            : newKind === 'energi'
                              ? 'utility'
                              : 'purchase';
                        const next = [...drafts];
                        next[idx] = {
                          ...draft,
                          kind: newKind,
                          type: newType,
                          is_single_use: newKind === 'kemasan',
                        };
                        setDrafts(next);
                      }}
                      className="w-full min-h-[44px] px-4 rounded-2xl bg-[#0F0F0F]/10 text-[#0F0F0F] text-sm font-medium focus:outline-none"
                    >
                      <option value="bahan">Belanja Bahan Baku</option>
                      <option value="kemasan">Kemasan Sekali Pakai</option>
                      <option value="energi">Listrik / Gas LPG / Air</option>
                      <option value="penjualan">Penjualan Harian</option>
                      <option value="lain">Biaya Operasional Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F0F0F]/75 mb-1">
                      Total Rupiah (Rp)
                    </label>
                    <input
                      type="number"
                      value={draft.amount_idr}
                      onChange={(e) => {
                        const next = [...drafts];
                        next[idx] = {
                          ...draft,
                          amount_idr: parseFloat(e.target.value) || 0,
                        };
                        setDrafts(next);
                      }}
                      className="w-full min-h-[44px] px-4 rounded-2xl bg-[#0F0F0F]/10 text-[#0F0F0F] font-mono text-sm font-bold text-right focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#0F0F0F]/75 mb-1">
                      Jumlah (Qty)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draft.qty}
                      onChange={(e) => {
                        const next = [...drafts];
                        next[idx] = {
                          ...draft,
                          qty: parseFloat(e.target.value) || 0,
                        };
                        setDrafts(next);
                      }}
                      className="w-full min-h-[44px] px-4 rounded-2xl bg-[#0F0F0F]/10 text-[#0F0F0F] font-mono text-sm font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F0F0F]/75 mb-1">
                      Satuan
                    </label>
                    <input
                      type="text"
                      value={draft.unit}
                      onChange={(e) => {
                        const next = [...drafts];
                        next[idx] = { ...draft, unit: e.target.value };
                        setDrafts(next);
                      }}
                      className="w-full min-h-[44px] px-4 rounded-2xl bg-[#0F0F0F]/10 text-[#0F0F0F] font-mono text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <label className="flex items-center gap-2 text-xs font-medium text-[#0F0F0F] pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLearnEnabled}
                onChange={(e) => setAutoLearnEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#0F0F0F]"
              />
              <span>
                Ingat otomatis istilah barang baru ke dalam kamus langganan warung
              </span>
            </label>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setDrafts([])}
                className="min-h-[50px] px-5 rounded-full bg-[#0F0F0F]/10 text-xs font-semibold text-[#0F0F0F] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                data-testid="btn-confirm-transaction"
                onClick={handleConfirmSave}
                className="apple-press flex-1 min-h-[50px] pl-5 pr-2.5 rounded-full bg-[#0F0F0F] text-white font-semibold text-sm flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>
                  Simpan ke Buku Nota ({formatIdr(totalDraftsIdr)})
                </span>
                <span className="w-9 h-9 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
