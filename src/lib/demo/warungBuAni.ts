import {
  BusinessProfile,
  CatalogItem,
  ChallengeRecord,
  DailyLogRecord,
  EmissionFactorRecord,
  RecommendationStatusRecord,
  TransactionRecord,
  UtilityReadingRecord,
  WeeklyRawTotals,
} from '@/types';
import { convertWasteToKg } from '@/lib/calc';
import { getDefaultCatalogTemplates } from '@/lib/classify';

export const DEMO_BUSINESS_ID = 'demo-warung-bu-ani-001';

export const DEFAULT_EMISSION_FACTORS: EmissionFactorRecord[] = [
  {
    id: 'ef-elec-v1',
    key: 'electricity_grid_id',
    label: 'Listrik PLN (Grid Rata-Rata)',
    value: 0.85,
    unit: 'kg CO2e / kWh',
    source:
      'PLACEHOLDER, ganti dengan sumber resmi (Faktor Emisi GRK Ketenagalistrikan ESDM)',
    version: 1,
    valid_from: '2025-01-01',
    is_placeholder: true,
  },
  {
    id: 'ef-lpg-v1',
    key: 'lpg_combustion',
    label: 'Gas LPG (Tabung 3 kg / 12 kg)',
    value: 3.0,
    unit: 'kg CO2e / kg LPG',
    source:
      'PLACEHOLDER, ganti dengan sumber resmi (Pedoman Inventarisasi GRK Nasional KLHK / IPCC)',
    version: 1,
    valid_from: '2025-01-01',
    is_placeholder: true,
  },
  {
    id: 'ef-water-v1',
    key: 'water_supply',
    label: 'Air Bersih / PDAM',
    value: 0.344,
    unit: 'kg CO2e / m3',
    source: 'PLACEHOLDER, ganti dengan sumber resmi (Faktor Ilustrasi Air Bersih)',
    version: 1,
    valid_from: '2025-01-01',
    is_placeholder: true,
  },
];

/**
 * Generate realistic 8-week dataset for "Warung Bu Ani" (Usaha Gorengan & Jajanan Sore).
 * Notice the realistic variation (not a smooth curve):
 * - Weeks 1-4 (Calibration): Waste hovers between 7.6% and 8.5% (avg ~8.0%), energy has a spike in Week 3 (hujan deras, minyak dingin berulang), jelantah belum dijual.
 * - Week 5: Bu Ani mulai membagi adonan sore jadi 2 takaran kecil -> sisa adonan turun ke ~7.1%.
 * - Week 6: Ada sedikit kenaikan kembali karena pesanan pengajian mendadak & hujan sore (~7.5%), tapi masih di bawah baseline.
 * - Week 7: Mulai menampung jelantah ke pengepul & tanya pembeli soal kantong kresek (~6.6%).
 * - Week 8 (Minggu Ini): Sisa bahan ~6.2%, gas lebih irit karena saring remah tiap 2 jam, Skor Hijau naik ke ~84!
 */
