'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BusinessProfile,
  CatalogItem,
  ChallengeRecord,
  DailyLogRecord,
  EmissionFactorRecord,
  MetricProvenance,
  RecommendationStatusRecord,
  TransactionRecord,
  UtilityReadingRecord,
} from '@/types';
import {
  clearAllLocalData,
  db,
  ensureDefaultEmissionFactors,
  getActiveBusinessId,
  getAllBusinesses,
  seedWarungBuAniDemo,
  setActiveBusinessId,
  syncPendingRecordsToCloud,
} from '@/db';
import {
  buildWeeklyRawTotals,
  DEFAULT_EMISSION_FACTORS,
} from '@/lib/demo/warungBuAni';
import { computeAllWeeklyReports } from '@/lib/calc';
import { OnboardingView } from '@/components/screens/OnboardingView';
import { HomeTodayView } from '@/components/screens/HomeTodayView';
import { RecordCatatView } from '@/components/screens/RecordCatatView';
import { WeeklyReportView } from '@/components/screens/WeeklyReportView';
import { TargetsChallengesView } from '@/components/screens/TargetsChallengesView';
import { SettingsView } from '@/components/screens/SettingsView';
import { ProvenanceModal } from '@/components/modals/ProvenanceModal';
import {
  Home,
  Mic,
  BarChart3,
  Target,
  Settings,
  WifiOff,
  RotateCcw,
  ArrowUpRight,
  Leaf,
  Moon,
  Sun,
} from 'lucide-react';
import { PillSelect } from '@/components/ui/PillSelect';

export type ThemeMode = 'emerald' | 'dark' | 'light';
type NavTab = 'today' | 'catat' | 'report' | 'targets' | 'settings';

