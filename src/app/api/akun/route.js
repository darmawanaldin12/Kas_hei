import { createClient } from '@supabase/supabase-js';

const err = (error, status) => Response.json({ error }, { status });

// Pengaturan akun milik sendiri. Dijalankan di server karena mengubah akun login
// dan kolom profil yang tidak boleh diubah langsung oleh anggota.
export async function POST(req) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return err('SUPABASE_SERVICE_ROLE_KEY belum diset di Vercel', 500);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });

  const tok = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: u } = await admin.auth.getUser(tok);
  if (!u?.user) return err('Tidak berwenang', 401);
  const { data: me } = await admin.from('profiles').select('id,aktif,nama_login,foto_path').eq('id', u.user.id).single();
  if (!me || !me.aktif) return err('Akun tidak aktif', 403);

  const b = await req.json().catch(() => ({}));

  if (b.aksi === 'username') {
    const nl = String(b.nama_login || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(nl)) return err('Username 3-30 karakter: huruf kecil, angka, titik, strip, atau garis bawah', 400);
    if (nl === me.nama_login) return Response.json({ ok: true, nama_login: nl });

    const { data: ada } = await admin.from('profiles').select('id').eq('nama_login', nl).neq('id', me.id).maybeSingle();
    if (ada) return err('Username sudah dipakai', 400);

    const emailBaru = nl + '@kas.internal';
    const emailLama = u.user.email;
    const { error: e1 } = await admin.auth.admin.updateUserById(me.id, { email: emailBaru, email_confirm: true });
    if (e1) return err(/already|registered|exists/i.test(e1.message) ? 'Username sudah dipakai' : e1.message, 400);

    const { error: e2 } = await admin.from('profiles').update({ nama_login: nl, email: emailBaru }).eq('id', me.id);
    if (e2) {
      await admin.auth.admin.updateUserById(me.id, { email: emailLama, email_confirm: true });
      return err('Gagal menyimpan username: ' + e2.message, 500);
    }
    return Response.json({ ok: true, nama_login: nl });
  }

  if (b.aksi === 'foto') {
    const path = String(b.path || '');
    if (!path.startsWith(me.id + '/') || path.includes('..') || path.split('/').length !== 2) return err('Lokasi foto tidak valid', 400);
    const nama = path.split('/')[1];
    const { data: ls } = await admin.storage.from('profil').list(me.id, { search: nama });
    if (!ls || !ls.some((x) => x.name === nama)) return err('Foto belum terunggah', 400);

    const { error: e1 } = await admin.from('profiles').update({ foto_path: path }).eq('id', me.id);
    if (e1) return err('Gagal menyimpan foto: ' + e1.message, 500);
    if (me.foto_path && me.foto_path !== path) await admin.storage.from('profil').remove([me.foto_path]);
    return Response.json({ ok: true });
  }

  return err('Aksi tidak dikenal', 400);
}
