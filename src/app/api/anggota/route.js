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

  const { nama, email, password, role } = await req.json();
  if (!nama || !email || !password || password.length < 6) return err('Data belum lengkap (sandi minimal 6 karakter)', 400);

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nama } });
  if (error) return err(error.message, 400);
  if (role === 'bendahara' || role === 'ketua') await admin.from('profiles').update({ role }).eq('id', data.user.id);
  return Response.json({ ok: true });
}
