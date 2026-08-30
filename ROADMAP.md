# Roadmap — KasKu (Kas Hei)

Roadmap detail berdasarkan `PRD-KasKantor.md`. Status per 30 Agustus 2026 diambil dari kondisi repo (`darmawanaldin12/Kas_hei`) dan project Supabase aktif.

Legenda: ✅ Selesai · 🟡 Sebagian/tabel ada tapi logic belum · ⬜ Belum dimulai

---

## Fase 1 — MVP Dasar

| # | Item | Status | Detail |
|---|---|---|---|
| 1.1 | Scaffold project (Next.js 14 App Router, Supabase client) | ✅ | |
| 1.2 | Auth & role setup | ✅ | Login pakai Nama Lengkap + Nomor ID Card (keputusan sadar, lihat PRD §4.6 & §10), bukan email/password |
| 1.3 | Manajemen anggota (CRUD) | ✅ | `src/app/anggota/`, `anggota/baru`, `anggota/[id]`, `api/members` |
| 1.4 | Input transaksi (toggle in/out, kategori, riwayat + filter) | ✅ | `src/app/transaksi/TransaksiClient.js` |
| 1.5 | Dashboard saldo real-time | ✅ | `src/app/dashboard/page.js` |
| 1.6 | Tracking iuran manual-check per anggota per periode | ✅ | `src/app/iuran/page.js` + `IuranMemberList.js` (optimistic update) |
| 1.7 | Audit log dasar | ✅ | Trigger `fn_audit_log()` di `transactions` & `dues_payments`, halaman `/audit-log` (admin only) |

Fase 1 **selesai 100%**.

---

## Fase 2 — Operasional Bulanan

| # | Item | Status | Detail |
|---|---|---|---|
| 2.1 | Generate tagihan iuran otomatis tiap bulan | ✅ | `api/cron/generate-iuran`, Vercel Cron tanggal 25 tiap bulan |
| 2.2 | Tutup buku bulanan | ✅ | `src/app/tutup-buku/`, RPC `close_month()`/`reopen_month()`, checklist rekonsiliasi, riwayat 12 bulan terakhir |
| 2.3 | Export laporan PDF | ⬜ | Belum ada — tapi `/laporan/tahunan` (view grid Nama×Bulan) sudah jadi, tinggal ditambah export |
| 2.4 | Export CSV/Excel | ⬜ | Belum ada |
| 2.5 | Halaman settings kategori custom (tambah/edit/nonaktifkan) | ⬜ | Tabel `categories` sudah terisi 7 kategori default, tapi belum ada UI admin untuk kelola |

**Detail teknis per item:**
- **2.2 Tutup Buku Bulanan — ✅ Selesai**
  - [x] Migrasi kolom `monthly_closings` sudah sesuai PRD §6 (sudah ada sejak awal, hanya belum dipakai)
  - [x] Ternyata skema `transactions` **sudah punya kolom `closing_id`** (FK ke `monthly_closings`) + RLS yang mengacu ke situ sejak awal — jadi mekanisme lock dibangun di atas itu, bukan trigger date-range terpisah (dicoba duluan, lalu di-drop supaya tidak dobel)
  - [x] RPC `close_month(month, year)`: hitung saldo kumulatif s.d. akhir bulan, snapshot ke `monthly_closings`, isi `closing_id` di semua transaksi bulan itu (admin only)
  - [x] RPC `reopen_month(month, year)`: set `is_locked=false`, lepas `closing_id` dari transaksi terkait (admin only)
  - [x] RLS existing (`transactions_update`/`delete`) otomatis memblokir **pengurus** mengedit transaksi yang `closing_id` terisi; **admin** tetap bisa override langsung (desain sudah ada di RLS asli — beda dari draf awal yang mengunci semua role, tapi konsisten dengan constraint yang sudah dirancang di skema sejak awal)
  - [x] Halaman `/tutup-buku` (admin only): preview saldo sebelum tutup, checklist rekonsiliasi (anggota belum/pending), konfirmasi wajib centang sebelum tombol aktif, tombol buka kunci ulang, riwayat 12 bulan
  - [x] Diuji end-to-end di database (rollback, data aman): close → transaksi ter-lock → reopen → transaksi ter-lepas lagi ✅