export function generateWarungBuAniDataset(): {
  business: BusinessProfile;
  catalog: CatalogItem[];
  dailyLogs: DailyLogRecord[];
  utilityReadings: UtilityReadingRecord[];
  transactions: TransactionRecord[];
  challenges: ChallengeRecord[];
  recommendationStatuses: RecommendationStatusRecord[];
  emissionFactors: EmissionFactorRecord[];
} {
  const business: BusinessProfile = {
    id: DEMO_BUSINESS_ID,
    name: 'Warung Gorengan Bu Ani',
    type: 'gorengan',
    energy_sources: ['listrik', 'lpg_3kg'],
    mode: 'cepat',
    weights: {
      waste: 0.3,
      energy: 0.3,
      water: 0.2,
      packaging: 0.2,
    },
    target_pct: 10,
    tariffs: {
      electricity_per_kwh: 1445,
      lpg_per_kg: 7333,
      water_per_m3: 7500,
      used_oil_price_per_liter: 6500,
      avg_ingredient_cost_per_kg: 18000,
    },
    is_demo: true,
    created_at: '2026-09-01T07:00:00.000Z',
    updated_at: '2026-10-28T08:00:00.000Z',
  };

  const catalog = getDefaultCatalogTemplates('gorengan', DEMO_BUSINESS_ID);

  // 8 Mondays ending at the current week (2026-09-07 to 2026-10-26)
  const weekConfigs = [
    {
      weekStart: '2026-09-07',
      weekEnd: '2026-09-13',
      basePortionsPerDay: [310, 295, 320, 305, 340, 365, 325], // sum = 2260
      wasteKgPerDay: [1.3, 1.4, 1.2, 1.5, 1.3, 1.6, 1.3], // sum = 9.6 kg / 120 kg bahan = 8.0%
      ingredientsKgWeek: 120,
      oilLitersPerDay: [0.5, 0.4, 0.5, 0.5, 0.6, 0.6, 0.5], // 3.6 L
      oilSold: false,
      kwh: 41.5,
      gasKg: 21.0, // 7 tabung 3kg
      waterM3: 1.95,
      packagingPcs: 1580,
      noteSample: 'Minggu kalibrasi 1 — adonan sore sering sisa setengah baskom',
    },
    {
      weekStart: '2026-09-14',
      weekEnd: '2026-09-20',
      basePortionsPerDay: [300, 315, 290, 310, 335, 350, 310], // sum = 2210
      wasteKgPerDay: [1.4, 1.3, 1.5, 1.4, 1.2, 1.5, 1.4], // sum = 9.7 kg / 118 kg = 8.22%
      ingredientsKgWeek: 118,
      oilLitersPerDay: [0.5, 0.5, 0.4, 0.5, 0.5, 0.6, 0.5], // 3.5 L
      oilSold: false,
      kwh: 40.8,
      gasKg: 20.7,
      waterM3: 1.92,
      packagingPcs: 1550,
      noteSample: 'Minggu kalibrasi 2 — cuaca mendung hari Rabu',
    },
    {
      weekStart: '2026-09-21',
      weekEnd: '2026-09-27',
      basePortionsPerDay: [285, 290, 310, 325, 340, 360, 330], // sum = 2240
      wasteKgPerDay: [1.5, 1.5, 1.3, 1.2, 1.3, 1.4, 1.3], // sum = 9.5 kg / 121 kg = 7.85%
      ingredientsKgWeek: 121,
      oilLitersPerDay: [0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.5], // 3.7 L
      oilSold: false,
      kwh: 42.2,
      gasKg: 21.6, // boros gas karena angin & hujan sore
      waterM3: 2.01,
      packagingPcs: 1590,
      noteSample: 'Hujan deras Senin-Selasa, kompor sering memanaskan ulang minyak',
    },
    {
      weekStart: '2026-09-28',
      weekEnd: '2026-10-04',
      basePortionsPerDay: [315, 305, 320, 310, 345, 370, 335], // sum = 2300
      wasteKgPerDay: [1.3, 1.4, 1.3, 1.4, 1.3, 1.5, 1.4], // sum = 9.6 kg / 121 kg = 7.93%
      ingredientsKgWeek: 121,
      oilLitersPerDay: [0.5, 0.4, 0.5, 0.5, 0.6, 0.5, 0.5], // 3.5 L
      oilSold: false,
      kwh: 41.8,
      gasKg: 21.0,
      waterM3: 1.96,
      packagingPcs: 1605,
      noteSample: 'Akhir masa kalibrasi 4 minggu awal',
    },
    {
      weekStart: '2026-10-05',
      weekEnd: '2026-10-11',
      basePortionsPerDay: [320, 310, 315, 325, 350, 375, 335], // sum = 2330
      wasteKgPerDay: [1.1, 1.2, 1.1, 1.2, 1.2, 1.3, 1.2], // sum = 8.3 kg / 117 kg = 7.09%
      ingredientsKgWeek: 117,
      oilLitersPerDay: [0.5, 0.4, 0.5, 0.5, 0.5, 0.6, 0.5], // 3.5 L
      oilSold: false,
      kwh: 39.8,
      gasKg: 19.8,
      waterM3: 1.84,
      packagingPcs: 1510,
      noteSample: 'Mulai bagi adonan jam 4 sore jadi 2 baskom kecil',
    },
    {
      weekStart: '2026-10-12',
      weekEnd: '2026-10-18',
      // Realistic bump: rainy Thursday & sudden catering cancel caused slight rebound
      basePortionsPerDay: [310, 305, 320, 275, 345, 365, 330], // sum = 2250
      wasteKgPerDay: [1.1, 1.1, 1.2, 1.7, 1.2, 1.3, 1.1], // sum = 8.7 kg / 116 kg = 7.50%
      ingredientsKgWeek: 116,
      oilLitersPerDay: [0.4, 0.5, 0.5, 0.5, 0.5, 0.6, 0.4], // 3.4 L
      oilSold: true, // Pertamakali jual ke pengepul!
      kwh: 39.2,
      gasKg: 19.5,
      waterM3: 1.82,
      packagingPcs: 1440,
      noteSample: 'Kamis hujan lebat ada sisa bakwan, tapi jelantah sudah diambil pengepul',
    },
    {
      weekStart: '2026-10-19',
      weekEnd: '2026-10-25',
      basePortionsPerDay: [325, 315, 330, 320, 355, 380, 345], // sum = 2370
      wasteKgPerDay: [1.0, 1.1, 1.1, 1.0, 1.1, 1.2, 1.1], // sum = 7.6 kg / 116 kg = 6.55%
      ingredientsKgWeek: 116,
      oilLitersPerDay: [0.4, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5], // 3.3 L
      oilSold: true,
      kwh: 38.4,
      gasKg: 18.6,
      waterM3: 1.75,
      packagingPcs: 1410,
      noteSample: 'Saring remah wajan tiap 2 jam, kompor satu dimatikan jam sepi',
    },
    {
      weekStart: '2026-10-26',
      weekEnd: '2026-11-01',
      basePortionsPerDay: [330, 325, 335, 330, 360, 385, 345], // sum = 2410 (7 days for complete demo report)
      wasteKgPerDay: [0.9, 1.0, 1.0, 1.0, 1.1, 1.1, 1.0], // sum = 7.1 kg / 115 kg = 6.17%
      ingredientsKgWeek: 115,
      oilLitersPerDay: [0.4, 0.5, 0.4, 0.5, 0.5, 0.5, 0.4], // 3.2 L (belum diambil pengepul minggu ini agar saran & potensi tampil jelas)
      oilSold: false,
      kwh: 37.9,
      gasKg: 18.0, // 6 tabung 3kg (hemat 1 tabung penuh per minggu!)
      waterM3: 1.71,
      packagingPcs: 1385,
      noteSample: 'Adonan sore pas, pembeli langganan banyak bawa wadah sendiri',
    },
  ];

  const dailyLogs: DailyLogRecord[] = [];
  const utilityReadings: UtilityReadingRecord[] = [];
  const transactions: TransactionRecord[] = [];

  weekConfigs.forEach((wk, wIdx) => {
    const startDate = new Date(`${wk.weekStart}T00:00:00Z`);
    const avgIngredientsPerDay =
      Math.round((wk.ingredientsKgWeek / 7) * 100) / 100;

    for (let d = 0; d < 7; d++) {
      const curr = new Date(startDate);
      curr.setUTCDate(startDate.getUTCDate() + d);
      const dateStr = curr.toISOString().slice(0, 10);

      dailyLogs.push({
        id: `demo-log-w${wIdx + 1}-d${d + 1}`,
        business_id: DEMO_BUSINESS_ID,
        client_id: `demo-log-w${wIdx + 1}-d${d + 1}`,
        date: dateStr,
        portions_sold: wk.basePortionsPerDay[d],
        waste_amount: wk.wasteKgPerDay[d],
        waste_unit: 'kg',
        used_oil_liters: wk.oilLitersPerDay[d],
        oil_sold: wk.oilSold,
        ingredients_used_kg: avgIngredientsPerDay,
        note: d === 3 ? wk.noteSample : undefined,
        sync_status: 'local_only',
      });

      // Add daily sales transaction
      transactions.push({
        id: `demo-tx-sale-w${wIdx + 1}-d${d + 1}`,
        business_id: DEMO_BUSINESS_ID,
        client_id: `demo-tx-sale-w${wIdx + 1}-d${d + 1}`,
        type: 'sale',
        item_name: 'Penjualan Gorengan Harian (Bakwan, Tempe, Tahu, Pisang)',
        kind: 'penjualan',
        qty: wk.basePortionsPerDay[d],
        unit: 'porsi',
        amount_idr: wk.basePortionsPerDay[d] * 2000,
        is_single_use: false,
        occurred_at: `${dateStr}T19:30:00.000Z`,
        source: d % 2 === 0 ? 'voice' : 'manual',
        confidence: 0.96,
        status: 'confirmed',
        sync_status: 'local_only',
      });
    }

    // Weekly ingredient & packaging purchase transactions
    transactions.push({
      id: `demo-tx-ing-w${wIdx + 1}`,
      business_id: DEMO_BUSINESS_ID,
      client_id: `demo-tx-ing-w${wIdx + 1}`,
      type: 'purchase',
      item_name: 'Tepung Terigu, Minyak Goreng & Bahan Isian',
      kind: 'bahan',
      qty: wk.ingredientsKgWeek,
      unit: 'kg',
      amount_idr: wk.ingredientsKgWeek * 16500,
      is_single_use: false,
      occurred_at: `${wk.weekStart}T08:15:00.000Z`,
      source: 'ocr',
      confidence: 0.92,
      status: 'confirmed',
      sync_status: 'local_only',
    });

    transactions.push({
      id: `demo-tx-pkg-w${wIdx + 1}`,
      business_id: DEMO_BUSINESS_ID,
      client_id: `demo-tx-pkg-w${wIdx + 1}`,
      type: 'purchase',
      item_name: 'Kertas Bungkus & Kantong Kresek',
      kind: 'kemasan',
      qty: wk.packagingPcs,
      unit: 'pcs',
      amount_idr: Math.round(wk.packagingPcs * 280),
      is_single_use: true,
      occurred_at: `${wk.weekStart}T09:00:00.000Z`,
      source: 'manual',
      confidence: 0.95,
      status: 'confirmed',
      sync_status: 'local_only',
    });

    utilityReadings.push({
      id: `demo-util-w${wIdx + 1}`,
      business_id: DEMO_BUSINESS_ID,
      client_id: `demo-util-w${wIdx + 1}`,
      period_start: wk.weekStart,
      period_end: wk.weekEnd,
      kwh: wk.kwh,
      gas_kg: wk.gasKg,
      water_m3: wk.waterM3,
      source: 'manual',
      sync_status: 'local_only',
    });
  });

  const challenges: ChallengeRecord[] = [
    {
      id: 'demo-chal-1',
      business_id: DEMO_BUSINESS_ID,
      code: '7d_small_batch_dough',
      title: 'Tantangan 7 Hari: Takaran Adonan Sore Pas',
      description:
        'Bagi adonan setelah jam 16.00 menjadi 2 baskom kecil agar sisa adonan harian di bawah 1 kg.',
      duration_days: 7,
      progress_days: 5,
      checked_dates: [
        '2026-10-24',
        '2026-10-25',
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
      ],
      status: 'active',
      started_at: '2026-10-24',
      updated_at: '2026-10-28T08:00:00.000Z',
    },
    {
      id: 'demo-chal-2',
      business_id: DEMO_BUSINESS_ID,
      code: '7d_collect_jelantah',
      title: 'Tantangan 7 Hari: Tampung Jelantah di Jeriken Bersih',
      description:
        'Saring dan tampung minyak jelantah setiap malam untuk dijual ke pengepul biodiesel resmi.',
      duration_days: 7,
      progress_days: 7,
      checked_dates: [
        '2026-10-12',
        '2026-10-13',
        '2026-10-14',
        '2026-10-15',
        '2026-10-16',
        '2026-10-17',
        '2026-10-18',
      ],
      status: 'completed',
      started_at: '2026-10-12',
      updated_at: '2026-10-18T21:00:00.000Z',
    },
  ];

  return {
    business,
    catalog,
    dailyLogs,
    utilityReadings,
    transactions,
    challenges,
    recommendationStatuses: [],
    emissionFactors: DEFAULT_EMISSION_FACTORS,
  };
}

