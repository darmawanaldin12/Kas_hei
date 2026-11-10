import { createClient } from '@supabase/supabase-js';

const err = (error, status) => Response.json({ error }, { status });

export async function POST(req) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return err('SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel', 500);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });

  const tok = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: u } = await admin.auth.getUser(tok);
  if (!u?.user) return err('Tidak berwenang', 401);
  const { data: me } = await admin.from('profiles').select('role,aktif').eq('id', u.user.id).single();
  if (me?.role !== 'ketua' || !me.aktif) return err('Hanya ketua yang boleh menambah anggota', 403);

  const b = await req.json();
  const nama = (b.nama || '').trim();
  const namaLogin = (b.nama_login || '').trim().toLowerCase();
  const emailPengingat = (b.email_pengingat || '').trim().toLowerCase();
  const password = b.password || '';
  const role = ['anggota', 'bendahara', 'ketua'].includes(b.role) ? b.role : 'anggota';
  const mulai = /^\d{4}-\d{2}-01$/.test(b.mulai_bulan || '') ? b.mulai_bulan : null;

  if (!nama) return err('Nama lengkap wajib diisi', 400);
  if (!/^[a-z0-9._-]{3,30}$/.test(namaLogin)) return err('Nama login 3-30 karakter: huruf kecil, angka, titik, strip', 400);
  // Email pengingat boleh kosong; kalau diisi harus berformat email.
  if (emailPengingat && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPengingat)) return err('Format email tidak valid', 400);
  if (password.length < 6) return err('Kata sandi minimal 6 karakter', 400);

  const { data: ada } = await admin.from('profiles').select('id,aktif').eq('nama_login', namaLogin).maybeSingle();
  if (ada && ada.aktif) return err('Nama login sudah dipakai', 400);

  // Nama login ini milik anggota yang sudah dinonaktifkan: aktifkan kembali akunnya
  // (riwayat iuran lama tetap utuh) dengan data dan kata sandi yang baru.
  if (ada) {
    const { error: e0 } = await admin.auth.admin.updateUserById(ada.id, { password });
    if (e0) return err('Gagal mengaktifkan kembali: ' + e0.message, 500);
    const upd0 = { nama, aktif: true, role, email_pengingat: emailPengingat || null };
    if (mulai) upd0.mulai_bulan = mulai;
    const { error: e1 } = await admin.from('profiles').update(upd0).eq('id', ada.id);
    if (e1) return err('Gagal menyimpan profil: ' + e1.message, 500);
    return Response.json({ ok: true, diaktifkan_kembali: true });
  }

  // Email akun bersifat internal (tidak pernah dikirimi email); email asli hanya untuk pengingat.
  const { data, error } = await admin.auth.admin.createUser({
    email: namaLogin + '@kas.internal',
    password,
    email_confirm: true,
    user_metadata: { nama },
  });
  if (error) return err(error.message, 400);

  const upd = { nama_login: namaLogin, email_pengingat: emailPengingat || null, role };
  if (mulai) upd.mulai_bulan = mulai;
  const { error: e2 } = await admin.from('profiles').update(upd).eq('id', data.user.id);
  if (e2) {
    await admin.auth.admin.deleteUser(data.user.id);
    return err('Gagal menyimpan profil: ' + e2.message, 500);
  }
  return Response.json({ ok: true });
}
