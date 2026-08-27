# Roadmap — KasKu (Kas Hei)

Roadmap detail berdasarkan `PRD-KasKantor.md`. Status per 27 Agustus 2026 diambil dari kondisi repo (`darmawanaldin12/Kas_hei`) dan project Supabase aktif.

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
| 1.6 | Tracking iuran manual-check per anggota per periode | ✅ | `src/app/iuran/page.js` |
| 1.7 | Audit log dasar | ✅ | Trigger `fn_audit_log()` di `transactions` & `dues_payments`, halaman `/audit-log` (admin only) |

Fase 1 **selesai 100%**.

---

## Fase 2 — Operasional Bulanan

| # | Item | Status | Detail |
|---|---|---|---|
| 2.1 | Generate tagihan iuran otomatis tiap bulan | ✅ | `api/cron/generate-iuran`, Vercel Cron tanggal 25 tiap bulan |
| 2.2 | Tutup buku bulanan | ⬜ | Tabel `monthly_closings` sudah ada (0 rows), belum ada halaman/logic |
| 2.3 | Export laporan PDF | ⬜ | Belum ada folder `laporan`/`export` |
| 2.4 | Export CSV/Excel | ⬜ | Belum ada |
| 2.5 | Halaman settings kategori custom (tambah/edit/nonaktifkan) | ⬜ | Tabel `categories` sudah terisi 7 kategori default, tapi belum ada UI admin untuk kelola |

**Detail teknis per item:**
- **2.2 Tutup Buku Bulanan**
  - [ ] Migrasi: pastikan kolom `monthly_closings` (month, year, closing_balance, closed_by, closed_at, is_locked) sesuai PRD §6
  - [ ] API route: hitung saldo akhir bulan dari `transactions`, snapshot ke `monthly_closings`, set `is_locked = true`
  - [ ] Guard di API transaksi: tolak create/update/delete jika `date` transaksi berada di bulan yang `is_locked`
  - [ ] Halaman admin "Tutup Buku" + tombol buka kunci ulang (khusus admin)
  - [ ] **Checklist rekonsiliasi sebelum tutup buku** (PRD §4.8 & §4.12): tampilkan daftar anggota `belum`/`pending_verifikasi` sebelum admin bisa konfirmasi tutup buku — sekarang datanya sudah tersedia lewat kerja Fase 4
- **2.3 Export PDF**
  - [ ] Endpoint/halaman print-friendly laporan bulanan (rekap pemasukan, pengeluaran, saldo akhir)
  - [ ] Styling khusus print (`@media print`) atau generate PDF server-side
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
| 4.10 | Audit log untuk aksi klaim/verifikasi/tolak | ✅ | Otomatis tercatat lewat trigger `fn_audit_log()` yang sudah dipasang di Fase 1.7 — `actor_id` terisi benar meski RPC berjalan sebagai `SECURITY DEFINER` |

**Fase 4 selesai 9 dari 10 item.** Sisa: 4.7 notifikasi email, menunggu Resend disiapkan di Fase 3.1.

**Catatan implementasi & pengujian:**
- Semua RPC (`claim_dues_payment`, `verify_dues_payment`, `reject_dues_payment`) memakai `SECURITY DEFINER` dengan validasi kepemilikan/role internal, sehingga anggota tidak butuh akses UPDATE langsung ke `dues_payments`.
- Diuji langsung di database (dalam transaksi yang di-rollback, tidak mengubah data asli):
  - Klaim → Verifikasi → status `lunas` + entri `transactions` otomatis terbuat ✅
  - Klaim → Tolak → status kembali `belum`, `rejection_reason` tersimpan, `proof_url` direset ✅
  - Anggota mencoba klaim iuran milik anggota lain → **ditolak sistem** dengan pesan error yang jelas ✅

---

## Ringkasan Prioritas Selanjutnya (rekomendasi urutan kerja)

1. ~~**Fase 4** (klaim & verifikasi iuran)~~ — ✅ selesai (9/10, sisa notifikasi email)
2. ~~**Audit log dasar** (Fase 1.7)~~ — ✅ selesai
3. **Tutup buku bulanan** (Fase 2.2) — sekarang bisa langsung memanfaatkan status `pending_verifikasi` dari Fase 4 untuk checklist rekonsiliasi
4. **Reminder email + notifikasi verifikasi** (Fase 3.1 + 4.7) — sekalian setup Resend, dua kebutuhan notifikasi ini bisa dikerjakan bareng
5. **Export laporan PDF/CSV** (Fase 2.3–2.4)
6. **Sisanya**: settings kategori (2.5), upload struk (3.2), PWA (3.3), role approval (3.4)

---

*Dokumen ini dibuat berdasarkan `PRD-KasKantor.md` dan kondisi repo per 27 Agustus 2026. Update checklist di sini setiap kali sebuah item selesai dikerjakan.*
