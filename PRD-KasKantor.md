# PRD — Aplikasi Kas Kantor (Working title: "KasKu")

## 1. Latar Belakang
Saat ini pencatatan kas kantor (iuran bulanan Rp20.000 x ~25 karyawan) kemungkinan masih manual/tersebar sehingga sulit dipantau. Dibutuhkan aplikasi web sederhana yang rapi dan terstruktur untuk mencatat pemasukan (iuran, sumbangan, dll) dan pengeluaran kas, dengan beberapa pengurus yang bisa input dan anggota yang bisa memantau saldo.

**Update pasca-MVP**: sudah terjadi kasus nyata di mana anggota sudah membayar tunggakan kas namun pembayarannya tidak tercatat oleh bendahara (human error saat input manual). §4.12 di bawah adalah fitur yang dirancang khusus untuk menutup celah ini.

## 2. Tujuan
- Mencatat transaksi kas (masuk/keluar) secara terpusat dan real-time
- Melacak status pembayaran iuran bulanan per karyawan (lunas/belum per periode)
- Transparansi saldo kas ke seluruh anggota
- Menghasilkan laporan bulanan tanpa rekap manual
- **Menutup celah pembayaran tidak tercatat** dengan mekanisme konfirmasi dua arah (anggota lapor, bendahara verifikasi)

## 3. Target Pengguna & Role
| Role | Hak Akses |
|---|---|
| **Admin/Bendahara** | Full akses: input transaksi, kelola anggota, kelola periode iuran, edit/hapus data, export laporan, verifikasi klaim pembayaran anggota |
| **Pengurus** | Input transaksi (pemasukan/pengeluaran), lihat laporan |
| **Anggota/Karyawan** | Login individual (wajib punya akun): read-only untuk transaksi umum — lihat saldo kas, riwayat transaksi umum, status iuran pribadi, **dan bisa mengajukan klaim "sudah bayar" untuk iurannya sendiri** |

Skala: ~25 anggota, beberapa pengurus (perkiraan 2–4 akun admin/pengurus).

## 4. Fitur Utama (Scope MVP)

### 4.1 Manajemen Anggota
- CRUD data anggota (nama, no. HP/email opsional, status aktif/nonaktif, tanggal join)
- Undang anggota via link/kode, atau input manual oleh admin
- Anggota yang keluar/resign **tidak dihapus**, cukup diubah statusnya jadi nonaktif — data histori transaksi & iuran tetap tersimpan utuh
- Anggota nonaktif otomatis tidak masuk ke generate tagihan iuran bulan berjalan

### 4.2 Iuran Bulanan (Kas Wajib)
- Nominal default Rp20.000/bulan (bisa diubah di setting)
- Generate tagihan otomatis tiap awal bulan untuk semua anggota aktif
- Tandai lunas/belum per anggota per bulan (checklist cepat oleh pengurus)
- Riwayat pembayaran per anggota
- Status pembayaran sekarang punya 3 kemungkinan (lihat §4.12): `belum_bayar`, `pending_verifikasi`, `lunas`

### 4.3 Pencatatan Transaksi Kas
Konsep input mengikuti pola Arvifund (`app/input/page.js`) untuk konsistensi UX:
- Satu halaman input dengan **toggle jenis transaksi** (Pemasukan / Pengeluaran) sebagai kontrol utama di atas
- Form menyesuaikan field berdasarkan jenis yang dipilih (dynamic form, bukan halaman terpisah per jenis)
- Field umum: tanggal (default hari ini), kategori (dropdown/quick-pick chip), nominal, keterangan, input by (otomatis dari user login)
- Kategori pemasukan & pengeluaran bersifat **custom** — admin bisa tambah/edit/nonaktifkan kategori sendiri lewat halaman settings, dengan set default: Iuran, Sumbangan, Lain-lain (pemasukan) dan Konsumsi, Kegiatan/Acara, Operasional, Lain-lain (pengeluaran) sebagai starting point
- Desain mobile-first, warna konsisten dengan sistem warna existing (accent color), tanpa perlu skema warna baru
- Setelah submit, langsung update saldo & muncul di riwayat transaksi (optimistic update seperti Arvifund)
- Bukti struk (upload foto) sifatnya opsional, disimpan di Supabase Storage — bukan fitur wajib MVP
- Riwayat transaksi dengan filter (tanggal, kategori, jenis)
- **Warning duplikat**: saat bendahara/pengurus input transaksi kategori "Iuran" untuk anggota yang punya klaim `pending_verifikasi` pada periode yang sama, sistem menampilkan peringatan sebelum submit untuk mencegah pencatatan ganda (lihat §4.12)

### 4.4 Dashboard & Saldo
- Saldo kas real-time
- Grafik pemasukan vs pengeluaran per bulan (Recharts, konsisten dgn Arvifund)
- Ringkasan status iuran bulan berjalan (X dari 25 sudah bayar, Y pending verifikasi)

