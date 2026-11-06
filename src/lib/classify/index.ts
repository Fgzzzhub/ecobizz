import {
  BusinessType,
  CatalogItem,
  ItemKind,
  TransactionSource,
  TransactionType,
} from '@/types';

export interface KeywordRule {
  keywords: string[];
  type: TransactionType;
  kind: ItemKind | 'penjualan';
  defaultUnit: string;
  isSingleUse: boolean;
  canonicalName: string;
}

/**
 * Deterministic keyword dictionary for Indonesian culinary MSMEs (warung makan, gorengan, kedai kopi, katering).
 */
export const KEYWORD_DICTIONARY: KeywordRule[] = [
  // Energy & Utilities
  {
    keywords: [
      'token listrik',
      'listrik',
      'pln',
      'kwh',
      'pulsa listrik',
      'setrum',
      'tagihan listrik',
    ],
    type: 'utility',
    kind: 'energi',
    defaultUnit: 'kWh',
    isSingleUse: false,
    canonicalName: 'Token Listrik PLN',
  },
  {
    keywords: [
      'gas 3kg',
      'gas 3 kg',
      'lpg',
      'elpiji',
      'tabung gas',
      'gas melon',
      'gas 12kg',
      'gas ijo',
      'gas pink',
      'bright gas',
    ],
    type: 'utility',
    kind: 'energi',
    defaultUnit: 'tabung',
    isSingleUse: false,
    canonicalName: 'Gas LPG 3 kg',
  },
  {
    keywords: [
      'pdam',
      'air bersih',
      'tagihan air',
      'air galon',
      'isi ulang galon',
      'galon',
      'air isi ulang',
      'air tangki',
    ],
    type: 'utility',
    kind: 'energi',
    defaultUnit: 'm3',
    isSingleUse: false,
    canonicalName: 'Air Bersih / Galon',
  },

  // Single-use Packaging (Kemasan Sekali Pakai)
  {
    keywords: [
      'kresek',
      'kantong plastik',
      'plastik kresek',
      'plastik bening',
      'plastik klip',
      'plastik es',
      'kantong',
      'tas plastik',
      'plastik kuah',
      'plastik panas',
    ],
    type: 'purchase',
    kind: 'kemasan',
    defaultUnit: 'pak',
    isSingleUse: true,
    canonicalName: 'Kantong Kresek & Plastik',
  },
  {
    keywords: [
      'kertas nasi',
      'kertas bungkus',
      'kertas minyak',
      'kertas coklat',
      'kertas koran',
      'kertas roti',
    ],
    type: 'purchase',
    kind: 'kemasan',
    defaultUnit: 'pak',
    isSingleUse: true,
    canonicalName: 'Kertas Bungkus Nasi/Gorengan',
  },
  {
    keywords: [
      'mika',
      'kotak makan',
      'box nasi',
      'styrofoam',
      'thinwall',
      'paper bowl',
      'lunch box',
      'dus nasi',
      'kotak berkat',
    ],
    type: 'purchase',
    kind: 'kemasan',
    defaultUnit: 'pak',
    isSingleUse: true,
    canonicalName: 'Kemasan Mika / Kotak Makan',
  },
  {
    keywords: [
      'cup',
      'gelas plastik',
      'sedotan',
      'tutup cup',
      'paper cup',
      'cup sealer',
      'lid cup',
      'sendok plastik',
      'tusuk sate',
    ],
    type: 'purchase',
    kind: 'kemasan',
    defaultUnit: 'pak',
    isSingleUse: true,
    canonicalName: 'Cup, Sedotan & Alat Makan Sekali Pakai',
  },

  // Raw Ingredients (Bahan Baku)
  {
    keywords: [
      'minyak goreng',
      'minyak curah',
      'minyak sawit',
      'minyak kita',
      'minyakkita',
      'bimoli',
      'sunco',
      'tropical',
      'filma',
      'minyak',
    ],
    type: 'purchase',
    kind: 'bahan',
    defaultUnit: 'liter',
    isSingleUse: false,
    canonicalName: 'Minyak Goreng',
  },
  {
    keywords: [
      'tepung terigu',
      'terigu',
      'segitiga biru',
      'cakra',
      'lencana merah',
      'tepung beras',
      'rose brand',
      'tapioka',
      'aci',
      'maizena',
      'sagu',
      'tepung',
    ],
    type: 'purchase',
    kind: 'bahan',
    defaultUnit: 'kg',
    isSingleUse: false,
    canonicalName: 'Tepung Terigu / Beras',
  },
  {
    keywords: [
      'tempe',
      'tahu',
      'pisang',
      'ubi',
      'singkong',
      'bakwan',
      'kol',
      'kubis',
      'wortel',
      'tauge',
      'toge',
      'daun bawang',
      'seledri',
      'oncom',
      'sukun',
      'tape',
    ],
    type: 'purchase',
    kind: 'bahan',
    defaultUnit: 'kg',
    isSingleUse: false,
    canonicalName: 'Bahan Isian (Tahu/Tempe/Sayur)',
  },
  {
    keywords: [
      'beras',
      'ayam',
      'daging',
      'ikan',
      'lele',
      'nila',
      'telur',
      'telor',
      'cabe',
      'cabai',
      'rawit',
      'bawang',
      'bumbu',
      'kecap',
      'saus',
      'saos',
      'santan',
      'kara',
      'garam',
      ' penyedap',
      'royco',
      'masako',
      'micin',
      'mie',
      'bihun',
    ],
    type: 'purchase',
    kind: 'bahan',
    defaultUnit: 'kg',
    isSingleUse: false,
    canonicalName: 'Bahan Masakan & Bumbu',
  },
  {
    keywords: [
      'kopi',
      'biji kopi',
      'bubuk kopi',
      'susu',
      'kental manis',
      'skm',
      'uht',
      'gula',
      'aren',
      'krimer',
      'es batu',
      'es kristal',
      'teh',
      'sirup',
      'coklat',
      'matcha',
    ],
    type: 'purchase',
    kind: 'bahan',
    defaultUnit: 'kg',
    isSingleUse: false,
    canonicalName: 'Bahan Kopi & Minuman',
  },

  // Operational Expenses (Sewa, Gaji, Kebersihan)
  {
    keywords: [
      'sabun cuci',
      'sunlight',
      'mama lemon',
      'tisu',
      'tissue',
      'lap',
      'sapu',
      'sewa',
      'kontrakan',
      'iuran',
      'retribusi',
      'upah',
      'gaji',
    ],
    type: 'purchase',
    kind: 'lain',
    defaultUnit: 'pcs',
    isSingleUse: false,
    canonicalName: 'Biaya Operasional Warung',
  },

  // Sales (Penjualan)
  {
    keywords: [
      'laku',
      'terjual',
      'jualan',
      'omzet',
      'penjualan',
      'setoran',
      'pesanan',
      'orderan',
      'kasir',
    ],
    type: 'sale',
    kind: 'penjualan',
    defaultUnit: 'porsi',
    isSingleUse: false,
    canonicalName: 'Penjualan Harian',
  },
];

