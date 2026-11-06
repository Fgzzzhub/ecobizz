# EcoBiz — PWA Pembukuan Hijau untuk UMKM Kuliner

**EcoBiz** adalah aplikasi web progresif (*Progressive Web App* / PWA) pembukuan hijau *offline-first* untuk UMKM kuliner Indonesia (warung makan, gorengan, kedai kopi, dan katering kecil).

Dirancang dengan identitas visual **Buku Nota Warung** (kertas krem hangat `#F6F1E7`, tinta hijau tua `#1F3D2B`, aksen kunyit `#E0A526`, dan terakota `#C4572F`), EcoBiz membantu pemilik warung mencatat penjualan, belanja bahan, pemakaian energi, sisa adonan/bahan harian, serta minyak jelantah hanya dengan satu tangan.

---

## Fitur Utama & Prinsip Kejujuran Data

1. **Perhitungan Deterministik 100% (`src/lib/calc`):**
   - Seluruh angka intensitas per porsi (`L/P`, `G/P`, `A/P`, `K/P`, `Bahan Terbuang %`), baseline 4 minggu kalibrasi, target penghematan, Skor Hijau (stempel nota), biaya lingkungan yang bisa dikurangi, penghematan terukur, dan estimasi emisi dihitung oleh kode deterministik TypeScript — bukan oleh LLM.
2. **Transparansi Penuh ("Dari mana angka ini?"):**
   - Setiap angka di laporan maupun beranda memiliki tombol **"Dari mana angka ini?"** yang menampilkan rumus, nilai input aktual minggu tersebut, perbandingan baseline/target, dan asumsi perhitungan.
3. **Jujur & Tidak Mengklaim Sertifikasi:**
   - Menampilkan pesan **"Estimasi, bukan sertifikasi hijau"**.
   - Memisahkan **Tingkat Kepercayaan Data** (`Tinggi` ≥ 6 hari, `Sedang` 4–5 hari, `Rendah` < 4 hari) dari nilai Skor Hijau.
   - Faktor emisi awal disimpan di tabel berversi dengan label eksplisit `PLACEHOLDER, ganti dengan sumber resmi` dan ditampilkan sebagai **Faktor ilustrasi** di antarmuka sampai diganti.
4. **Mode Demo 1-Ketuk ("Warung Gorengan Bu Ani" — 8 Minggu):**
   - Memuat 8 minggu data realistis usaha gorengan dengan fluktuasi cuaca/akhir pekan yang nyata (bukan kurva mulus buatan) dan tren penghematan bertahap dalam waktu kurang dari 1 detik. Dilengkapi tombol **Reset Demo**.

---

## Cara Menjalankan Secara Lokal

```bash
# 1. Instal dependensi
npm install

# 2. Jalankan semua unit test rumus deterministik & klasifikasi (Vitest)
npm run test

# 3. Jalankan server pengembangan
npm run dev
```

Buka `http://localhost:3000` di browser (atau gunakan mode responsif HP di DevTools).

---

## Panduan Demo 2 Menit di Depan Juri

1. **Detik 0–20 (Masalah & Identitas Buku Nota):**
   - Buka aplikasi dan tunjukkan tampilan **Buku Nota Warung** yang akrab bagi pemilik UMKM. Ketuk tombol hijau **"Buka Demo Warung Bu Ani (8 Minggu)"**.
2. **Detik 20–60 (Laporan Mingguan & Transparansi):**
   - Tunjukkan **Cap Nota Hijau (Skor 84/100)**, lencana terpisah **Kepercayaan Data: Tinggi (7/7 hari)**, dan pesan **"Estimasi, bukan sertifikasi hijau"**.
   - Ketuk **"Dari mana angka ini?"** pada Skor Hijau atau Biaya Lingkungan untuk membuktikan rumus deterministik dan asal-usul angka.
   - Tunjukkan grafik tren 8 minggu yang realistis (minggu 1–4 kalibrasi ~8%, sempat naik sedikit saat hujan di minggu 6, lalu turun ke 6,17% di minggu 8 berkat pembagian adonan sore).
3. **Detik 60–95 (Catat 1 Tangan: Suara, Foto Struk, Ketik Cepat):**
   - Buka tab **Hari Ini**, tunjukkan dua kartu pertanyaan harian yang bisa dilewati (*"Sisa adonan hari ini berapa baskom?"* dan *"Jelantah hari ini berapa liter?"*).
   - Ketuk tombol besar **Catat**, pilih kalimat suara/ketik *"Beli minyak goreng 5 liter 85 ribu"*, periksa **Kartu Konfirmasi**, lalu simpan 1 ketuk.
4. **Detik 95–120 (Target, Tantangan 7 Hari, & Ekspor):**
   - Buka tab **Target** untuk menggeser target penghematan $t$ (5%–20%) dan melihat progres Tantangan 7 Hari.
   - Kembali ke **Laporan**, ketuk **Unduh CSV** atau **Cetak / PDF**.

---

## Setup Supabase (Auth, Database, RLS, & Storage)

Aplikasi bekerja penuh secara *offline-first* menggunakan IndexedDB (Dexie.js) bahkan tanpa kredensial Supabase. Untuk mengaktifkan sinkronisasi cloud dan login *Magic Link*:

1. Buat proyek baru di [Supabase](https://supabase.com).
2. Salin `.env.example` menjadi `.env.local` dan isi:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://project-id-anda.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key-anda
   ENABLE_AI_ASSISTANT=false
   ```
3. Jalankan SQL migrasi dan seed di **Supabase SQL Editor**:
   - Jalankan isi file `supabase/migrations/0001_initial_schema.sql` (membuat seluruh tabel, fungsi `is_business_owner`, kebijakan RLS ketat per pemilik usaha, dan bucket Storage `receipts`).
   - Jalankan isi file `supabase/seed.sql` (mengisi tabel `emission_factors` dengan versi awal berlabel `PLACEHOLDER, ganti dengan sumber resmi`).
4. Aktifkan **Email Provider (Magic Link)** di menu *Authentication → Providers* pada dashboard Supabase.

---

## Deploy ke Vercel

1. Push repositori ini ke GitHub / GitLab.
2. Impor proyek di [Vercel](https://vercel.com/new).
3. Tambahkan variabel lingkungan (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) di pengaturan proyek Vercel.
4. Klik **Deploy**. Manifest PWA (`/manifest.json`) dan Service Worker (`/sw.js`) akan otomatis disajikan dari folder `public/`.