### 4.5 Laporan
- Laporan bulanan (rekap pemasukan, pengeluaran, saldo akhir)
- Export PDF/print-friendly view untuk dibagikan ke anggota

### 4.6 Autentikasi & Keamanan
- Login memakai **Nama Lengkap + Nomor ID Card** sebagai kredensial (bukan email/password) — **keputusan sadar** agar ~25 anggota tidak perlu mengingat email/password terpisah. Lihat §10.
- RLS per role: anggota hanya lihat data umum + kelola klaim pembayarannya sendiri, pengurus/admin bisa input & verifikasi

### 4.7 Audit Log
- Setiap create/edit/hapus transaksi dan perubahan data iuran tercatat: siapa (user), apa perubahannya (before/after), kapan
- Termasuk perubahan status klaim pembayaran (§4.12): siapa yang klaim, siapa yang verifikasi/tolak, kapan
- Log bisa dilihat admin untuk investigasi jika ada selisih/dispute saldo
- Tabel terpisah (`audit_logs`), tidak menghapus data lama walau transaksi asli sudah diedit/dihapus

### 4.8 Tutup Buku Bulanan
- Admin bisa "tutup buku" di akhir bulan: snapshot saldo akhir bulan tersimpan permanen
- Bulan yang sudah ditutup buku tetap bisa dilihat tapi transaksinya locked (tidak bisa diedit/hapus tanpa buka kunci ulang oleh admin)
- Laporan bulan-bulan lama jadi konsisten, tidak berubah walau ada koreksi data di kemudian hari
- **Sebelum tutup buku, sistem menampilkan checklist rekonsiliasi**: daftar anggota yang masih `belum_bayar` atau `pending_verifikasi` untuk periode berjalan, sebagai jaring pengaman terakhir sebelum data dikunci (lihat §4.12)

### 4.9 Reminder Email Iuran
- Kirim email otomatis ke anggota yang belum bayar iuran bulan berjalan — dijalankan langsung dari aplikasi (Vercel Cron Job) memanggil email API (misal Resend/SMTP), **tanpa n8n**
- Trigger terjadwal, misalnya tanggal 20 tiap bulan, ke anggota yang statusnya masih `belum_bayar`
- **Notifikasi konfirmasi**: begitu bendahara memverifikasi klaim pembayaran anggota jadi `lunas`, anggota menerima notifikasi (email, dan WhatsApp jika §4.12 fase WA sudah aktif) — supaya anggota tahu pembayarannya sudah benar-benar tercatat, dan bisa langsung komplain kalau ternyata belum

### 4.10 Export Data
- Export laporan ke CSV/Excel (selain PDF) untuk kebutuhan rekap tahunan atau audit internal
- Cakupan export: transaksi per periode, rekap iuran per anggota

### 4.11 PWA (Installable)
- Aplikasi bisa di-"install" ke home screen HP (manifest + service worker), konsisten dengan pendekatan Arvifund sebagai web app
- Mempercepat akses pengurus untuk input transaksi tanpa buka browser dulu

### 4.12 Klaim & Verifikasi Pembayaran Iuran (BARU — menutup celah pencatatan manual)

**Latar masalah**: pembayaran tunai/transfer anggota dicatat belakangan oleh bendahara secara manual, sehingga rawan lupa/kelewat. Kasus nyata: anggota sudah bayar tunggakan tapi statusnya tetap "belum lunas" di catatan bendahara.

**Alur:**
1. Anggota membuka halaman iuran pribadinya, dan untuk periode yang masih `belum_bayar`, tersedia tombol **"Saya sudah bayar"**.
2. Form klaim mewajibkan: tanggal bayar, nominal, **dan upload bukti transfer/foto (wajib, bukan opsional)** — beda dari bukti struk pengeluaran di §4.3 yang tetap opsional.
3. Status iuran anggota berubah jadi `pending_verifikasi` — **belum otomatis "lunas"**.
4. Bendahara/pengurus mendapat notifikasi ada klaim baru, dan melihat daftar klaim pending di satu halaman: nominal & tanggal yang diklaim, foto bukti, berdampingan dengan kolom catatan verifikasi.
5. Bendahara mencocokkan ke rekening/kas fisik, lalu **Konfirmasi** (status jadi `lunas`, otomatis membuat entri di `transactions` kategori Iuran) atau **Tolak** (kembali ke `belum_bayar`, dengan alasan penolakan yang tersimpan).
6. Anggota mendapat notifikasi begitu klaimnya diverifikasi atau ditolak.