export interface ParsedTransactionDraft {
  item_name: string;
  type: TransactionType;
  kind: ItemKind | 'penjualan';
  qty: number;
  unit: string;
  amount_idr: number;
  is_single_use: boolean;
  confidence: number;
  source: TransactionSource;
  raw_text: string;
}

/**
 * Parse natural Indonesian spoken/typed phrase or receipt line into a structured transaction draft.
 * Examples supported:
 * - "Beli tepung terigu 10 kg 120 ribu"
 * - "Gas LPG 3 kg 2 tabung Rp 44.000"
 * - "Beli kresek hitam 3 pak 45rb"
 * - "Jualan hari ini 350 porsi 700 ribu"
 */
export function parseNaturalTransactionInput(
  rawText: string,
  source: TransactionSource = 'manual',
  customCatalog?: CatalogItem[]
): ParsedTransactionDraft {
  const cleaned = rawText.trim();
  const lower = cleaned.toLowerCase();

  // 0. Check warung's custom catalog first (including auto-learned items)
  let matchedCatalog: CatalogItem | null = null;
  if (customCatalog && customCatalog.length > 0) {
    for (const cat of customCatalog) {
      const catWords = cat.name
        .toLowerCase()
        .split(/[\s,/()-]+/)
        .filter((w) => w.length >= 3);
      if (
        lower.includes(cat.name.toLowerCase()) ||
        (catWords.length > 0 && catWords.some((w) => lower.includes(w)))
      ) {
        matchedCatalog = cat;
        break;
      }
    }
  }

  // 1. Match keyword rule
  let matchedRule: KeywordRule | null = null;
  for (const rule of KEYWORD_DICTIONARY) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      matchedRule = rule;
      break;
    }
  }

  // 2. Parse Indonesian currency expression (e.g., "120 ribu", "45rb", "Rp 85.000", "1,5 juta")
  let amountIdr = 0;
  const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)\b/);
  const ribuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb)\b/);
  const rpFormattedMatch = lower.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+)\b/);
  const largeNumberMatch = lower.match(/\b(\d{4,8})\b/);

  if (jutaMatch) {
    const num = parseFloat(jutaMatch[1].replace(',', '.'));
    amountIdr = Math.round(num * 1_000_000);
  } else if (ribuMatch) {
    const num = parseFloat(ribuMatch[1].replace(',', '.'));
    amountIdr = Math.round(num * 1_000);
  } else if (rpFormattedMatch) {
    amountIdr = parseInt(rpFormattedMatch[1].replace(/\./g, ''), 10);
  } else if (largeNumberMatch) {
    amountIdr = parseInt(largeNumberMatch[1], 10);
  }

  // 3. Parse quantity and unit (e.g., "10 kg", "5 liter", "2 tabung", "3 pak", "320 porsi")
  let qty = 1;
  let unit = matchedRule?.defaultUnit ?? matchedCatalog?.unit ?? 'pcs';

  // Normalize out LPG cylinder type names ("gas 3kg", "lpg 3 kg", "gas 12kg") before extracting quantity
  const textForQty = lower.replace(
    /\b(?:gas|lpg|elpiji)\s*(?:3|12)\s*kg\b/gi,
    'gas_lpg'
  );

  const qtyUnitMatch = textForQty.match(
    /\b(\d+(?:[.,]\d+)?)\s*(kg|kilo|liter|ltr|l\b|tabung|tbg|pak|bal|pcs|buah|ikat|porsi|cup|baskom|m3|kwh|galon|botol|dus|kotak|bungkus|lembar)/i
  );

  if (qtyUnitMatch) {
    qty = parseFloat(qtyUnitMatch[1].replace(',', '.'));
    const rawUnit = qtyUnitMatch[2].toLowerCase();
    if (rawUnit === 'kilo') unit = 'kg';
    else if (rawUnit === 'ltr' || rawUnit === 'l') unit = 'liter';
    else if (rawUnit === 'tbg') unit = 'tabung';
    else unit = rawUnit;
  }

  // Fallback price from matched catalog if user didn't say the price
  if (amountIdr === 0 && matchedCatalog) {
    amountIdr = Math.round(qty * matchedCatalog.unit_cost);
  }

  // Estimate kWh if user entered electricity purchase in IDR without kWh
  if (matchedRule?.canonicalName === 'Token Listrik PLN' && unit === 'kWh' && qty === 1 && amountIdr >= 20000) {
    qty = Math.round((amountIdr / 1445) * 10) / 10;
  }

  // Determine confidence score
  let confidence = 0.65;
  if ((matchedRule || matchedCatalog) && amountIdr > 0 && qtyUnitMatch) {
    confidence = 0.96;
  } else if ((matchedRule || matchedCatalog) && amountIdr > 0) {
    confidence = 0.88;
  } else if (matchedRule || matchedCatalog || amountIdr > 0) {
    confidence = 0.78;
  }

  // Extract a clean item name
  const itemName = matchedRule
    ? matchedRule.canonicalName
    : matchedCatalog
      ? matchedCatalog.name
      : cleaned
          .replace(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:ribu|rb|juta|jt)?/gi, '')
          .replace(/\b(beli|bayar|catat|sama|terus|dan)\b/gi, '')
          .trim() || 'Catatan Warung';

  const resolvedKind =
    matchedRule?.kind ?? matchedCatalog?.kind ?? 'bahan';
  const resolvedType: TransactionType =
    matchedRule?.type ??
    (resolvedKind === 'energi'
      ? 'utility'
      : lower.includes('jual') || lower.includes('laku')
        ? 'sale'
        : 'purchase');

  return {
    item_name: itemName,
    type: resolvedType,
    kind: resolvedKind,
    qty: qty > 0 ? qty : 1,
    unit,
    amount_idr: amountIdr,
    is_single_use:
      matchedRule?.isSingleUse ?? matchedCatalog?.is_single_use ?? false,
    confidence,
    source,
    raw_text: cleaned,
  };
}

