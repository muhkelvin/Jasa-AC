# ❄️ AC Service Management System (Sistem Operasional Servis & Maintenance AC)

Aplikasi web internal operasional (*Internal Business Operations*) untuk bisnis servis dan maintenance pendingin ruangan (AC). Sistem ini mengintegrasikan seluruh proses operasional mulai dari penerimaan order servis, penjadwalan & penugasan teknisi (*dispatch*), pengerjaan lapangan via antarmuka mobile, hingga pelaporan servis, verifikasi admin, dan pencatatan pembayaran.

> **Status:** Portfolio 02 · MVP v1.2 · Mobile-first · Production Ready

---

## 📌 1. Masalah & Solusi Bisnis

### Masalah yang Dihadapi Bisnis Servis AC Tradisional:
* **Pelacakan Manual:** Admin kesulitan melacak pekerjaan yang belum selesai karena tercecer di chat WhatsApp dan spreadsheet manual.
* **Jadwal & Penugasan Berantakan:** Risiko penugasan bentrok (*double booking*) antar teknisi lapangan tinggi.
* **Riwayat Servis Tersebar:** Sulit mengetahui kapan terakhir unit AC pelanggan dicuci atau sparepart apa yang pernah diganti.
* **Material & Biaya Tidak Transparan:** Penggunaan freon, pipa, kapasitor, dan biaya jasa teknisi sering tidak tercatat rapi.

### Solusi Sistem:
Satu aplikasi terintegrasi dengan dua antarmuka terdedikasi:
1. **Desktop Dispatch & Control Center** untuk Admin dan Owner: mengelola antrean pekerjaan, jadwal harian teknisi, verifikasi laporan, dan pembukuan operasional.
2. **Mobile Field Workspace** untuk Teknisi: antarmuka mobile-first dengan tombol tindakan cepat, integrasi Google Maps & panggilan telepon pelanggan, serta formulir laporan servis bertahap langsung dari lapangan.

---

## 🛠️ 2. Technology Stack

| Layer | Teknologi | Keterangan |
| --- | --- | --- |
| **Framework** | **Next.js 16 (App Router)** | Full-stack architecture, React Server Components, Suspense, PPR |
| **Bahasa** | **TypeScript 5** | Strict type safety di seluruh entitas database dan alur bisnis |
| **Styling** | **Tailwind CSS v4** | Clean design system tokens, zero-gradient, 1px borders, tabular numerals |
| **Ikonografi** | **Lucide React** | Ikon operasional konsisten (`ClipboardList`, `Wrench`, `CalendarClock`, dll.) |
| **Database** | **Supabase (PostgreSQL)** | Skema relasional, Enums, foreign keys, constraints non-negatif, indexes |
| **Keamanan** | **PostgreSQL RLS & RBAC** | Row-Level Security policies ketat pada 10 tabel operasional |
| **Validasi** | **Zod** | Validasi payload mutasi form, transisi status, dan laporan servis |
| **Pengujian** | **Vitest** | Unit testing untuk aturan *state machine* transisi dan kalkulasi biaya |

---

## 👥 3. Matriks Peran & Hak Akses (Role-Based Access)

Sistem mengadopsi 3 peran internal tanpa pendaftaran publik:

| Kemampuan / Fitur | Owner | Admin Ops | Teknisi Lapangan |
| --- | :---: | :---: | :---: |
| **Dashboard Operasional Global** | ✅ Lengkap | ✅ Lengkap | ❌ (Hanya tugas sendiri) |
| **Kelola Pelanggan & Unit AC** | ✅ Lihat & Kelola | ✅ Lihat & Kelola | 👁️ Sesuai penugasan |
| **Buat & Jadwalkan Work Order** | ✅ Ya | ✅ Ya | ❌ Tidak |
| **Tugaskan Teknisi (Dispatch)** | ✅ Ya | ✅ Ya | ❌ Tidak |
| **Mulai Kerja & Unggah Laporan** | ✅ Ya | ✅ Ya | ✅ Pekerjaan yang ditugaskan |
| **Review & Persetujuan Laporan** | ✅ Ya | ✅ Ya | ❌ Tidak |
| **Rekam Pembayaran & Lihat Omzet** | ✅ Ya | ✅ Ya | ❌ Tidak (Proteksi RLS) |
| **Lihat Jejak Audit Status** | ✅ Ya | ✅ Terbatas | ❌ Tidak |

---

## 🔄 4. Alur Kerja Status Pekerjaan (State Machine)

Status pekerjaan diproteksi secara terpusat oleh aturan transisi (*tidak dapat melompati alur*):

```
[ New ] ──────> [ Scheduled ] ──────> [ Assigned ] ──────> [ In Progress ]
                                                                 │   ▲
                                             Sparepart Habis     │   │ Sparepart Tiba
                                                                 ▼   │
                                                          [ Waiting Parts ]
                                                                 │
                                             Kirim Laporan       ▼
                                                      [ Pending Review ]
                                                                 │
                                             Disetujui Admin     ▼
                                                          [ Completed ]
```

