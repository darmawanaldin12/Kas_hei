'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { sb } from '../lib/supabase';

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
  const last = me.role === 'bendahara' ? ['/catat', '+', 'CATAT'] : me.role === 'ketua' ? ['/anggota', '☻', 'ANGGOTA'] : ['/bukti', '↑', 'BUKTI'];
  const nav = [['/', '⌂', 'BERANDA'], ['/grid', '▦', 'IURAN'], last, ['/riwayat', '☰', 'RIWAYAT']];

  return (
    <div className="app">
      <header>
        <div><span className="tag k">{me.role}</span><h1>{title}</h1></div>
        <button className="av" title="Keluar" onClick={async () => { await sb.auth.signOut(); r.replace('/login'); }}>{me.nama[0]}</button>
      </header>
      <main>{children(me)}</main>
      <nav>{nav.map(([h, i, l]) => <Link key={h} href={h} className={p === h ? 'on' : ''}><b>{i}</b>{l}</Link>)}</nav>
    </div>
  );
}