/**
 * Multi-line & compound sentence splitter:
 * Splits multi-line receipts or compound sentences (e.g. "Beli minyak 5 liter 85rb, terigu 10kg 125rb, sama gas 3kg 44rb")
 * into multiple structured transaction drafts at once!
 */
export function parseMultiLineTransactionInput(
  rawText: string,
  source: TransactionSource = 'manual',
  customCatalog?: CatalogItem[]
): ParsedTransactionDraft[] {
  const segments = rawText
    .split(/\n|;|\b(?:sama|terus|lanjut|dan beli)\b|,(?=\s*[a-zA-Z\s]+\d)/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && !/^(total|subtotal|tunai|kembali|terima kasih|nota|struk|tanggal)\b/i.test(s));

  if (segments.length <= 1) {
    return [parseNaturalTransactionInput(rawText, source, customCatalog)];
  }

  const drafts = segments
    .map((seg) => parseNaturalTransactionInput(seg, source, customCatalog))
    .filter((d) => d.amount_idr > 0 || d.confidence >= 0.75);

  return drafts.length > 0
    ? drafts
    : [parseNaturalTransactionInput(rawText, source, customCatalog)];
}

export interface PosMenuItem {
  id: string;
  name: string;
  priceIdr: number;
  portionsPerUnit: number;
  category: 'makanan' | 'minuman' | 'paket';
  defaultPackagingPcs: number;
}

