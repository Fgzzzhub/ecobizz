import Dexie, { type Table } from 'dexie';
import {
  BusinessProfile,
  CatalogItem,
  ChallengeRecord,
  DailyLogRecord,
  EmissionFactorRecord,
  RecommendationStatusRecord,
  TransactionRecord,
  UtilityReadingRecord,
} from '@/types';
import {
  DEFAULT_EMISSION_FACTORS,
  generateWarungBuAniDataset,
} from '@/lib/demo/warungBuAni';
import { getDefaultCatalogTemplates } from '@/lib/classify';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export class EcoBizDatabase extends Dexie {
  businesses!: Table<BusinessProfile, string>;
  catalog_items!: Table<CatalogItem, string>;
  transactions!: Table<TransactionRecord, string>;
  daily_logs!: Table<DailyLogRecord, string>;
  utility_readings!: Table<UtilityReadingRecord, string>;
  emission_factors!: Table<EmissionFactorRecord, string>;
  challenges!: Table<ChallengeRecord, string>;
  recommendation_statuses!: Table<RecommendationStatusRecord, string>;

  constructor() {
    super('EcoBizOfflineDB');
    this.version(1).stores({
      businesses: 'id, name, type, is_demo',
      catalog_items: 'id, business_id, client_id, kind',
      transactions: 'id, business_id, client_id, type, status, occurred_at, sync_status',
      daily_logs: 'id, business_id, client_id, date, sync_status',
      utility_readings: 'id, business_id, client_id, period_start, sync_status',
      emission_factors: 'id, key, version',
      challenges: 'id, business_id, code, status',
      recommendation_statuses: 'id, business_id, rule_id',
    });
  }
}

export const db =
  typeof window !== 'undefined' ? new EcoBizDatabase() : null;

const ACTIVE_BUSINESS_STORAGE_KEY = 'ecobiz_active_business_id';

export function getActiveBusinessId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
}

export function setActiveBusinessId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    window.localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, id);
  } else {
    window.localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
  }
}

/**
 * Ensure default emission factors exist in IndexedDB.
 */
export async function ensureDefaultEmissionFactors(): Promise<EmissionFactorRecord[]> {
  if (!db) return DEFAULT_EMISSION_FACTORS;
  const count = await db.emission_factors.count();
  if (count === 0) {
    await db.emission_factors.bulkPut(DEFAULT_EMISSION_FACTORS);
  }
  return db.emission_factors.toArray();
}

/**
 * Load all registered warung / customer accounts for the Multi-Account Switcher dropdown.
 */
export async function getAllBusinesses(): Promise<BusinessProfile[]> {
  if (!db) return [];
  return db.businesses.toArray();
}

/**
 * Load "Warung Bu Ani" 8-week realistic dataset + 2 additional warung accounts into IndexedDB
 * so the Multi-Account Dropdown & POS are immediately testable.
 */
export async function seedWarungBuAniDemo(): Promise<BusinessProfile> {
  const dataset = generateWarungBuAniDataset();
  if (!db) return dataset.business;

  const extraOutlets: BusinessProfile[] = [
    {
      id: 'biz-demo-kopi-budi',
      name: 'Kedai Kopi Mas Budi',
      type: 'kedai_kopi',
      energy_sources: ['listrik', 'pdam'],
      mode: 'cepat',
      weights: { waste: 0.25, energy: 0.35, water: 0.2, packaging: 0.2 },
      target_pct: 10,
      tariffs: {
        electricity_per_kwh: 1445,
        lpg_per_kg: 7333,
        water_per_m3: 7500,
        used_oil_price_per_liter: 6500,
        avg_ingredient_cost_per_kg: 24000,
      },
      is_demo: true,
      created_at: '2026-09-01T08:00:00.000Z',
      updated_at: '2026-10-26T08:00:00.000Z',
    },
    {
      id: 'biz-demo-warteg-eko',
      name: 'Warteg Berkah Pak Eko',
      type: 'warung_makan',
      energy_sources: ['listrik', 'lpg_3kg', 'pdam'],
      mode: 'cepat',
      weights: { waste: 0.35, energy: 0.3, water: 0.2, packaging: 0.15 },
      target_pct: 12,
      tariffs: {
        electricity_per_kwh: 1445,
        lpg_per_kg: 7333,
        water_per_m3: 7500,
        used_oil_price_per_liter: 6500,
        avg_ingredient_cost_per_kg: 20000,
      },
      is_demo: true,
      created_at: '2026-09-01T08:00:00.000Z',
      updated_at: '2026-10-26T08:00:00.000Z',
    },
  ];

  await db.transaction(
    'rw',
    [
      db.businesses,
      db.catalog_items,
      db.daily_logs,
      db.utility_readings,
      db.transactions,
      db.challenges,
      db.recommendation_statuses,
      db.emission_factors,
    ],
    async () => {
      await db.businesses.put(dataset.business);
      for (const outlet of extraOutlets) {
        const exists = await db.businesses.get(outlet.id);
        if (!exists) {
          await db.businesses.put(outlet);
          const outletCatalog = getDefaultCatalogTemplates(outlet.type, outlet.id);
          await db.catalog_items.bulkPut(outletCatalog);
          // Seed initial daily log & utility reading so reports work out of the box
          await db.daily_logs.put({
            id: `log-${outlet.id}-1`,
            business_id: outlet.id,
            client_id: `log-${outlet.id}-1`,
            date: '2026-10-25',
            portions_sold: outlet.type === 'kedai_kopi' ? 185 : 260,
            waste_amount: outlet.type === 'kedai_kopi' ? 0.4 : 1.2,
            waste_unit: 'kg',
            used_oil_liters: outlet.type === 'kedai_kopi' ? 0 : 0.8,
            oil_sold: true,
            sync_status: 'local_only',
          });
          await db.utility_readings.put({
            id: `util-${outlet.id}-1`,
            business_id: outlet.id,
            client_id: `util-${outlet.id}-1`,
            period_start: '2026-10-19',
            period_end: '2026-10-25',
            kwh: outlet.type === 'kedai_kopi' ? 42 : 24,
            gas_kg: outlet.type === 'kedai_kopi' ? 3 : 12,
            water_m3: 1.4,
            source: 'manual',
            sync_status: 'local_only',
          });
        }
      }

      await db.catalog_items.where('business_id').equals(dataset.business.id).delete();
      await db.daily_logs.where('business_id').equals(dataset.business.id).delete();
      await db.utility_readings.where('business_id').equals(dataset.business.id).delete();
      await db.transactions.where('business_id').equals(dataset.business.id).delete();
      await db.challenges.where('business_id').equals(dataset.business.id).delete();

      await db.catalog_items.bulkPut(dataset.catalog);
      await db.daily_logs.bulkPut(dataset.dailyLogs);
      await db.utility_readings.bulkPut(dataset.utilityReadings);
      await db.transactions.bulkPut(dataset.transactions);
      await db.challenges.bulkPut(dataset.challenges);
      await db.emission_factors.bulkPut(dataset.emissionFactors);
    }
  );

  setActiveBusinessId(dataset.business.id);
  return dataset.business;
}

