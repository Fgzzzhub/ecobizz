# Daftar Asumsi & Keputusan Arsitektur — EcoBiz (PWA)

Dokumen ini mencatat asumsi teknis, produk, dan perhitungan yang digunakan dalam pengembangan **EcoBiz** agar semua angka dan perilaku sistem transparan dan dapat diaudit.

---

## 1. Arsitektur & Mode Penyimpanan (Dual-Mode: Offline-First + Cloud Sync)

1. **Offline-First dengan IndexedDB (Dexie.js):**
   - Seluruh pencatatan harian (`transactions`, `daily_logs`, `utility_readings`), profil usaha (`businesses`), katalog (`catalog_items`), faktor emisi (`emission_factors`), target, dan tantangan disimpan secara lokal di IndexedDB terlebih dahulu.
   - Setiap catatan memiliki `client_id` (UUID v4) dan `sync_status` (`local_only` | `pending_sync` | `synced`).
2. **Integrasi Supabase (Opsional saat Demo / Wajib di Produksi):**
   - Bila variabel lingkungan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` tersedia dan pengguna login (via Magic Link), antrean sinkronisasi (`syncQueue`) mengirim data ke Postgres Supabase dengan `ON CONFLICT (client_id) DO UPDATE` untuk mencegah duplikasi.
   - Bila dijalankan tanpa koneksi internet atau tanpa kredensial Supabase (misalnya saat demo juri atau pengembangan lokal instan), aplikasi berjalan 100% fungsional di atas penyimpanan lokal IndexedDB dengan indikator status sinkronisasi yang jujur (`"Tersimpan di HP, belum terkirim"` atau `"Mode Lokal / Demo"`).

---

## 2. Rumus & Konvensi Perhitungan (`lib/calc`)

1. **Periode Mingguan:**
   - Satu minggu dihitung Senin 00:00 hingga Minggu 23:59 (ISO week).
2. **Definisi Variabel Mingguan:**
   - $P$ = total porsi terjual (`SUM(daily_logs.portions_sold)` dalam minggu tersebut).
   - $L$ = pemakaian listrik dalam kWh (`utility_readings.kwh` yang jatuh pada minggu tersebut, atau estimasi dari transaksi pembelian token/tagihan listrik dibagi tarif per kWh jika belum ada pembacaan meter langsung).
   - $G$ = pemakaian gas LPG dalam kg (`utility_readings.gas_kg` atau konversi pembelian tabung LPG 3 kg / 12 kg pada minggu tersebut).
   - $A$ = pemakaian air dalam $\text{m}^3$ (`utility_readings.water_m3` atau konversi dari tagihan PDAM / air galon).
   - $W$ = total bahan terbuang dalam kg/liter setara (`SUM(daily_logs.waste_amount)` dikonversi ke satuan standar kg).
   - $B_{\text{pakai}}$ = total bahan baku terpakai dalam minggu tersebut (diestimasi dari pembelian bahan baku `bahan` pada minggu tersebut atau rata-rata pemakaian harian + $W$; bila pengguna dalam *Mode Cepat* belum mencatat berat seluruh bahan baku secara rinci, bahan terpakai diestimasi dari `portions_sold × std_ingredient_kg_per_portion` sesuai jenis usaha, dengan catatan eksplisit di modal *"Dari mana angka ini?"*).
   - $K$ = jumlah unit kemasan sekali pakai (`is_single_use = true`) yang terpakai pada minggu tersebut.
   - $J$ = liter minyak jelantah yang dihasilkan (`SUM(daily_logs.used_oil_liters)`).
3. **Intensitas Sumber Daya per Porsi:**
   - Intensitas Listrik = $L / P$ (kWh/porsi)
   - Intensitas Gas = $G / P$ (kg LPG/porsi)
   - Intensitas Air = $A / P$ ($\text{m}^3$/porsi)
   - Intensitas Kemasan = $K / P$ (pcs/porsi)
   - Persentase Bahan Terbuang = $(W / B_{\text{pakai}}) \times 100\%$
   - *Penanganan Pembagi Nol:* Jika $P = 0$ atau $B_{\text{pakai}} = 0$, nilai intensitas adalah `0` (bukan `NaN` atau `Infinity`) dan ditandai `insufficient_data = true`.
4. **Baseline & Target:**
   - **Baseline:** Rata-rata dari hingga 4 minggu pertama usaha memiliki catatan (masa kalibrasi).
   - **Target:** $\text{Baseline} \times (1 - t)$, dengan $t$ default `0.10` (10%, dapat diatur antara 5%–20%).
5. **Skor Dimensi & Skor Hijau:**
   - Rumus Skor Dimensi:
     $$\text{Skor} = \text{clamp}\left(50 + 50 \times \frac{\text{baseline} - \text{aktual}}{\text{baseline} \times t},\ 0,\ 100\right)$$
   - Contoh verifikasi: Baseline = `8%`, $t = 10\%$ sehingga Target = `7,2%` ($\text{baseline} \times t = 0,8\%$). Jika Aktual = `7,6%`, maka:
     $$50 + 50 \times \frac{8 - 7,6}{0,8} = 50 + 50 \times 0,5 = 75$$
   - Skor Dimensi Energi adalah rata-rata tertimbang (atau rata-rata setara) dari skor intensitas listrik dan gas LPG yang digunakan usaha tersebut.
   - **Skor Hijau Total:**
     $$0,30 \times S_{\text{limbah}} + 0,30 \times S_{\text{energi}} + 0,20 \times S_{\text{air}} + 0,20 \times S_{\text{kemasan}}$$
     (Bobot dapat dikustomisasi per usaha dan selalu dinormalisasi agar berjumlah 1,0).
6. **Biaya Lingkungan yang Bisa Dikurangi (Potensi Hemat Rupiah):**
   - $\text{Nilai bahan terbuang} = W \times \text{harga rata-rata bahan per kg}$
   - $\text{Potensi jual jelantah} = J \times \text{harga pengepul jelantah per liter}$ (dihitung bila jelantah belum dijual)
   - $\text{Kelebihan intensitas sumber daya} = \sum \max(0, I_{\text{aktual}} - I_{\text{target}}) \times P \times \text{tarif satuan}$
   - Total Biaya Lingkungan = jumlah ketiganya.
7. **Penghematan Terukur vs Baseline:**
   - Untuk tiap dimensi: $(I_{\text{baseline}} - I_{\text{aktual}}) \times P \times \text{tarif satuan}$.
   - Jika $|P_{\text{aktual}} - P_{\text{baseline}}| / P_{\text{baseline}} > 0,20$ (perubahan volume produksi > 20%), sistem menyertakan flag `production_volume_changed = true` dan catatan *"Produksi berubah >20% dibanding rata-rata awal"*.

---

## 3. Faktor Emisi & Tarif Default (Placeholder Berlabel Jelas)

Semua nilai awal di tabel `emission_factors` diberi atribut `is_placeholder = true` dan sumber `"PLACEHOLDER, ganti dengan sumber resmi"`:
- Listrik Grid Indonesia: `0,85 kg CO2e / kWh` (ilustrasi; wajib diganti faktor emisi grid Kementerian ESDM terbaru saat sertifikasi resmi).
- Gas LPG: `3,00 kg CO2e / kg LPG` (ilustrasi pembakaran stokiometri LPG; wajib diganti sumber resmi IPCC/ESDM).
- Tarif Listrik UMKM / Rumah Tangga Default: `Rp 1.445 / kWh` (dapat diubah di Pengaturan).
- Harga LPG 3 kg Default: `Rp 22.000 / tabung` (`~Rp 7.333 / kg`, dapat diubah di Pengaturan).
- Tarif Air Default: `Rp 7.500 / m³` (dapat diubah di Pengaturan).
- Harga Pengepul Jelantah Default: `Rp 6.500 / liter` (dapat diubah di Pengaturan).

---

## 4. Input Suara, Foto Struk (OCR), dan Klasifikasi

1. **Suara (Web Speech API `id-ID`):**
   - Menggunakan `webkitSpeechRecognition` / `SpeechRecognition` bawaan browser dengan bahasa `id-ID`.
   - Jika browser tidak mendukung (mis. desktop tertentu atau iOS lama), tombol mikrofon menampilkan panduan ramah dan membuka input teks cepat dengan chip kalimat siap pakai.
2. **Foto Struk (OCR Lokal):**
   - Menggunakan `tesseract.js` di sisi klien untuk mengekstrak teks struk belanja, lalu di-parse dengan parser deterministik (mendeteksi nama barang, kuantitas, dan harga Rupiah).
   - Selalu menyediakan fallback instan ke pengisian/koreksi manual pada Kartu Konfirmasi.
3. **Klasifikasi Kata Kunci Deterministik (`lib/classify`):**
   - Menggunakan kamus kata kunci Bahasa Indonesia (mis. *"minyak"*, *"tepung"*, *"ayam"*, *"kresek"*, *"cup"*, *"mika"*, *"token listrik"*, *"gas 3kg"*, *"galon"*, *"laku"*, *"terjual"*).
   - Route `/api/ai/parse` tersedia di balik flag `ENABLE_AI_ASSISTANT=true`, tetapi secara default tidak dibutuhkan agar MVP berjalan 100% gratis tanpa API berbayar.
