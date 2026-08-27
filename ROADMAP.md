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
| 1.7 | Audit log dasar | 🟡 | Tabel `audit_logs` sudah ada di DB (RLS aktif) tapi **0 rows** — belum ada trigger/write logic yang aktif menulis ke tabel ini |

**Sisa kerja Fase 1:**
- [ ] Buat trigger/fungsi Postgres (atau logic di API route) yang menulis ke `audit_logs` setiap create/update/delete di tabel `transactions` dan `dues_payments`
- [ ] Halaman admin untuk browse/filter audit log (siapa, apa, kapan, before/after)

---

## Fase 2 — Operasional Bulanan

| # | Item | Status | Detail |
|---|---|---|---|
| 2.1 | Generate tagihan iuran otomatis tiap bulan | ✅ | `api/cron/generate-iuran`, Vercel Cron tanggal 25 tiap bulan — **sudah lebih maju dari urutan roadmap awal** |
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
  - [ ] **Checklist rekonsiliasi sebelum tutup buku** (PRD §4.8 & §4.12): tampilkan daftar anggota `belum_bayar`/`pending_verifikasi` sebelum admin bisa konfirmasi tutup buku
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
  - [ ] `api/cron/reminder-iuran` — jalan tanggal 20, query anggota `belum_bayar` periode berjalan, kirim email
  - [ ] Template email singkat: nominal, cara bayar, link langsung ke form klaim (PRD §4.12)
- **3.2 Upload Bukti Struk**
  - [ ] Bucket Supabase Storage untuk struk pengeluaran (terpisah dari bucket bukti klaim iuran §4.12)
  - [ ] Field upload opsional di form transaksi pengeluaran
- **3.3 PWA**
  - [ ] `public/manifest.json` + icon set
  - [ ] Service worker dasar (cache shell, offline fallback)
  - [ ] Meta tag `<link rel="manifest">` di layout
- **3.4 Role Approval / Undang Anggota**
  - [ ] Generate link/kode undangan per anggota
  - [ ] Halaman pendaftaran mandiri via link (anggota isi data sendiri, admin approve)

---

## Fase 4 — Klaim & Verifikasi Pembayaran Iuran (BARU, PRD §4.12)

Prioritas tinggi — menutup celah nyata yang sudah terjadi (anggota bayar, tidak tercatat).

| # | Item | Status |
|---|---|---|
| 4.1 | Migrasi tabel `dues_payments` — tambah kolom klaim | ⬜ |
| 4.2 | Halaman anggota: tombol "Saya sudah bayar" + form klaim | ⬜ |
| 4.3 | Storage bucket bukti klaim (wajib upload) | ⬜ |
| 4.4 | Halaman bendahara: daftar klaim pending + verifikasi | ⬜ |
| 4.5 | Aksi Konfirmasi → auto-create entri `transactions` | ⬜ |
| 4.6 | Aksi Tolak → kembali `belum_bayar` + alasan | ⬜ |
| 4.7 | Notifikasi ke anggota (klaim diverifikasi/ditolak) | ⬜ |
| 4.8 | Warning duplikat saat input manual bendahara | ⬜ |
| 4.9 | Update dashboard: hitung status `pending_verifikasi` | ⬜ |
| 4.10 | Audit log untuk aksi klaim/verifikasi/tolak | ⬜ |

**Detail teknis:**
- **4.1 Migrasi DB**
  - [ ] `ALTER TABLE dues_payments`: tambah `claimed_at`, `claimed_amount`, `claimed_date`, `proof_url`, `verified_by`, `verified_at`, `rejection_reason`
  - [ ] Update `status` enum: `belum_bayar` / `pending_verifikasi` / `lunas`
  - [ ] RLS: anggota hanya bisa update baris `dues_payments` miliknya sendiri (`member_id` match), dan hanya kolom klaim — tidak bisa langsung set `status = lunas`
- **4.2 Form Klaim (sisi anggota)**
  - [ ] Halaman iuran pribadi anggota: tombol "Saya sudah bayar" muncul di periode `belum_bayar`
  - [ ] Form wajib: tanggal bayar, nominal, upload bukti (foto/screenshot transfer)
  - [ ] Submit → `status = pending_verifikasi`
- **4.3 Storage**
  - [ ] Bucket baru `bukti-iuran` (terpisah dari bucket struk pengeluaran)
  - [ ] Policy: anggota hanya bisa upload ke folder miliknya sendiri
- **4.4 Halaman Verifikasi (sisi bendahara)**
  - [ ] List klaim `pending_verifikasi`: nama anggota, nominal & tanggal klaim, foto bukti, kolom catatan verifikasi
  - [ ] Sort/filter by periode
- **4.5–4.6 Aksi Konfirmasi/Tolak**
  - [ ] Konfirmasi: `status → lunas`, `verified_by`, `verified_at` terisi, otomatis insert ke `transactions` (kategori Iuran, `member_id` terkait)
  - [ ] Tolak: `status → belum_bayar`, simpan `rejection_reason`, kolom klaim di-reset supaya anggota bisa klaim ulang
- **4.7 Notifikasi**
  - [ ] Email (dan WA jika tersedia) ke anggota begitu status berubah lunas/ditolak
- **4.8 Warning Duplikat**
  - [ ] Saat bendahara input transaksi manual kategori "Iuran" untuk anggota tertentu, cek dulu apakah ada `dues_payments` dengan status `pending_verifikasi` di periode yang sama → tampilkan warning sebelum submit
- **4.9 Dashboard**
  - [ ] Ringkasan iuran: "X lunas, Y pending verifikasi, Z belum bayar dari 25 anggota"
- **4.10 Audit Log**
  - [ ] Catat setiap transisi status di `dues_payments` (siapa klaim, siapa verifikasi/tolak, kapan) ke `audit_logs`

---

## Ringkasan Prioritas Selanjutnya (rekomendasi urutan kerja)

1. **Fase 4 dulu** (klaim & verifikasi iuran) — ini langsung menutup masalah nyata yang sudah terjadi, dampaknya paling terasa untuk bendahara & anggota
2. **Audit log dasar** (sisa Fase 1) — supaya Fase 4 langsung punya jejak audit sejak awal, bukan ditambah belakangan
3. **Tutup buku bulanan** (Fase 2) — supaya checklist rekonsiliasi di §4.8 bisa langsung memanfaatkan status `pending_verifikasi` dari Fase 4
4. **Export laporan PDF/CSV** (Fase 2) — kebutuhan administratif, tidak urgent tapi bernilai untuk transparansi ke anggota
5. **Reminder email & sisanya** (Fase 3) — pelengkap, bisa menyusul setelah alur inti pencatatan solid

---

*Dokumen ini dibuat berdasarkan `PRD-KasKantor.md` dan kondisi repo per 27 Agustus 2026. Update checklist di sini setiap kali sebuah item selesai dikerjakan.*
