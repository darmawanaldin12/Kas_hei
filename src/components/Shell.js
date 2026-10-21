'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { sb } from '../lib/supabase';

const IKON = {
  home: 'M3 11 12 3l9 8M5 10v10h14V10',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  plus: 'M12 4v16M4 12h16',
  list: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M17 4a4 4 0 0 1 0 7M22 21v-2a5 5 0 0 0-4-4.9',
  up: 'M12 16V4M7 9l5-5 5 5M4 20h16',
};
const ico = (k) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IKON[k]} /></svg>
);

export default function Shell({ title, only, children }) {
  const r = useRouter();
  const p = usePathname();
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return r.replace('/login');
      const { data } = await sb.from('profiles').select('id,nama,role,aktif').eq('id', session.user.id).single();
      if (!data || !data.aktif) { await sb.auth.signOut(); return r.replace('/login'); }
      if (only && !only.includes(data.role)) return r.replace('/');
      setMe(data);
    })();
  }, []);

  if (!me) return <div className="app"><p className="mut">Memuat…</p></div>;
  const last = me.role === 'bendahara' ? ['/catat', 'plus', 'Catat'] : me.role === 'ketua' ? ['/anggota', 'users', 'Anggota'] : ['/bukti', 'up', 'Bukti'];
  const nav = [['/', 'home', 'Beranda'], ['/grid', 'grid', 'Iuran'], last, ['/riwayat', 'list', 'Riwayat']];

  return (
    <div className="app">
      <header>
        <div><span className="tag k">{me.role}</span><h1>{title}</h1></div>
        <button className="av" title="Keluar" aria-label="Keluar" onClick={async () => { await sb.auth.signOut(); r.replace('/login'); }}>{me.nama[0]}</button>
      </header>
      <main>{children(me)}</main>
      <nav>{nav.map(([h, i, l]) => <Link key={h} href={h} className={p === h ? 'on' : ''}>{ico(i)}{l}</Link>)}</nav>
    </div>
  );
}