**Catatan Fase 2.2:** field/RLS untuk fitur ini ternyata sudah disiapkan sejak migrasi awal proyek (kolom `closing_id`, `monthly_closings`), tapi belum pernah "disambungkan" ke RPC atau UI. Pekerjaan kali ini melengkapi bagian yang hilang, bukan membangun dari nol.

- **2.3 Export PDF**
  - [ ] Endpoint/halaman print-friendly laporan bulanan (rekap pemasukan, pengeluaran, saldo akhir)
  - [ ] Styling khusus print (`@media print`) atau generate PDF server-side
  - [x] Sudah ada pondasi: `/laporan/tahunan` menampilkan grid Nama×Bulan + total masuk/keluar/saldo (belum ada tombol export)
- **2.4 Export CSV/Excel**
  - [ ] Endpoint export transaksi per periode → CSV
  - [ ] Endpoint export rekap iuran per anggota → CSV/Excel
- **2.5 Settings Kategori**
  - [ ] Halaman `src/app/settings/kategori` — list, tambah, edit, toggle `is_active`
  - [ ] Validasi: kategori yang sudah dipakai di transaksi existing tidak bisa dihapus, hanya dinonaktifkan

---

## Fase 3 — Otomasi & Kenyamanan Akses

| # | Item | Status | Detail |
|---|---|---|---|
| 3.1 | Reminder email otomatis (belum bayar) | ⬜ | Folder `api/cron` baru ada `generate-iuran`, belum ada cron reminder |
| 3.2 | Upload bukti struk (opsional, pengeluaran) | ⬜ | Belum terlihat integrasi Supabase Storage untuk struk |
| 3.3 | PWA install (manifest + service worker) | ⬜ | Belum ada `manifest.json`/service worker |
| 3.4 | Role approval (undang anggota via link/kode) | ⬜ | Saat ini anggota kemungkinan diinput manual oleh admin saja |

**Detail teknis per item:**
- **3.1 Reminder Email**
  - [ ] Setup Resend (atau SMTP) API key di env
  - [ ] `api/cron/reminder-iuran` — jalan tanggal 20, query anggota `belum` periode berjalan, kirim email
  - [ ] Template email singkat: nominal, cara bayar, link langsung ke form klaim (sudah tersedia di `/iuran`, lihat Fase 4)
  - [ ] **Notifikasi konfirmasi verifikasi** (PRD §4.9): kirim email begitu klaim anggota dikonfirmasi/ditolak — belum diimplementasikan, menunggu setup Resend
- **3.2 Upload Bukti Struk**
  - [ ] Bucket Supabase Storage untuk struk pengeluaran (terpisah dari bucket `bukti-iuran` yang sudah dibuat di Fase 4)
  - [ ] Field upload opsional di form transaksi pengeluaran
- **3.3 PWA**
  - [ ] `public/manifest.json` + icon set
  - [ ] Service worker dasar (cache shell, offline fallback)
  - [ ] Meta tag `<link rel="manifest">` di layout
- **3.4 Role Approval / Undang Anggota**
  - [ ] Generate link/kode undangan per anggota
  - [ ] Halaman pendaftaran mandiri via link (anggota isi data sendiri, admin approve)

---

## Fase 4 — Klaim & Verifikasi Pembayaran Iuran (PRD §4.12)

Menutup celah nyata yang sudah terjadi (anggota bayar, tidak tercatat).