/**
 * Default POS Cashier Menu per Business Type
 */
export function getDefaultPosMenu(businessType: BusinessType): PosMenuItem[] {
  const menus: Record<BusinessType, PosMenuItem[]> = {
    gorengan: [
      {
        id: 'pos-gor-1',
        name: 'Paket Gorengan Campur (5 pcs)',
        priceIdr: 10000,
        portionsPerUnit: 5,
        category: 'paket',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-gor-2',
        name: 'Paket Keluarga (10 pcs + Cabai)',
        priceIdr: 20000,
        portionsPerUnit: 10,
        category: 'paket',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-gor-3',
        name: 'Tempe Mendoan Hangat',
        priceIdr: 2000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-gor-4',
        name: 'Tahu Isi Sayur Pedas',
        priceIdr: 2500,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-gor-5',
        name: 'Bakwan Sayur Renyah',
        priceIdr: 2000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-gor-6',
        name: 'Pisang Goreng Tanduk',
        priceIdr: 3000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-gor-7',
        name: 'Es Teh Manis / Hangat',
        priceIdr: 4000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-gor-8',
        name: 'Kopi Hitam Warung',
        priceIdr: 5000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 1,
      },
    ],
    warung_makan: [
      {
        id: 'pos-wm-1',
        name: 'Nasi Ayam Goreng + Lalapan',
        priceIdr: 18000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-wm-2',
        name: 'Nasi Pecel Lele + Sambal',
        priceIdr: 16000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-wm-3',
        name: 'Nasi Telur Dadar + Sayur',
        priceIdr: 12000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-wm-4',
        name: 'Nasi Soto Ayam Kampung',
        priceIdr: 15000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-wm-5',
        name: 'Tambahan Tahu / Tempe',
        priceIdr: 3000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-wm-6',
        name: 'Es Jeruk Peras / Es Teh',
        priceIdr: 5000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 1,
      },
    ],
    kedai_kopi: [
      {
        id: 'pos-kk-1',
        name: 'Es Kopi Susu Gula Aren',
        priceIdr: 18000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-kk-2',
        name: 'Americano Dingin / Panas',
        priceIdr: 15000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-kk-3',
        name: 'Es Coklat Klasik / Matcha',
        priceIdr: 18000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-kk-4',
        name: 'Teh Tarik Susu',
        priceIdr: 12000,
        portionsPerUnit: 1,
        category: 'minuman',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-kk-5',
        name: 'Roti Bakar Coklat Keju',
        priceIdr: 15000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
      {
        id: 'pos-kk-6',
        name: 'Kentang Goreng / Camilan',
        priceIdr: 14000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 1,
      },
    ],
    katering: [
      {
        id: 'pos-kat-1',
        name: 'Paket Nasi Kotak Ayam Bakar (10 Box)',
        priceIdr: 250000,
        portionsPerUnit: 10,
        category: 'paket',
        defaultPackagingPcs: 12,
      },
      {
        id: 'pos-kat-2',
        name: 'Paket Nasi Kotak Rendang (10 Box)',
        priceIdr: 280000,
        portionsPerUnit: 10,
        category: 'paket',
        defaultPackagingPcs: 12,
      },
      {
        id: 'pos-kat-3',
        name: 'Nasi Berkat / Syukuran Satuan',
        priceIdr: 22000,
        portionsPerUnit: 1,
        category: 'makanan',
        defaultPackagingPcs: 2,
      },
      {
        id: 'pos-kat-4',
        name: 'Snack Box Kue Tradisional (10 Box)',
        priceIdr: 120000,
        portionsPerUnit: 10,
        category: 'paket',
        defaultPackagingPcs: 11,
      },
    ],
  };

  return menus[businessType] ?? menus.gorengan;
}

/**
 * Default catalog templates per business type for 1-tap onboarding.
 */
export function getDefaultCatalogTemplates(
  businessType: BusinessType,
  businessId: string
): CatalogItem[] {
  const baseByType: Record<
    BusinessType,
    Array<{
      name: string;
      kind: ItemKind;
      unit: string;
      pack_size: number;
      unit_cost: number;
      is_single_use: boolean;
      tags: string[];
    }>
  > = {
    gorengan: [
      {
        name: 'Tepung Terigu Protein Sedang',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 1,
        unit_cost: 12500,
        is_single_use: false,
        tags: ['adonan', 'utama'],
      },
      {
        name: 'Minyak Goreng Sawit',
        kind: 'bahan',
        unit: 'liter',
        pack_size: 1,
        unit_cost: 17000,
        is_single_use: false,
        tags: ['goreng', 'utama'],
      },
      {
        name: 'Tahu, Tempe & Pisang Kepok',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 1,
        unit_cost: 16000,
        is_single_use: false,
        tags: ['isian'],
      },
      {
        name: 'Kantong Kresek Kecil (Isi 50)',
        kind: 'kemasan',
        unit: 'pak',
        pack_size: 50,
        unit_cost: 12000,
        is_single_use: true,
        tags: ['plastik', 'sekali-pakai'],
      },
      {
        name: 'Kertas Bungkus Coklat (Isi 100)',
        kind: 'kemasan',
        unit: 'pak',
        pack_size: 100,
        unit_cost: 18000,
        is_single_use: true,
        tags: ['kertas', 'sekali-pakai'],
      },
      {
        name: 'Gas LPG 3 kg',
        kind: 'energi',
        unit: 'tabung',
        pack_size: 3,
        unit_cost: 22000,
        is_single_use: false,
        tags: ['lpg', 'energi'],
      },
    ],
    warung_makan: [
      {
        name: 'Beras Pulen Warung',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 25,
        unit_cost: 14500,
        is_single_use: false,
        tags: ['utama'],
      },
      {
        name: 'Ayam & Lauk Segar',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 1,
        unit_cost: 36000,
        is_single_use: false,
        tags: ['lauk'],
      },
      {
        name: 'Minyak Goreng & Bumbu',
        kind: 'bahan',
        unit: 'liter',
        pack_size: 1,
        unit_cost: 17500,
        is_single_use: false,
        tags: ['goreng'],
      },
      {
        name: 'Kertas Nasi & Kresek Bungkus',
        kind: 'kemasan',
        unit: 'pak',
        pack_size: 100,
        unit_cost: 25000,
        is_single_use: true,
        tags: ['sekali-pakai'],
      },
      {
        name: 'Gas LPG 3 kg',
        kind: 'energi',
        unit: 'tabung',
        pack_size: 3,
        unit_cost: 22000,
        is_single_use: false,
        tags: ['lpg'],
      },
    ],
    kedai_kopi: [
      {
        name: 'Biji Kopi Espresso Blend',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 1,
        unit_cost: 135000,
        is_single_use: false,
        tags: ['kopi'],
      },
      {
        name: 'Susu UHT & Gula Aren',
        kind: 'bahan',
        unit: 'liter',
        pack_size: 1,
        unit_cost: 19500,
        is_single_use: false,
        tags: ['susu'],
      },
      {
        name: 'Cup Plastik + Tutup + Sedotan (Isi 50)',
        kind: 'kemasan',
        unit: 'pak',
        pack_size: 50,
        unit_cost: 32000,
        is_single_use: true,
        tags: ['plastik', 'sekali-pakai'],
      },
      {
        name: 'Token Listrik Mesin Kopi & Kulkas',
        kind: 'energi',
        unit: 'kWh',
        pack_size: 1,
        unit_cost: 1445,
        is_single_use: false,
        tags: ['listrik'],
      },
    ],
    katering: [
      {
        name: 'Beras & Bahan Pokok Katering',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 25,
        unit_cost: 14500,
        is_single_use: false,
        tags: ['pokok'],
      },
      {
        name: 'Daging, Ayam & Sayuran Segar',
        kind: 'bahan',
        unit: 'kg',
        pack_size: 1,
        unit_cost: 38000,
        is_single_use: false,
        tags: ['lauk'],
      },
      {
        name: 'Kotak Nasi Karton & Mika (Isi 50)',
        kind: 'kemasan',
        unit: 'pak',
        pack_size: 50,
        unit_cost: 65000,
        is_single_use: true,
        tags: ['kemasan', 'sekali-pakai'],
      },
      {
        name: 'Gas LPG 12 kg / 3 kg',
        kind: 'energi',
        unit: 'kg',
        pack_size: 3,
        unit_cost: 7333,
        is_single_use: false,
        tags: ['lpg'],
      },
    ],
  };

  return (baseByType[businessType] ?? baseByType.gorengan).map((item, idx) => ({
    id: `cat-${businessType}-${idx + 1}`,
    business_id: businessId,
    client_id: `cat-${businessType}-${idx + 1}`,
    ...item,
    sync_status: 'local_only',
  }));
}
