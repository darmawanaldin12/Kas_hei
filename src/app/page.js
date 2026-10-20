'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../components/Shell';
import { sb, rp, ym, lb } from '../lib/supabase';

function Home({ me }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const b = ym();
      const [s, p, l, t] = await Promise.all([
        sb.from('kas_saldo').select('*').single(),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('aktif', true),
        sb.from('iuran').select('id', { count: 'exact', head: true }).eq('bulan', b).eq('status', 'lunas'),
        sb.from('tunggakan').select('anggota_id,nama').eq('bulan', b),
      ]);
      setD({ s: s.data || {}, n: p.count || 0, l: l.count || 0, t: t.data || [] });
    })();
  }, []);
  if (!d) return <p className="mut">Memuat…</p>;
  const pct = d.n ? Math.round((d.l / d.n) * 100) : 0;
  return (
    <>
      <div className="card blue">
        <small>Saldo kas</small>
        <div className="big">{rp(d.s.saldo)}</div>
        <div className="two">
          <div className="card w"><small>Masuk</small><b>{rp(d.s.total_masuk)}</b></div>
          <div className="card w"><small>Keluar</small><b>{rp(d.s.total_keluar)}</b></div>
        </div>
      </div>
      <div className="card">
        <div className="spread"><small>Iuran {lb(ym())}</small><b>{d.l} / {d.n} lunas</b></div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
      </div>
      <small className="h">Belum bayar ({d.t.length})</small>
      {d.t.map((x) => (
        <div className="card row" key={x.anggota_id}>
          <span className="av s">{x.nama[0]}</span><b>{x.nama}</b>
          {me.role === 'bendahara' && <Link className="btn pink s" href="/catat">Catat</Link>}
          {me.role === 'anggota' && x.anggota_id === me.id && <Link className="btn y s" href="/bukti">Kirim bukti</Link>}
        </div>
      ))}
    </>
  );
}

export default function Page() {
  return <Shell title="Kas Kantor">{(me) => <Home me={me} />}</Shell>;
}
