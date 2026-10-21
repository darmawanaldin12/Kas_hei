import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Jadwal ada di vercel.json: Senin 08:00 WIB (01:00 UTC).
// Vercel otomatis mengirim header Authorization: Bearer <CRON_SECRET>.
// Tambahkan ?dry=1 untuk melihat siapa yang akan dikirimi tanpa mengirim email.

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const label = (s) => BULAN[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4);
const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== 'Bearer ' + secret) {
    return Response.json({ error: 'Tidak berwenang' }, { status: 401 });
  }

  const dry = new URL(req.url).searchParams.get('dry') === '1';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!key) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diset' }, { status: 500 });
  if (!dry && (!user || !pass)) {
    return Response.json({ error: 'GMAIL_USER / GMAIL_APP_PASSWORD belum diset di Vercel' }, { status: 500 });
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });

  // Hanya anggota aktif yang punya email asli (email_pengingat).
  const { data: orang, error: e1 } = await sb
    .from('profiles')
    .select('id,nama,email_pengingat')
    .eq('aktif', true)
    .not('email_pengingat', 'is', null);
  if (e1) return Response.json({ error: e1.message }, { status: 500 });
  if (!orang.length) return Response.json({ ok: true, dikirim: 0, catatan: 'Belum ada anggota dengan email pengingat' });

  const { data: tg, error: e2 } = await sb
    .from('tunggakan')
    .select('anggota_id,bulan')
    .in('anggota_id', orang.map((o) => o.id))
    .order('bulan');
  if (e2) return Response.json({ error: e2.message }, { status: 500 });

  const { data: cfg } = await sb.from('pengaturan').select('iuran_nominal').single();
  const nominal = cfg?.iuran_nominal ?? 20000;

  const perOrang = new Map();
  for (const t of tg) {
    if (!perOrang.has(t.anggota_id)) perOrang.set(t.anggota_id, []);
    perOrang.get(t.anggota_id).push(t.bulan);
  }
  const target = orang.filter((o) => perOrang.has(o.id));

  if (dry) {
    return Response.json({
      ok: true,
      dry: true,
      akan_dikirim: target.map((o) => ({ nama: o.nama, email: o.email_pengingat, bulan: perOrang.get(o.id).map(label) })),
    });
  }

  const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  const app = 'https://kas-hei.vercel.app';
  const hasil = { dikirim: 0, gagal: [] };

  for (const o of target) {
    const bulan = perOrang.get(o.id);
    const total = bulan.length * nominal;
    const daftar = bulan.map(label);
    const text =
      `Halo ${o.nama},\n\nIni pengingat iuran kas kantor. Iuran yang belum tercatat:\n` +
      daftar.map((b) => `- ${b}`).join('\n') +
      `\n\nTotal: ${rp(total)} (${bulan.length} bulan x ${rp(nominal)})\n\n` +
      `Setelah bayar, kirim bukti lewat aplikasi: ${app}\n\nAbaikan email ini kalau sudah bayar dan buktinya sudah dikirim.`;
    const html =
      `<p>Halo ${esc(o.nama)},</p><p>Ini pengingat iuran kas kantor. Iuran yang belum tercatat:</p>` +
      `<ul>${daftar.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` +
      `<p><b>Total: ${rp(total)}</b> (${bulan.length} bulan x ${rp(nominal)})</p>` +
      `<p>Setelah bayar, kirim bukti lewat aplikasi: <a href="${app}">${app}</a></p>` +
      `<p style="color:#666">Abaikan email ini kalau sudah bayar dan buktinya sudah dikirim.</p>`;
    try {
      await mail.sendMail({
        from: `Kas Kantor <${user}>`,
        to: o.email_pengingat,
        subject: `Pengingat iuran kas: ${bulan.length} bulan belum tercatat`,
        text,
        html,
      });
      hasil.dikirim++;
    } catch (err) {
      hasil.gagal.push({ nama: o.nama, alasan: String(err.message || err).slice(0, 120) });
    }
  }

  return Response.json({ ok: true, ...hasil });
}
