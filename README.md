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

## Status
Fase 1 (MVP) sedang dikerjakan sesuai roadmap di PRD:
- [x] Scaffold project
- [x] Auth & role setup (login pakai Nama + Nomor ID Card)
- [x] Manajemen anggota
- [ ] Input transaksi
- [ ] Dashboard saldo
- [ ] Tracking iuran (manual-check)
- [ ] Audit log dasar