**Mitigasi celah yang sudah diidentifikasi:**
- **Klaim palsu tanpa bukti** → bukti transfer/foto wajib diisi saat klaim, bukan opsional.
- **Rubber-stamping (bendahara approve tanpa cek)** → UI verifikasi menampilkan nominal & tanggal klaim berdampingan dengan input catatan verifikasi, memaksa sedikit friksi sebelum konfirmasi.
- **Anggota lupa/tidak tahu harus klaim** → dipasangkan dengan reminder otomatis §4.9; reminder mengarahkan langsung ke form klaim.
- **Double-entry (klaim + input manual bendahara untuk transaksi yang sama)** → warning duplikat saat input transaksi manual untuk anggota yang punya klaim pending pada periode sama (§4.3).
- **Verifikasi palsu tanpa cek rekening independen** → di luar kapasitas software; ditangani lewat SOP internal bendahara (cek mutasi rekening berkala), dicatat sebagai catatan proses, bukan fitur.

**Scope non-fitur (tetap manual/SOP):**
- App tidak terhubung langsung ke API bank untuk auto-match mutasi — di luar scope MVP dan fase lanjutan saat ini.

## 5. Out of Scope (MVP)
- AI-powered input (seperti fitur Gemini di Arvifund) — bisa jadi fase berikutnya
- Multi-kas/multi-organisasi dalam satu akun
- Approval workflow berjenjang untuk pengeluaran besar
- Notifikasi via WhatsApp untuk reminder iuran (dipilih email saja untuk saat ini; notifikasi WA bisa jadi fase lanjutan §4.12)
- Auto-match mutasi rekening bank

## 6. Data Model (Draf Awal)
- `members` — id, name, email, phone, status, joined_at
- `dues_periods` — id, month, year, amount_default
- `dues_payments` — id, member_id, period_id, paid_at, amount, status (`belum_bayar` / `pending_verifikasi` / `lunas`), **claimed_at, claimed_amount, claimed_date, proof_url, verified_by, verified_at, rejection_reason**
- `transactions` — id, type (in/out), category_id, amount, date, description, receipt_url, created_by, member_id
- `categories` — id, name, type (in/out), is_active
- `profiles` — id (ref auth.users), role (admin/pengurus/anggota), member_id
- `audit_logs` — id, table_name, record_id, action (create/update/delete), old_value, new_value, actor_id, created_at
- `monthly_closings` — id, month, year, closing_balance, closed_by, closed_at, is_locked

## 7. Tech Stack
- Next.js 14 (App Router), Supabase (Auth + DB + Storage), deploy Vercel — konsisten dengan Arvifund
- Recharts untuk visualisasi
- PWA: manifest.json + service worker untuk installable app
- Email: Resend (atau email API sejenis) + Vercel Cron Job untuk scheduled reminder
- Bukti klaim pembayaran (§4.12): disimpan di Supabase Storage, bucket terpisah dari bukti struk pengeluaran
- Repo & project terpisah dari Arvifund

## 8. Metrik Keberhasilan
- 100% transaksi kas tercatat di sistem (tidak ada pencatatan manual paralel)
- Status iuran bulanan bisa dicek dalam <10 detik oleh pengurus
- Laporan bulanan bisa digenerate tanpa rekap manual
- Setiap perubahan data bisa ditelusuri lewat audit log
- **Zero kasus "sudah bayar tapi tidak tercatat"** — setiap klaim anggota terlacak sampai statusnya jadi lunas/ditolak, tidak ada yang mengambang tanpa respons bendahara

## 9. Roadmap Bertahap
1. **Fase 1 (MVP)**: Auth, manajemen anggota (termasuk status nonaktif), input transaksi, dashboard saldo, tracking iuran manual-check, audit log dasar
2. **Fase 2**: Generate tagihan otomatis tiap bulan, tutup buku bulanan, export laporan PDF/CSV/Excel
3. **Fase 3**: Reminder email otomatis (Vercel Cron + Resend), upload bukti struk, PWA install, role approval
4. **Fase 4 (BARU)**: Klaim & verifikasi pembayaran iuran oleh anggota (§4.12), warning duplikat transaksi, checklist rekonsiliasi sebelum tutup buku

## 10. Keputusan
- **Kategori transaksi**: dibuat **custom/dinamis** (admin bisa tambah/edit kategori sendiri), bukan hardcode tetap. Kategori default (Iuran, Sumbangan, Konsumsi, Kegiatan, Operasional, Lain-lain) tetap disediakan sebagai starting point.
- **Login anggota**: **wajib**, setiap anggota punya akun sendiri untuk login dan melihat saldo kas serta status iuran pribadinya (bukan link publik read-only).
- **Metode login**: memakai **Nama Lengkap + Nomor ID Card** sebagai kredensial, bukan email/password Supabase Auth standar — keputusan sadar demi kemudahan ~25 anggota yang tidak semuanya terbiasa mengelola email/password terpisah.
- **Klaim pembayaran iuran**: anggota bisa self-report pembayaran, tapi status baru final ("lunas") setelah diverifikasi bendahara — bukan otomatis dipercaya, untuk menghindari klaim palsu.