*Catatan: Pembatalan pekerjaan (`cancelled`) hanya dapat dilakukan oleh Admin/Owner dengan mencantumkan alasan tertulis.*

---

## 📁 5. Struktur Direktori Proyek

```
jasa-ac/
├── app/
│   ├── (auth)/
│   │   └── login/             # Halaman login internal & pemilih akun simulasi
│   ├── customers/             # Manajemen pelanggan & unit AC terdaftar
│   ├── dashboard/             # Pusat operasional (antrean tindakan & ringkasan)
│   ├── my-jobs/               # Portal mobile teknisi lapangan
│   │   └── [id]/              # Detail pekerjaan & form laporan servis lapangan
│   ├── reports/               # Laporan pendapatan, biaya part, dan audit log
│   ├── schedule/              # Papan timeline penugasan jadwal teknisi
│   ├── work-orders/           # Daftar pekerjaan operasional & filter status
│   │   ├── [id]/              # Detail tracker 6 tahap, dispatch, review & pembayaran
│   │   └── new/               # Formulir registrasi work order baru
│   ├── globals.css            # Token desain, warna status, dan utilitas tabular
│   ├── layout.tsx             # Root layout responsif
│   └── page.tsx               # Redirect utama ke Dashboard
├── components/
│   ├── layout/                # AppShell, Sidebar, Topbar, MobileNav, RoleContext
│   └── ui/                    # StatusBadge, PriorityBadge, CapacityChip, PageHeader
├── lib/
│   ├── services/              # WorkOrderService (State machine, audit, data logic)
│   ├── supabase/              # Client, server, dan middleware Supabase SSR
│   ├── validations/           # Skema validasi Zod
│   └── utils.ts               # Format Rupiah, format PK (0.5 PK, 1 PK), dan tanggal ID
├── supabase/
│   ├── migrations/            # Migration SQL lengkap dengan tabel, relasi, & RLS
│   └── seed.sql               # Seed data realistis untuk pengujian
├── tests/
│   └── work-order-workflow.test.ts  # Otomasi pengujian alur bisnis dengan Vitest
├── types/
│   └── database.ts            # Definisi TypeScript untuk seluruh entitas database
├── .env.example               # Template environment variable
└── README.md
```

---

## 🚀 6. Cara Menjalankan Proyek

### Prasyarat:
* Node.js v20.x atau v22.x
* npm (atau pnpm / yarn)

### Langkah Instalasi:

1. **Clone repository dan masuk ke direktori:**
   ```bash
   git clone https://github.com/muhkelvin/Jasa-AC.git
   cd Jasa-AC
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable:**
   Salin file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Opsional: Jika belum menghubungkan database Supabase eksternal, aplikasi akan otomatis menggunakan seed data in-memory yang sudah terintegrasi penuh untuk keperluan demo/pengujian).*

4. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Akses aplikasi di browser melalui: **[http://localhost:3000](http://localhost:3000)**

5. **Jalankan Pengujian Otomatis (Unit Tests):**
   ```bash
   npm test
   ```

6. **Build Produksi:**
   ```bash
   npm run build
   ```

---

## 🧪 7. Akun Uji Coba Simulasi (Demo Credentials)

Untuk memudahkan peninjauan fitur dari berbagai perspektif, Anda dapat mengganti peran melalui pemilih akun di **Topbar** atau login via halaman `/login`:

| Nama Pengguna | Role | Email Demo | Akses Khusus |
| --- | --- | --- | --- |
| **Budi Santoso** | `owner` | `budi.owner@acservice.id` | Kontrol penuh bisnis, omzet, kelola hak akses |
| **Siti Rahma** | `admin` | `siti.admin@acservice.id` | Dispatch order, jadwal teknisi, review laporan, rekam bayar |
| **Doni Pratama** | `technician` | `doni.tek@acservice.id` | Tugas lapangan, mulai kerja, kirim laporan servis (Job Doni) |
| **Agus Kurniawan** | `technician` | `agus.tek@acservice.id` | Tugas lapangan, laporan modul PCB, request sparepart (Job Agus) |

---

## 🎨 8. Prinsip Desain UI/UX

Aplikasi ini didesain sebagai **alat kerja operasional yang fungsional (*utility-first*)**, bukan sekadar template admin dekoratif:
- **Kepadatan Informasi Optimal:** Baris tabel dibuat kompak (~40px) agar admin dapat memindai puluhan pekerjaan dengan cepat tanpa scrolling berlebih.
- **Indikator Titik Status:** Menggunakan titik berwarna + teks status yang bersih, bukan pill warna-warni yang mencolok.
- **Mobile Touch Targets:** Di antarmuka teknisi, tombol utama memiliki tinggi minimum 48px dengan kontras tinggi agar nyaman digunakan di lapangan/luar ruangan.
- **Tautan Cepat Lapangan:** Alamat pelanggan dapat langsung dibuka di Google Maps dengan 1 ketukan, dan nomor telepon langsung membuka dialer panggilan.

---

## 📄 Lisensi & Hak Cipta

Dikembangkan sebagai bagian dari **Portfolio Operasional Bisnis Internal**. Hak cipta dilindungi.
