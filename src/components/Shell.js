'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { sb } from '../lib/supabase';
import Memuat from './Memuat';
import Ikon from './Ikon';

const STORAGE_KEY = 'notif_dibaca_at';

export default function Shell({ title, only, children }) {
  const r = useRouter();
  const p = usePathname();
  const [me, setMe] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [badge, setBadge] = useState(false);

  // Hitung notif belum baca
  const hitungBadge = async (profile) => {
    const dibacaAt = localStorage.getItem(STORAGE_KEY);
    const sejak = dibacaAt ? new Date(dibacaAt).toISOString() : new Date(0).toISOString();

    if (profile.role === 'anggota' || profile.role === 'ketua') {
      const { count } = await sb.from('iuran')
        .select('id', { count: 'exact', head: true })
        .eq('anggota_id', profile.id)
        .in('status', ['ditolak', 'lunas'])
        .gt('diverifikasi_at', sejak);
      if (count > 0) { setBadge(true); return; }
    }
    if (profile.role === 'bendahara' || profile.role === 'ketua') {
      const { count } = await sb.from('iuran')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'menunggu_verifikasi')
        .gt('dikirim_at', sejak);
      if (count > 0) { setBadge(true); return; }
    }
    setBadge(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return r.replace('/login');
      const { data } = await sb.from('profiles').select('id,nama,role,aktif,nama_login,foto_path').eq('id', session.user.id).single();
      if (!data || !data.aktif) { await sb.auth.signOut(); return r.replace('/login'); }
      if (only && !only.includes(data.role)) return r.replace('/');
      setMe(data);
      hitungBadge(data);
      window.addEventListener('notif-dibaca', () => setBadge(false));

      if (data.foto_path) {
        const f = await sb.storage.from('profil').download(data.foto_path);
        if (f.data) setAvatar(URL.createObjectURL(f.data));
      }
    })();
  }, []);

  if (!me) return <div className="app"><Memuat /></div>;
  const last = me.role === 'bendahara' ? ['/catat', 'plus', 'Catat'] : me.role === 'ketua' ? ['/anggota', 'users', 'Anggota'] : ['/bukti', 'up', 'Bukti'];
  const nav = [
    ['/', 'home', 'Beranda'],
    ['/grid', 'grid', 'Iuran'],
    last,
    ...(me.role === 'bendahara' ? [['/verifikasi', 'ok', 'Verifikasi']] : []),
    ...(me.role === 'ketua' ? [['/bukti', 'up', 'Bukti']] : []),
    ['/riwayat', 'list', 'Riwayat'],
  ];

  return (
    <div className="app">
      <header>
        <div><span className="tag k">{me.role}</span><h1>{title}</h1></div>
        <div className="head-aksi">
          <Link href="/notifikasi" className="av bell" title="Notifikasi" aria-label="Notifikasi">
            <Ikon name="bell" />
            {badge && <i className="dot" />}
          </Link>
          <Link href="/pengaturan" className="av" title="Pengaturan" aria-label="Pengaturan akun" style={avatar ? { padding: 0, overflow: 'hidden' } : undefined}>
            {avatar
              ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
              : me.nama[0]}
          </Link>
        </div>
      </header>
      <main>{children(me)}</main>
      <nav>{nav.map(([h, i, l]) => <Link key={h} href={h} className={p === h ? 'on' : ''}><Ikon name={i} />{l}</Link>)}</nav>
    </div>
  );
}
