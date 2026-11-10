import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const err = (error, status) => Response.json({ error }, { status });
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const label = (s) => BULAN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4);
const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const samar = (e) => e.replace(/^(.{2}).*(@.*)$/, '$1***$2');

// Khusus ketua: kirim satu email uji ke email pengingat milik satu anggota.
// Isinya sama dengan pengingat asli; kalau anggota tidak punya tunggakan, email diberi tanda uji.
export async function POST(req) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gUser = process.env.GMAIL_USER;
  const gPass = process.env.GMAIL_APP_PASSWORD;
  if (!key) return err('SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel', 500);
  if (!gUser || !gPass) return err('GMAIL_USER / GMAIL_APP_PASSWORD belum diset di Vercel', 500);

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
  const tok = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: u } = await admin.auth.getUser(tok);
  if (!u?.user) return err('Tidak berwenang', 401);
  const { data: me } = await admin.from('profiles').select('role,aktif').eq('id', u.user.id).single();
  if (me?.role !== 'ketua' || !me.aktif) return err('Hanya ketua yang boleh mengirim email uji', 403);

  const b = await req.json().catch(() => ({}));
  const { data: o } = await admin.from('profiles').select('id,nama,email_pengingat,aktif').eq('id', String(b.anggota_id || '')).maybeSingle();
  if (!o || !o.aktif) return err('Anggota tidak ditemukan', 404);
  if (!o.email_pengingat) return err('Anggota ini belum punya email pengingat', 400);

  const { data: tg } = await admin.from('tunggakan').select('bulan').eq('anggota_id', o.id).order('bulan');
  const { data: cfg } = await admin.from('pengaturan').select('iuran_nominal').single();
  const nominal = cfg?.iuran_nominal ?? 20000;
  const bulan = (tg || []).map((x) => x.bulan);
  const daftar = bulan.map(label);
  const app = 'https://kas-hei.vercel.app';

  const uji = !bulan.length;
  const subject = uji
    ? '[Uji] Pengingat iuran kas Kas Kantor'
    : `Pengingat iuran kas: ${bulan.length} bulan belum tercatat`;
  const text = uji
    ? `Halo ${o.nama},\n\nIni email uji dari aplikasi Kas Kantor. Saat ini tidak ada iuran yang menunggak atas namamu, jadi tidak ada yang perlu dibayar.\n\nKalau email ini sampai, pengingat otomatis setiap Senin pagi akan berjalan normal untuk anggota yang punya tunggakan.\n\n${app}`
    : `Halo ${o.nama},\n\nIni pengingat iuran kas kantor. Iuran yang belum tercatat:\n` +
      daftar.map((x) => `- ${x}`).join('\n') +
      `\n\nTotal: ${rp(bulan.length * nominal)} (${bulan.length} bulan x ${rp(nominal)})\n\n` +
      `Setelah bayar, kirim bukti lewat aplikasi: ${app}\n\nAbaikan email ini kalau sudah bayar dan buktinya sudah dikirim.`;
  const html = uji
    ? `<p>Halo ${esc(o.nama)},</p><p>Ini <b>email uji</b> dari aplikasi Kas Kantor. Saat ini tidak ada iuran yang menunggak atas namamu, jadi tidak ada yang perlu dibayar.</p>` +
      `<p>Kalau email ini sampai, pengingat otomatis setiap Senin pagi akan berjalan normal untuk anggota yang punya tunggakan.</p><p><a href="${app}">${app}</a></p>`
    : `<p>Halo ${esc(o.nama)},</p><p>Ini pengingat iuran kas kantor. Iuran yang belum tercatat:</p>` +
      `<ul>${daftar.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` +
      `<p><b>Total: ${rp(bulan.length * nominal)}</b> (${bulan.length} bulan x ${rp(nominal)})</p>` +
      `<p>Setelah bayar, kirim bukti lewat aplikasi: <a href="${app}">${app}</a></p>` +
      `<p style="color:#666">Abaikan email ini kalau sudah bayar dan buktinya sudah dikirim.</p>`;

  try {
    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: gUser, pass: gPass } });
    await mail.sendMail({ from: `Kas Kantor <${gUser}>`, to: o.email_pengingat, subject, text, html });
  } catch (e) {
    return err('Gagal mengirim: ' + String(e.message || e).slice(0, 160), 502);
  }
  return Response.json({ ok: true, ke: samar(o.email_pengingat), uji, bulan: bulan.length });
}
