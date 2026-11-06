# AGENTS.md — Panduan Kerja & Standar Proyek EcoBiz

Dokumen ini menjadi pegangan utama bagi seluruh AI Agent dan pengembang yang bekerja di repositori **EcoBiz**.

---

## 1. Visi Produk & Identitas Desain

**EcoBiz** adalah PWA pembukuan hijau untuk UMKM kuliner Indonesia (warung makan, gorengan, kedai kopi, katering kecil).
- **Konsep Visual:** **Buku Nota Warung** (bukan dashboard SaaS korporat).
- **Palet Warna:**
  - Kertas (`--bg-paper`): `#F6F1E7`
  - Tinta (`--ink`): `#1F3D2B`
  - Daun (`--leaf`): `#4F8A4B`
  - Kunyit (`--turmeric`): `#E0A526`
  - Terakota (`--terracotta`): `#C4572F`
  - Garis Nota (`--line`): `#D8CFBC`
  - Mode Malam Hangat (`[data-theme="dark"]`): Kertas malam `#181613`, lembar nota `#23201B`, tinta krem `#EFE9DC`.
- **Tipografi:**
  - Judul & Skor Stempel: **Fraunces** (Display Serif berkarakter)
  - Teks Antarmuka: **Instrument Sans** (Humanist Sans)
  - Angka, Rupiah, dan Tabel Nota: **IBM Plex Mono** (`tabular-nums`)
- **Larangan Desain:**
  - DILARANG menggunakan gradien ungu-biru, glassmorphism, efek neon/glow, emoji sebagai ikon utama UI, atau layout dashboard 12 kartu generik.
  - Gunakan ilustrasi garis SVG buatan sendiri (baskom adonan, jeriken jelantah, kantong kemasan, gerobak warung).

---

## 2. Prinsip yang Tidak Boleh Dilanggar

1. **Perhitungan Deterministik 100%:** Semua rumus skor, intensitas, biaya lingkungan, dan emisi dihitung oleh kode TypeScript murni di `src/lib/calc/`. LLM tidak pernah dipakai untuk menghitung angka.
2. **Transparansi Penuh ("Dari mana angka ini?"):** Setiap metrik di UI wajib memiliki pemicu penjelasan yang membuka rincian rumus, nilai input aktual, baseline, target, dan asumsi sumber data.
3. **Kejujuran Ilmiah:**
   - Selalu tampilkan badge `"Estimasi, bukan sertifikasi hijau"`.
   - Pisahkan **Tingkat Kepercayaan Data** (`Tinggi` ≥ 6 hari, `Sedang` 4–5 hari, `Rendah` < 4 hari) dari nilai Skor Hijau.
   - Faktor emisi awal wajib berstatus `is_placeholder = true` dengan label `"PLACEHOLDER, ganti dengan sumber resmi"` dan tampil sebagai `"Faktor ilustrasi"` di UI.
4. **Bahasa:**
   - Antarmuka pengguna (UI): Bahasa Indonesia sehari-hari yang ramah, ringkas, dan jelas untuk pemilik warung.
   - Kode sumber, nama variabel, fungsi, dan komentar: Bahasa Inggris.

---

## 3. Struktur Direktori Proyek

```text
.
├── docs/
│   └── ASSUMPTIONS.md          # Daftar asumsi produk, rumus, dan arsitektur
├── public/
│   ├── manifest.json           # Web App Manifest PWA
│   ├── sw.js                   # Service Worker offline-first
│   └── icons/                  # Ikon PWA maskable & apple-touch-icon
├── supabase/
│   ├── migrations/             # Skema SQL Postgres + kebijakan RLS
│   └── seed.sql                # Data awal faktor emisi, aturan, & katalog
├── src/
│   ├── app/                    # Next.js App Router (Halaman & API Routes)
│   ├── components/             # Komponen UI bergaya Buku Nota Warung
│   │   ├── illustrations/      # SVG garis buatan sendiri
│   │   ├── layout/             # Navigasi bawah 1-tangan, header nota, banner status
│   │   ├── modals/             # Modal "Dari mana angka ini?" (Provenance/Audit)
│   │   └── report/             # Stempel Skor Hijau, grafik garis minimalis, sparkline
│   ├── db/                     # Dexie.js IndexedDB schema, seed lokal, & sync queue
│   ├── lib/
│   │   ├── calc/               # Rumus deterministik & unit tests (Vitest)
│   │   ├── classify/           # Klasifikasi transaksi berbasis kamus kata kunci
│   │   ├── demo/               # Generator data realistis 8 minggu "Warung Bu Ani"
│   │   └── supabase/           # Klien Supabase & sinkronisasi cloud
│   └── types/                  # Definisi tipe TypeScript strict
├── tests/
│   └── smoke.spec.ts           # Playwright E2E smoke test
└── AGENTS.md                   # Dokumen panduan ini
```

---

## 4. Perintah Utama

- `npm run dev` — Menjalankan server pengembangan Next.js
- `npm run test` — Menjalankan seluruh unit test rumus deterministik dengan Vitest (`vitest run`)
- `npm run build` — Memvalidasi TypeScript strict dan membangun aplikasi produksi
- `npm run test:e2e` — Menjalankan smoke test Playwright
