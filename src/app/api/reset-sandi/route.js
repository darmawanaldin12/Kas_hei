import { createClient } from '@supabase/supabase-js';

const err = (error, status) => Response.json({ error }, { status });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reset kata sandi oleh ketua. Dijalankan di server karena hanya service role
// yang boleh mengubah sandi akun orang lain.
export async function POST(req) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return err('SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel', 500);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });

  const tok = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: u } = await admin.auth.getUser(tok);
  if (!u?.user) return err('Tidak berwenang', 401);
  const { data: me } = await admin.from('profiles').select('id,role,aktif').eq('id', u.user.id).single();
  if (me?.role !== 'ketua' || !me.aktif) return err('Hanya ketua yang boleh mereset sandi', 403);

  const b = await req.json().catch(() => ({}));
  const id = String(b.anggota_id || '');
  const password = String(b.password || '');
  if (!UUID.test(id)) return err('Anggota tidak valid', 400);
  if (password.length < 6) return err('Kata sandi minimal 6 karakter', 400);
  if (password.length > 72) return err('Kata sandi maksimal 72 karakter', 400);

  const { data: target } = await admin.from('profiles').select('id,nama,nama_login,role,aktif').eq('id', id).single();
  if (!target || !target.aktif) return err('Anggota tidak ditemukan atau sudah nonaktif', 404);

  // Ketua boleh mengganti sandinya sendiri, anggota, dan bendahara.
  // Akun ketua lain hanya bisa diubah oleh pemiliknya lewat menu Pengaturan.
  if (target.role === 'ketua' && target.id !== me.id) {
    return err('Sandi ketua lain tidak bisa direset dari sini', 403);
  }

  const { error } = await admin.auth.admin.updateUserById(target.id, { password });
  if (error) return err('Gagal mengganti sandi: ' + error.message, 500);

  return Response.json({ ok: true, nama: target.nama, nama_login: target.nama_login });
}
