// Isi email pengingat iuran. Dipakai oleh pengingat otomatis (cron) dan tombol Uji email.
export const APP_URL = 'https://kas-hei.vercel.app';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const labelBulan = (s) => BULAN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4);
export const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ALASAN = 'Kamu menerima email ini karena terdaftar sebagai anggota kas kantor. Kalau ada yang tidak sesuai, balas saja email ini.';

// bulan: daftar tanggal 'YYYY-MM-01' yang belum dibayar. uji: true kalau tidak ada tunggakan (email contoh).
export function buatEmail({ nama, bulan, nominal, uji }) {
  const daftar = bulan.map(labelBulan);
  const total = rp(bulan.length * nominal);

  if (uji) {
    return {
      subject: '[Uji] Pengingat iuran kas kantor',
      text:
        `Halo ${nama},\n\nIni email uji dari aplikasi kas kantor. Saat ini tidak ada iuran yang menunggak atas namamu, jadi tidak ada yang perlu dibayar.\n\n` +
        `Kalau email ini sampai, pengingat otomatis setiap Senin pagi akan berjalan normal untuk anggota yang punya tunggakan.\n\n` +
        `Salam,\nPengurus Kas Kantor\n\n--\n${ALASAN}`,
      html:
        `<p>Halo ${esc(nama)},</p>` +
        `<p>Ini <b>email uji</b> dari aplikasi kas kantor. Saat ini tidak ada iuran yang menunggak atas namamu, jadi tidak ada yang perlu dibayar.</p>` +
        `<p>Kalau email ini sampai, pengingat otomatis setiap Senin pagi akan berjalan normal untuk anggota yang punya tunggakan.</p>` +
        `<p>Salam,<br>Pengurus Kas Kantor</p>` +
        `<hr style="border:none;border-top:1px solid #ddd"><p style="color:#666;font-size:12px">${esc(ALASAN)}</p>`,
    };
  }

  return {
    subject: `Pengingat iuran kas kantor: ${bulan.length} bulan belum tercatat`,
    text:
      `Halo ${nama},\n\nIni pengingat iuran kas kantor. Iuran yang belum tercatat:\n` +
      daftar.map((b) => `- ${b}`).join('\n') +
      `\n\nTotal: ${total} (${bulan.length} bulan x ${rp(nominal)})\n\n` +
      `Setelah bayar, kirim bukti lewat aplikasi kas kantor: ${APP_URL}\n\n` +
      `Abaikan email ini kalau sudah bayar dan buktinya sudah dikirim.\n\n` +
      `Salam,\nPengurus Kas Kantor\n\n--\n${ALASAN}`,
    html:
      `<p>Halo ${esc(nama)},</p><p>Ini pengingat iuran kas kantor. Iuran yang belum tercatat:</p>` +
      `<ul>${daftar.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` +
      `<p><b>Total: ${total}</b> (${bulan.length} bulan x ${rp(nominal)})</p>` +
      `<p>Setelah bayar, kirim bukti lewat aplikasi kas kantor: <a href="${APP_URL}">${APP_URL}</a></p>` +
      `<p style="color:#666">Abaikan email ini kalau sudah bayar dan buktinya sudah dikirim.</p>` +
      `<p>Salam,<br>Pengurus Kas Kantor</p>` +
      `<hr style="border:none;border-top:1px solid #ddd"><p style="color:#666;font-size:12px">${esc(ALASAN)}</p>`,
  };
}
