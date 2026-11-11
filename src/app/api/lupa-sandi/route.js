import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import { buatEmailSandi } from '../../../lib/email';

export const dynamic = 'force-dynamic';

const err = (error, status) => Response.json({ error }, { status });
const JEDA_MENIT = 10;
// Tanpa huruf/angka yang mudah tertukar (0/O, 1/l/I).
const HURUF = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const buatSandi = () => Array.from({ length: 10 }, () => HURUF[randomInt(HURUF.length)]).join('');

// Publik (tanpa login). Jawabannya selalu sama, ada atau tidaknya email itu terdaftar,
// supaya orang lain tidak bisa menebak email siapa saja yang terdaftar.
export async function POST(req) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gUser = process.env.GMAIL_USER;
  const gPass = process.env.GMAIL_APP_PASSWORD;
  if (!key || !gUser || !gPass) return err('Layanan email belum siap. Hubungi ketua.', 500);

  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return err('Format email tidak valid', 400);

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
  const { data: daftar } = await admin
    .from('profiles')
    .select('id,nama,nama_login,reset_sandi_at')
    .eq('aktif', true)
    .ilike('email_pengingat', email.replace(/[%_\\]/g, '\\$&'))
    .limit(3);

  const batas = Date.now() - JEDA_MENIT * 60 * 1000;
  const akun = (daftar || []).filter((p) => p.nama_login && (!p.reset_sandi_at || new Date(p.reset_sandi_at).getTime() < batas));
  if (!akun.length) return Response.json({ ok: true });

  const baru = akun.map((p) => ({ id: p.id, nama: p.nama, namaLogin: p.nama_login, sandi: buatSandi() }));
  const { subject, text, html } = buatEmailSandi({ akun: baru });

  // Kirim email dulu. Kalau gagal, kata sandi lama tetap berlaku.
  try {
    const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: gUser, pass: gPass } });
    await mail.sendMail({ from: `Kas Kantor <${gUser}>`, replyTo: gUser, to: email, subject, text, html });
  } catch (e) {
    return err('Email gagal terkirim. Coba lagi sebentar lagi.', 502);
  }

  for (const a of baru) {
    const { error } = await admin.auth.admin.updateUserById(a.id, { password: a.sandi });
    if (!error) await admin.from('profiles').update({ reset_sandi_at: new Date().toISOString() }).eq('id', a.id);
  }
  return Response.json({ ok: true });
}
