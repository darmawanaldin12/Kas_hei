import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Ping ringan supaya project Supabase (paket gratis) tidak di-pause karena tidak aktif.
// Jadwal ada di vercel.json (Senin & Kamis 09:00 WIB). Tidak mengembalikan data apa pun.

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== 'Bearer ' + secret) {
    return Response.json({ error: 'Tidak berwenang' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json({ error: 'Env Supabase belum diset' }, { status: 500 });

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await sb.from('profiles').select('id', { count: 'exact', head: true });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, waktu: new Date().toISOString() });
}
