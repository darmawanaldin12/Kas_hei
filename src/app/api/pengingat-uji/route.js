import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { buatEmail } from '../../../lib/email';

export const dynamic = 'force-dynamic';

const err = (error, status) => Response.json({ error }, { status });
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
  const uji = !bulan.length;
  const { subject, text, html } = buatEmail({ nama: o.nama, bulan, nominal, uji });

  try {
    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: gUser, pass: gPass } });
    await mail.sendMail({ from: `Kas Kantor <${gUser}>`, replyTo: gUser, to: o.email_pengingat, subject, text, html });
  } catch (e) {
    return err('Gagal mengirim: ' + String(e.message || e).slice(0, 160), 502);
  }
  return Response.json({ ok: true, ke: samar(o.email_pengingat), uji, bulan: bulan.length });
}