/**
 * Helper to get ISO Monday (YYYY-MM-DD) for any date string.
 */
export function getMondayOfDate(dateStr: string): string {
  const datePart = dateStr.slice(0, 10);
  const d = new Date(`${datePart}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Format week label in Bahasa Indonesia (e.g. "Minggu 8 (26 Okt – 1 Nov)").
 */
export function formatIndonesianWeekLabel(weekStart: string, index: number): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  const sDay = start.getUTCDate();
  const sMonth = months[start.getUTCMonth()];
  const eDay = end.getUTCDate();
  const eMonth = months[end.getUTCMonth()];

  const range =
    sMonth === eMonth
      ? `${sDay}–${eDay} ${sMonth}`
      : `${sDay} ${sMonth}–${eDay} ${eMonth}`;

  return `M${index + 1} (${range})`;
}

/**
 * Aggregate DailyLogs, UtilityReadings, and Transactions into chronological WeeklyRawTotals[].
 */
export function buildWeeklyRawTotals(params: {
  dailyLogs: DailyLogRecord[];
  utilityReadings: UtilityReadingRecord[];
  transactions: TransactionRecord[];
}): WeeklyRawTotals[] {
  const { dailyLogs, utilityReadings, transactions } = params;

  const weekSet = new Set<string>();
  dailyLogs.forEach((l) => weekSet.add(getMondayOfDate(l.date)));
  utilityReadings.forEach((u) => weekSet.add(getMondayOfDate(u.period_start)));
  transactions.forEach((t) => weekSet.add(getMondayOfDate(t.occurred_at)));

  const sortedWeeks = Array.from(weekSet).sort();

  return sortedWeeks.map((weekStart, idx) => {
    const logsInWeek = dailyLogs.filter(
      (l) => getMondayOfDate(l.date) === weekStart
    );
    const utilsInWeek = utilityReadings.filter(
      (u) => getMondayOfDate(u.period_start) === weekStart
    );
    const txsInWeek = transactions.filter(
      (t) =>
        t.status === 'confirmed' &&
        getMondayOfDate(t.occurred_at) === weekStart
    );

    const uniqueDays = new Set(logsInWeek.map((l) => l.date));
    const portionsFromLogs = logsInWeek.reduce(
      (sum, l) => sum + (l.portions_sold || 0),
      0
    );
    const portionsFromSalesTx = txsInWeek
      .filter((t) => t.type === 'sale' && t.unit === 'porsi')
      .reduce((sum, t) => sum + t.qty, 0);

    const portionsSold =
      portionsFromLogs > 0 ? portionsFromLogs : portionsFromSalesTx;

    const wasteKg = logsInWeek.reduce(
      (sum, l) => sum + convertWasteToKg(l.waste_amount, l.waste_unit),
      0
    );

    const usedOilLiters = logsInWeek.reduce(
      (sum, l) => sum + (l.used_oil_liters || 0),
      0
    );

    const unsoldOilLiters = logsInWeek
      .filter((l) => !l.oil_sold)
      .reduce((sum, l) => sum + (l.used_oil_liters || 0), 0);

    // Ingredients used (kg): from explicit logs, or ingredient purchases in week, or portion estimate
    const ingredientsFromLogs = logsInWeek.reduce(
      (sum, l) => sum + (l.ingredients_used_kg || 0),
      0
    );
    const ingredientsFromTx = txsInWeek
      .filter(
        (t) =>
          t.kind === 'bahan' &&
          (t.unit === 'kg' || t.unit === 'liter')
      )
      .reduce((sum, t) => sum + t.qty, 0);

    const ingredientsUsedKg =
      ingredientsFromLogs > 0
        ? ingredientsFromLogs
        : ingredientsFromTx > 0
          ? ingredientsFromTx
          : portionsSold > 0
            ? Math.round(portionsSold * 0.05 * 100) / 100 + wasteKg
            : 0;

    // Utilities: from utility_readings or utility transactions
    const kwhFromReadings = utilsInWeek.reduce((s, u) => s + (u.kwh || 0), 0);
    const kwhFromTx = txsInWeek
      .filter((t) => t.kind === 'energi' && t.unit.toLowerCase() === 'kwh')
      .reduce((s, t) => s + t.qty, 0);
    const electricityKwh = kwhFromReadings > 0 ? kwhFromReadings : kwhFromTx;

    const gasFromReadings = utilsInWeek.reduce((s, u) => s + (u.gas_kg || 0), 0);
    const gasFromTx = txsInWeek
      .filter(
        (t) =>
          t.kind === 'energi' &&
          (t.unit.toLowerCase() === 'tabung' ||
            t.item_name.toLowerCase().includes('lpg') ||
            t.item_name.toLowerCase().includes('gas'))
      )
      .reduce(
        (s, t) => s + (t.unit.toLowerCase() === 'tabung' ? t.qty * 3 : t.qty),
        0
      );
    const gasKg = gasFromReadings > 0 ? gasFromReadings : gasFromTx;

    const waterFromReadings = utilsInWeek.reduce(
      (s, u) => s + (u.water_m3 || 0),
      0
    );
    const waterFromTx = txsInWeek
      .filter((t) => t.kind === 'energi' && t.unit.toLowerCase() === 'm3')
      .reduce((s, t) => s + t.qty, 0);
    const waterM3 =
      waterFromReadings > 0
        ? waterFromReadings
        : waterFromTx > 0
          ? waterFromTx
          : portionsSold > 0
            ? Math.round(portionsSold * 0.0008 * 100) / 100
            : 0;

    // Single-use packaging count
    const packagingFromTx = txsInWeek
      .filter((t) => t.is_single_use || t.kind === 'kemasan')
      .reduce((s, t) => {
        if (t.unit === 'pak') return s + t.qty * 50;
        return s + t.qty;
      }, 0);

    const singleUsePackagingCount =
      packagingFromTx > 0
        ? packagingFromTx
        : portionsSold > 0
          ? Math.round(portionsSold * 0.65)
          : 0;

    const salesIdr = txsInWeek
      .filter((t) => t.type === 'sale')
      .reduce((s, t) => s + t.amount_idr, 0);

    const purchaseIdr = txsInWeek
      .filter((t) => t.type === 'purchase' || t.type === 'utility')
      .reduce((s, t) => s + t.amount_idr, 0);

    return {
      weekStart,
      weekLabel: formatIndonesianWeekLabel(weekStart, idx),
      daysLogged: Math.max(
        uniqueDays.size,
        txsInWeek.length > 0 ? Math.min(7, new Set(txsInWeek.map((t) => t.occurred_at.slice(0, 10))).size) : 0
      ),
      portionsSold,
      electricityKwh: Math.round(electricityKwh * 100) / 100,
      gasKg: Math.round(gasKg * 100) / 100,
      waterM3: Math.round(waterM3 * 1000) / 1000,
      wasteKg: Math.round(wasteKg * 100) / 100,
      ingredientsUsedKg: Math.round(ingredientsUsedKg * 100) / 100,
      singleUsePackagingCount: Math.round(singleUsePackagingCount),
      usedOilLiters: Math.round(usedOilLiters * 100) / 100,
      unsoldOilLiters: Math.round(unsoldOilLiters * 100) / 100,
      salesIdr,
      purchaseIdr,
    };
  });
}