export default function EcoBizAppPage() {
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [catatTemplateText, setCatatTemplateText] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('emerald');
  const [defaultWasteUnit, setDefaultWasteUnit] = useState<
    'kg' | 'baskom' | 'porsi'
  >('baskom');

  // Domain State loaded from IndexedDB
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<BusinessProfile[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogRecord[]>([]);
  const [utilityReadings, setUtilityReadings] = useState<
    UtilityReadingRecord[]
  >([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([]);
  const [recStatuses, setRecStatuses] = useState<RecommendationStatusRecord[]>(
    []
  );
  const [emissionFactors, setEmissionFactors] = useState<
    EmissionFactorRecord[]
  >(DEFAULT_EMISSION_FACTORS);

  // Sync & Online State
  const [isOnline, setIsOnline] = useState(true);
  const [syncState, setSyncState] = useState<{
    pendingCount: number;
    mode: 'cloud_synced' | 'offline_queue' | 'local_only';
  }>({
    pendingCount: 0,
    mode: 'local_only',
  });

  // Provenance Modal ("Dari mana angka ini?")
  const [inspectedProvenance, setInspectedProvenance] =
    useState<MetricProvenance | null>(null);

  /**
   * Reload all data for a given businessId from IndexedDB
   */
  const loadBusinessBundle = useCallback(async (bizId: string) => {
    if (!db) return;
    const biz = await db.businesses.get(bizId);
    if (!biz) {
      setBusiness(null);
      return;
    }

    const [cats, logs, utils, txs, chals, recs, factors, allBiz] = await Promise.all([
      db.catalog_items.where('business_id').equals(bizId).toArray(),
      db.daily_logs.where('business_id').equals(bizId).toArray(),
      db.utility_readings.where('business_id').equals(bizId).toArray(),
      db.transactions.where('business_id').equals(bizId).toArray(),
      db.challenges.where('business_id').equals(bizId).toArray(),
      db.recommendation_statuses.where('business_id').equals(bizId).toArray(),
      ensureDefaultEmissionFactors(),
      getAllBusinesses(),
    ]);

    setBusiness(biz);
    setAllBusinesses(allBiz);
    setCatalog(cats);
    setDailyLogs(logs.sort((a, b) => a.date.localeCompare(b.date)));
    setUtilityReadings(
      utils.sort((a, b) => a.period_start.localeCompare(b.period_start))
    );
    setTransactions(
      txs.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    );
    setChallenges(chals);
    setRecStatuses(recs);
    setEmissionFactors(factors);

    const syncRes = await syncPendingRecordsToCloud(bizId);
    setSyncState({
      pendingCount: syncRes.pendingCount,
      mode: syncRes.mode,
    });
  }, []);

  /**
   * Initial mount: register PWA service worker, check online state, load active business
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-blocking in dev mode
      });
    }

    const savedTheme = window.localStorage.getItem('ecobiz_theme_mode') as ThemeMode | null;
    const initialTheme: ThemeMode =
      savedTheme === 'emerald' || savedTheme === 'dark' || savedTheme === 'light'
        ? savedTheme
        : 'emerald';
    setThemeMode(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    (async () => {
      await ensureDefaultEmissionFactors();
      const savedId = getActiveBusinessId();
      if (savedId && db) {
        const existing = await db.businesses.get(savedId);
        if (existing) {
          await loadBusinessBundle(savedId);
          setIsReady(true);
          return;
        }
      }
      if (db) {
        const firstBiz = await db.businesses.toCollection().first();
        if (firstBiz) {
          setActiveBusinessId(firstBiz.id);
          await loadBusinessBundle(firstBiz.id);
        }
      }
      setIsReady(true);
    })();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadBusinessBundle]);

  /**
   * Switch between the 3 theme layers:
   * 1. 'emerald' (Default: Zamrud #013E37, Krem #FFF3D5, Mentega #FFEFB3, Sage #4D694E)
   * 2. 'dark'    (Gelap Obsidian #0F0F0F & Lime #C7FF2E)
   * 3. 'light'   (Terang Bersih #F5F5F7 & Putih #FFFFFF)
   */
  const handleSelectThemeMode = (nextTheme: ThemeMode) => {
    setThemeMode(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
      window.localStorage.setItem('ecobiz_theme_mode', nextTheme);
    }
  };

  const handleCycleThemeMode = () => {
    const order: ThemeMode[] = ['emerald', 'dark', 'light'];
    const nextIdx = (order.indexOf(themeMode) + 1) % order.length;
    handleSelectThemeMode(order[nextIdx]);
  };

  /**
   * 1-Click Demo Mode Loader ("Warung Bu Ani" 8 weeks)
   */
  const handleLoadDemoMode = async () => {
    const demoBiz = await seedWarungBuAniDemo();
    await loadBusinessBundle(demoBiz.id);
    setActiveTab('report');
  };

  /**
   * 1-Click Reset Demo / Wipe Local Data
   */
  const handleResetDemoMode = async () => {
    await clearAllLocalData();
    setBusiness(null);
    setCatalog([]);
    setDailyLogs([]);
    setUtilityReadings([]);
    setTransactions([]);
    setChallenges([]);
    setActiveTab('today');
  };

  /**
   * Complete 3-Step Onboarding
   */
  const handleCompleteOnboarding = async (
    newBiz: BusinessProfile,
    newCatalog: CatalogItem[],
    wasteUnitChoice: 'kg' | 'baskom' | 'porsi'
  ) => {
    setDefaultWasteUnit(wasteUnitChoice);
    if (db) {
      await db.businesses.put(newBiz);
      await db.catalog_items.bulkPut(newCatalog);
      // Create a starter 7-day challenge
      await db.challenges.put({
        id: `chal-init-${Date.now()}`,
        business_id: newBiz.id,
        code: '7d_small_batch_dough',
        title: 'Tantangan 7 Hari: Takaran Sisa Bahan Hemat',
        description:
          'Catat sisa bahan dan jelantah setiap sore selama 7 hari berturut-turut untuk kalibrasi.',
        duration_days: 7,
        progress_days: 1,
        checked_dates: [new Date().toISOString().slice(0, 10)],
        status: 'active',
        started_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      });
    }
    setActiveBusinessId(newBiz.id);
    await loadBusinessBundle(newBiz.id);
    setActiveTab('today');
  };

  /**
   * Save confirmed transaction from RecordCatatView
   */
  const handleSaveTransaction = async (tx: TransactionRecord) => {
    if (!business || !db) return;
    await db.transactions.put(tx);

    // If sale transaction in portions, also update today's daily log portions if not yet logged
    const dateStr = tx.occurred_at.slice(0, 10);
    if (tx.type === 'sale' && tx.unit === 'porsi') {
      const existingLog = await db.daily_logs
        .where('business_id')
        .equals(business.id)
        .filter((l) => l.date === dateStr)
        .first();

      if (existingLog) {
        await db.daily_logs.update(existingLog.id, {
          portions_sold: existingLog.portions_sold + tx.qty,
          sync_status: 'pending_sync',
        });
      } else {
        const logId = `log-${Date.now()}`;
        await db.daily_logs.put({
          id: logId,
          business_id: business.id,
          client_id: logId,
          date: dateStr,
          portions_sold: tx.qty,
          waste_amount: 0,
          waste_unit: defaultWasteUnit,
          used_oil_liters: 0,
          oil_sold: false,
          sync_status: 'pending_sync',
        });
      }
    }

    await loadBusinessBundle(business.id);
  };

  /**
   * Save or update today's DailyLog (Sisa adonan & Jelantah cards)
   */
  const handleSaveDailyLog = async (partial: {
    portions_sold?: number;
    waste_amount?: number;
    waste_unit?: 'kg' | 'baskom' | 'porsi';
    used_oil_liters?: number;
    oil_sold?: boolean;
  }) => {
    if (!business || !db) return;
    // Use latest date in demo or today's date
    const todayStr =
      business.is_demo && dailyLogs.length > 0
        ? dailyLogs[dailyLogs.length - 1].date
        : new Date().toISOString().slice(0, 10);

    const existing = await db.daily_logs
      .where('business_id')
      .equals(business.id)
      .filter((l) => l.date === todayStr)
      .first();

    if (existing) {
      await db.daily_logs.update(existing.id, {
        ...partial,
        sync_status: 'pending_sync',
      });
    } else {
      const id = `log-${Date.now()}`;
      await db.daily_logs.put({
        id,
        business_id: business.id,
        client_id: id,
        date: todayStr,
        portions_sold: partial.portions_sold ?? 250,
        waste_amount: partial.waste_amount ?? 0.5,
        waste_unit: partial.waste_unit ?? defaultWasteUnit,
        used_oil_liters: partial.used_oil_liters ?? 0,
        oil_sold: partial.oil_sold ?? false,
        sync_status: 'pending_sync',
      });
    }
    await loadBusinessBundle(business.id);
  };

  /**
   * Deterministic Weekly Reports Computation
   */
  const weeklyReports = useMemo(() => {
    if (!business) return [];
    const weeklyRawList = buildWeeklyRawTotals({
      dailyLogs,
      utilityReadings,
      transactions,
    });
    return computeAllWeeklyReports({
      weeklyRawList,
      targetPct: business.target_pct,
      weights: business.weights,
      tariffs: business.tariffs,
      emissionFactors,
      recommendationStatuses: recStatuses,
    });
  }, [
    business,
    dailyLogs,
    utilityReadings,
    transactions,
    emissionFactors,
    recStatuses,
  ]);

  const latestReport =
    weeklyReports.length > 0 ? weeklyReports[weeklyReports.length - 1] : null;

  const todayLog =
    dailyLogs.length > 0 ? dailyLogs[dailyLogs.length - 1] : null;

  const todayTransactions = useMemo(() => {
    if (transactions.length === 0) return [];
    const latestDate = transactions[0].occurred_at.slice(0, 10);
    return transactions.filter((t) => t.occurred_at.startsWith(latestDate));
  }, [transactions]);

  if (!isReady) {
    return (
      <div
        suppressHydrationWarning
        className="min-h-dvh flex items-center justify-center p-6 bg-[var(--bg-paper)]"
      >
        <div
          suppressHydrationWarning
          className="nota-card p-8 text-center max-w-sm"
        >
          <span className="inline-block px-3.5 py-1 rounded-full border border-[var(--line)] text-[11px] font-medium text-[var(--ink-muted)] mb-3">
            EcoBiz
          </span>
          <div
            suppressHydrationWarning
            className="font-serif text-2xl text-[var(--ink)]"
          >
            Membuka Buku Nota EcoBiz...
          </div>
          <p
            suppressHydrationWarning
            className="text-xs text-[var(--ink-muted)] mt-2"
          >
            Menyiapkan catatan warung di HP kamu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col pb-36">
      {/* Apple-Style Floating Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--bg-paper)]/80 border-b border-[var(--line)] px-4 py-3 no-print transition-colors duration-300">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Electric Lime Circular Avatar / Emblem */}
            <div className="w-10 h-10 rounded-full bg-[#C7FF2E] text-[#0F0F0F] flex items-center justify-center font-serif text-lg shrink-0 select-none shadow-md shadow-[#C7FF2E]/15 pt-0.5">
              H
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl text-[var(--ink)] tracking-tight leading-none pt-0.5">
                  EcoBiz
                </span>
                {business?.is_demo && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F]">
                    Contoh Bu Ani
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)] mt-0.5">
                {!isOnline ? (
                  <>
                    <WifiOff className="w-3 h-3 text-[#FF5A36]" />
                    <span>Tanpa sinyal • Aman di HP</span>
                  </>
                ) : syncState.mode === 'cloud_synced' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C7FF2E]" />
                    <span>Tersimpan di Cloud</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C7FF2E]" />
                    <span>
                      Tersimpan di HP
                      {syncState.pendingCount > 0
                        ? ` • ${syncState.pendingCount} belum sinkron`
                        : ' • Siap tanpa sinyal'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Pill Action Controls + Theme Layer Switcher + Multi-Account Dropdown */}
          <div className="flex items-center gap-2">
            {/* 3-Layer Theme Switcher Button */}
            <button
              type="button"
              onClick={handleCycleThemeMode}
              title={`Tema saat ini: ${
                themeMode === 'emerald'
                  ? 'Zamrud & Krem (Default)'
                  : themeMode === 'dark'
                  ? 'Gelap Obsidian'
                  : 'Terang Bersih'
              } — Ketuk untuk ganti tema`}
              className="min-h-[40px] px-3 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-paper-card)] text-[var(--ink)] text-xs font-medium inline-flex items-center gap-1.5 apple-press cursor-pointer"
            >
              <span
                key={themeMode}
                className="apple-scale-in w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor:
                    themeMode === 'emerald'
                      ? '#013E37'
                      : themeMode === 'dark'
                      ? '#0F0F0F'
                      : '#F5F5F7',
                  color:
                    themeMode === 'emerald'
                      ? '#FFEFB3'
                      : themeMode === 'dark'
                      ? '#C7FF2E'
                      : '#0F0F0F',
                  boxShadow: 'inset 0 0 0 1px rgba(128,128,128,0.35)',
                }}
              >
                {themeMode === 'emerald' ? (
                  <Leaf className="w-3.5 h-3.5" strokeWidth={2.2} />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-3.5 h-3.5" strokeWidth={2.2} />
                ) : (
                  <Sun className="w-3.5 h-3.5" strokeWidth={2.2} />
                )}
              </span>
              <span className="hidden sm:inline">
                {themeMode === 'emerald'
                  ? 'Zamrud'
                  : themeMode === 'dark'
                  ? 'Gelap'
                  : 'Terang'}
              </span>
            </button>

            {business && allBusinesses.length > 0 && (
              <PillSelect
                ariaLabel="Pilih akun warung atau pelanggan"
                testId="select-account-switcher"
                value={business.id}
                className="max-w-[160px] sm:max-w-[230px]"
                options={[
                  ...allBusinesses.map((b) => ({ value: b.id, label: b.name })),
                  {
                    value: '__add_new__',
                    label: '+ Tambah akun warung baru',
                    isAction: true,
                  },
                ]}
                onChange={async (val) => {
                  if (val === '__add_new__') {
                    setBusiness(null);
                    return;
                  }
                  setActiveBusinessId(val);
                  await loadBusinessBundle(val);
                }}
              />
            )}

            {!business?.is_demo ? (
              <button
                type="button"
                data-testid="btn-header-load-demo"
                onClick={handleLoadDemoMode}
                className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#C7FF2E] text-[#0F0F0F] text-xs font-semibold inline-flex items-center gap-1.5 apple-press hover:brightness-105 cursor-pointer"
              >
                <span>Contoh Bu Ani</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                data-testid="btn-header-reset-demo"
                onClick={handleResetDemoMode}
                className="min-h-[40px] px-4 py-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-paper-card)] text-[var(--ink)] text-xs font-medium inline-flex items-center gap-1.5 apple-press hover:border-[#C7FF2E] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C7FF2E]" />
                Mulai Baru
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container with Apple Spring View Transition */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {!business ? (
          <div className="apple-view-enter">
            <OnboardingView
              onCompleteOnboarding={handleCompleteOnboarding}
              onLoadDemo={handleLoadDemoMode}
            />
          </div>
        ) : (
          <div key={activeTab} className="apple-view-enter">
            {activeTab === 'today' && (
              <HomeTodayView
                business={business}
                todayLog={todayLog}
                todayTransactions={todayTransactions}
                latestReport={latestReport}
                defaultWasteUnit={defaultWasteUnit}
                onOpenCatat={(tpl) => {
                  setCatatTemplateText(tpl || '');
                  setActiveTab('catat');
                }}
                onSaveDailyLog={handleSaveDailyLog}
                onOpenReport={() => setActiveTab('report')}
                onInspectProvenance={setInspectedProvenance}
              />
            )}

            {activeTab === 'catat' && (
              <RecordCatatView
                businessId={business.id}
                businessName={business.name}
                businessType={business.type}
                catalog={catalog}
                initialTemplateText={catatTemplateText}
                onSaveTransaction={handleSaveTransaction}
                onLearnCatalogItem={async (newCatItem) => {
                  if (!db) return;
                  await db.catalog_items.put(newCatItem);
                  await loadBusinessBundle(business.id);
                }}
                onDone={() => {
                  setCatatTemplateText('');
                  setActiveTab('today');
                }}
              />
            )}

            {activeTab === 'report' && (
              <WeeklyReportView
                business={business}
                reports={weeklyReports}
                onInspectProvenance={setInspectedProvenance}
                onUpdateRecommendationStatus={async (ruleId, status) => {
                  if (!db) return;
                  await db.recommendation_statuses.put({
                    id: `${business.id}_${ruleId}`,
                    business_id: business.id,
                    rule_id: ruleId,
                    status,
                    updated_at: new Date().toISOString(),
                  });
                  await loadBusinessBundle(business.id);
                }}
              />
            )}

            {activeTab === 'targets' && (
              <TargetsChallengesView
                business={business}
                challenges={challenges}
                latestReport={latestReport}
                onUpdateTargetPct={async (newTargetPct) => {
                  if (!db) return;
                  const updated = {
                    ...business,
                    target_pct: newTargetPct,
                    updated_at: new Date().toISOString(),
                  };
                  await db.businesses.put(updated);
                  await loadBusinessBundle(business.id);
                }}
                onCheckInChallengeToday={async (challengeId) => {
                  if (!db) return;
                  const chal = await db.challenges.get(challengeId);
                  if (!chal) return;
                  const todayStr = new Date().toISOString().slice(0, 10);
                  if (chal.checked_dates.includes(todayStr)) return;
                  const nextDates = [...chal.checked_dates, todayStr];
                  const nextProgress = Math.min(
                    chal.duration_days,
                    chal.progress_days + 1
                  );
                  await db.challenges.update(challengeId, {
                    checked_dates: nextDates,
                    progress_days: nextProgress,
                    status:
                      nextProgress >= chal.duration_days
                        ? 'completed'
                        : 'active',
                    updated_at: new Date().toISOString(),
                  });
                  await loadBusinessBundle(business.id);
                }}
                onCreateChallenge={async (tpl) => {
                  if (!db) return;
                  const todayStr = new Date().toISOString().slice(0, 10);
                  await db.challenges.put({
                    id: `chal-${Date.now()}`,
                    business_id: business.id,
                    code: tpl.code,
                    title: tpl.title,
                    description: tpl.description,
                    duration_days: tpl.duration_days,
                    progress_days: 1,
                    checked_dates: [todayStr],
                    status: 'active',
                    started_at: todayStr,
                    updated_at: new Date().toISOString(),
                  });
                  await loadBusinessBundle(business.id);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                business={business}
                emissionFactors={emissionFactors}
                syncState={syncState}
                themeMode={themeMode}
                onSelectThemeMode={handleSelectThemeMode}
                onUpdateBusiness={async (updated) => {
                  if (!db) return;
                  await db.businesses.put(updated);
                  await loadBusinessBundle(business.id);
                }}
                onUpdateEmissionFactor={async (factor) => {
                  if (!db) return;
                  await db.emission_factors.put(factor);
                  await loadBusinessBundle(business.id);
                }}
                onLoadDemo={handleLoadDemoMode}
                onResetAllData={handleResetDemoMode}
                onExportJsonBackup={async () => {
                  const payload = {
                    exported_at: new Date().toISOString(),
                    business,
                    catalog,
                    daily_logs: dailyLogs,
                    utility_readings: utilityReadings,
                    transactions,
                    challenges,
                    emission_factors: emissionFactors,
                  };
                  const blob = new Blob([JSON.stringify(payload, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `EcoBiz-Backup-${business.name.replace(/\s+/g, '-')}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onTriggerSync={async () => {
                  const res = await syncPendingRecordsToCloud(business.id);
                  setSyncState({
                    pendingCount: res.pendingCount,
                    mode: res.mode,
                  });
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Apple Circular Pill Dock (Exact Specification from Image 2 + iOS Spring Physics) */}
      {business && (
        <nav
          aria-label="Navigasi Utama Buku Nota"
          className="fixed bottom-4 inset-x-0 z-30 px-4 pointer-events-none no-print"
        >
          <div className="max-w-md mx-auto p-2 rounded-full backdrop-blur-2xl apple-bottom-dock flex items-center justify-between gap-2 pointer-events-auto">
            {(
              [
                {
                  id: 'today',
                  label: 'Hari Ini',
                  icon: Home,
                  testId: 'nav-today',
                },
                {
                  id: 'catat',
                  label: 'Catat',
                  icon: Mic,
                  testId: 'nav-catat',
                },
                {
                  id: 'report',
                  label: 'Rapor',
                  icon: BarChart3,
                  testId: 'nav-report',
                },
                {
                  id: 'targets',
                  label: 'Target',
                  icon: Target,
                  testId: 'nav-targets',
                },
                {
                  id: 'settings',
                  label: 'Atur',
                  icon: Settings,
                  testId: 'nav-settings',
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={item.testId}
                  aria-label={item.label}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center gap-0.5 apple-press cursor-pointer ${
                    isActive
                      ? 'apple-dock-btn-active scale-105 font-bold'
                      : 'apple-dock-btn-inactive'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-medium leading-none mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Global "Dari mana angka ini?" Provenance Audit Modal */}
      <ProvenanceModal
        provenance={inspectedProvenance}
        onClose={() => setInspectedProvenance(null)}
      />
    </div>
  );
}