| # | Item | Status | Detail |
|---|---|---|---|
| 4.1 | Migrasi tabel `dues_payments` — tambah kolom klaim | ✅ | Enum `pending_verifikasi` + kolom `claimed_at/amount/date`, `proof_url`, `verified_by/at`, `rejection_reason` |
| 4.2 | Halaman anggota: tombol "Saya sudah bayar" + form klaim | ✅ | `src/app/iuran/KlaimIuranCard.js` — upload bukti wajib, terintegrasi di `/iuran` |
| 4.3 | Storage bucket bukti klaim (wajib upload) | ✅ | Bucket privat `bukti-iuran`, RLS: anggota hanya upload ke folder sendiri, admin/pengurus bisa baca semua |
| 4.4 | Halaman bendahara: daftar klaim pending + verifikasi | ✅ | `src/app/iuran/verifikasi/page.js` + `VerifikasiClient.js` |
| 4.5 | Aksi Konfirmasi → auto-create entri `transactions` | ✅ | RPC `verify_dues_payment()` — sudah dites end-to-end |
| 4.6 | Aksi Tolak → kembali `belum` + alasan | ✅ | RPC `reject_dues_payment()` — sudah dites end-to-end |
| 4.7 | Notifikasi ke anggota (klaim diverifikasi/ditolak) | ⬜ | **Ditunda** — butuh setup Resend/email API dulu (Fase 3.1). Anggota untuk saat ini melihat status lewat halaman `/iuran` |
| 4.8 | Warning duplikat saat input manual bendahara | ✅ | `TransaksiClient.js` — cek klaim pending sebelum submit transaksi manual kategori Iuran |
| 4.9 | Update dashboard: hitung status `pending_verifikasi` | ✅ | Kartu ringkasan Lunas/Pending/Belum di `/dashboard` (admin & pengurus) |
| 4.10 | Audit log untuk aksi klaim/verifikasi/tolak | ✅ | Otomatis tercatat lewat trigger `fn_audit_log()` yang sudah dipasang di Fase 1.7 |

**Fase 4 selesai 9 dari 10 item.** Sisa: 4.7 notifikasi email, menunggu Resend disiapkan di Fase 3.1.

---

## Ekstra di luar roadmap awal

- **Laporan Tahunan** (`/laporan/tahunan`, admin/pengurus): grid Nama×Bulan mirip spreadsheet lama, total masuk/keluar/saldo per tahun, navigasi antar tahun. Pondasi untuk 2.3/2.4.
- **Data dummy/trial** (22 anggota, ID Card `900001`–`900022`, akun login lengkap, data iuran & transaksi 2026): dipakai untuk uji alur klaim/verifikasi/tutup buku secara realistis. **Wajib dihapus sebelum go-live** — semua ditandai `email = 'dummy-test@kasku.local'` di tabel `members` untuk memudahkan cleanup satu perintah.

---

## Ringkasan Prioritas Selanjutnya (rekomendasi urutan kerja)

1. ~~**Fase 4** (klaim & verifikasi iuran)~~ — ✅ selesai (9/10, sisa notifikasi email)
2. ~~**Audit log dasar** (Fase 1.7)~~ — ✅ selesai
3. ~~**Tutup buku bulanan** (Fase 2.2)~~ — ✅ selesai
4. **Reminder email + notifikasi verifikasi** (Fase 3.1 + 4.7) — sekalian setup Resend, dua kebutuhan notifikasi ini bisa dikerjakan bareng
5. **Export laporan PDF/CSV** (Fase 2.3–2.4) — tinggal nambah tombol export di atas `/laporan/tahunan` yang sudah ada
6. **Sisanya**: settings kategori (2.5), upload struk (3.2), PWA (3.3), role approval (3.4)
7. **Sebelum go-live**: hapus data dummy trial (lihat bagian "Ekstra" di atas)

---

*Dokumen ini dibuat berdasarkan `PRD-KasKantor.md` dan kondisi repo per 30 Agustus 2026. Update checklist di sini setiap kali sebuah item selesai dikerjakan.*
