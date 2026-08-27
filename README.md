
# KasKu (Kas Hei)

Aplikasi pencatatan kas kantor — iuran bulanan, transaksi kas, dashboard saldo, dan laporan.
Lihat `PRD-KasKantor.md` untuk detail requirement lengkap.

## Tech Stack
- Next.js 14 (App Router)
- Supabase (Auth + Postgres + Storage)
- Tailwind CSS
- Recharts

## Setup
1. Copy `.env.local.example` ke `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. `npm install`
3. `npm run dev`

## Struktur
- `src/app/` — routes (App Router)
- `src/lib/supabase/` — client & server Supabase helper
- `src/middleware.js` — proteksi auth per route

## Autentikasi (menyimpang dari PRD, keputusan sadar)
Login **tidak** memakai email/password standar seperti draf awal PRD, melainkan
**Nama Lengkap + Nomor ID Card** sebagai kredensial. Ini keputusan yang disengaja
untuk memudahkan ~25 anggota tanpa perlu ingat email/password terpisah.

## Status

**Fase 1 (MVP)**
- [x] Scaffold project
- [x] Auth & role setup (login pakai Nama + Nomor ID Card)
- [x] Manajemen anggota (CRUD)
- [x] Input transaksi (toggle pemasukan/pengeluaran, kategori, riwayat + filter)
- [x] Dashboard saldo (real-time dari data transaksi)
- [x] Tracking iuran (manual-check per anggota per periode)
- [ ] Audit log dasar (tabel `audit_logs` sudah ada, belum ada trigger/write logic aktif)

**Fase 2**
- [x] Generate tagihan iuran otomatis (Vercel Cron, tanggal 25 tiap bulan)
- [ ] Tutup buku bulanan (tabel `monthly_closings` sudah ada, halaman/logic belum dibuat)
- [ ] Export laporan PDF/CSV/Excel
- [ ] Halaman settings kategori custom (tabel `categories` sudah ada & terisi default)

**Fase 3**
- [ ] Reminder email otomatis (Vercel Cron + Resend)
- [ ] Upload bukti struk
- [ ] PWA install (manifest + service worker)
- [ ] Role approval

## Deployment
- Production: https://kas-hei.vercel.app
- Repo terhubung ke Vercel via GitHub (`darmawanaldin12/Kas_hei`, branch `main`)