/**
 * Reset demo or wipe all local data cleanly.
 */
export async function clearAllLocalData(): Promise<void> {
  if (!db) return;
  await db.transaction(
    'rw',
    [
      db.businesses,
      db.catalog_items,
      db.daily_logs,
      db.utility_readings,
      db.transactions,
      db.challenges,
      db.recommendation_statuses,
    ],
    async () => {
      await db.businesses.clear();
      await db.catalog_items.clear();
      await db.daily_logs.clear();
      await db.utility_readings.clear();
      await db.transactions.clear();
      await db.challenges.clear();
      await db.recommendation_statuses.clear();
    }
  );
  setActiveBusinessId(null);
}

/**
 * Attempt to sync pending local records to Supabase when online and authenticated.
 * Uses client_id to prevent duplicate records.
 */
export async function syncPendingRecordsToCloud(businessId: string): Promise<{
  syncedCount: number;
  pendingCount: number;
  mode: 'cloud_synced' | 'offline_queue' | 'local_only';
}> {
  if (!db) {
    return { syncedCount: 0, pendingCount: 0, mode: 'local_only' };
  }

  const pendingTx = await db.transactions
    .where('business_id')
    .equals(businessId)
    .filter((t) => t.sync_status === 'pending_sync')
    .toArray();

  const pendingLogs = await db.daily_logs
    .where('business_id')
    .equals(businessId)
    .filter((l) => l.sync_status === 'pending_sync')
    .toArray();

  const totalPending = pendingTx.length + pendingLogs.length;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline || !isSupabaseConfigured) {
    return {
      syncedCount: 0,
      pendingCount: totalPending,
      mode: isOnline ? 'local_only' : 'offline_queue',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { syncedCount: 0, pendingCount: totalPending, mode: 'local_only' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user) {
    return { syncedCount: 0, pendingCount: totalPending, mode: 'local_only' };
  }

  let syncedCount = 0;

  for (const tx of pendingTx) {
    const { error } = await supabase.from('transactions').upsert(
      {
        business_id: tx.business_id,
        client_id: tx.client_id,
        type: tx.type,
        item_name: tx.item_name,
        kind: tx.kind,
        qty: tx.qty,
        unit: tx.unit,
        amount_idr: tx.amount_idr,
        is_single_use: tx.is_single_use,
        occurred_at: tx.occurred_at,
        source: tx.source,
        confidence: tx.confidence,
        status: tx.status,
      },
      { onConflict: 'client_id' }
    );
    if (!error) {
      await db.transactions.update(tx.id, { sync_status: 'synced' });
      syncedCount++;
    }
  }

  for (const log of pendingLogs) {
    const { error } = await supabase.from('daily_logs').upsert(
      {
        business_id: log.business_id,
        client_id: log.client_id,
        date: log.date,
        portions_sold: log.portions_sold,
        waste_amount: log.waste_amount,
        waste_unit: log.waste_unit,
        used_oil_liters: log.used_oil_liters,
        oil_sold: log.oil_sold,
        note: log.note,
      },
      { onConflict: 'client_id' }
    );
    if (!error) {
      await db.daily_logs.update(log.id, { sync_status: 'synced' });
      syncedCount++;
    }
  }

  const remaining = Math.max(0, totalPending - syncedCount);
  return {
    syncedCount,
    pendingCount: remaining,
    mode: remaining === 0 ? 'cloud_synced' : 'offline_queue',
  };
}
