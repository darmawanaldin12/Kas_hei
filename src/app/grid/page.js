'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, ym, addM, lb } from '../../lib/supabase';

function Grid() {
  const [off, setOff] = useState(0);
  const [rows, setRows] = useState(null);
  const end = addM(ym(), off);
  const ms = [5, 4, 3, 2, 1, 0].map((i) => addM(end, -i));

  useEffect(() => {
    (async () => {
      const [p, i] = await Promise.all([
        sb.from('profiles').select('id,nama').eq('aktif', true).order('nama'),
        sb.from('iuran').select('anggota_id,bulan').eq('status', 'lunas').gte('bulan', ms[0]).lte('bulan', end),
      ]);
      const ok = new Set((i.data || []).map((x) => x.anggota_id + x.bulan));
      setRows((p.data || []).map((x) => ({ ...x, c: ms.map((m) => ok.has(x.id + m)) })));
    })();
  }, [off]);

  return (
    <>
      <div className="nav-m">
        <button className="btn y" onClick={() => setOff(off - 1)}>&lt;</button>
        <div className="btn y" style={{ cursor: 'default' }}>{lb(end)} {end.slice(0, 4)}</div>
        <button className="btn y" disabled={off >= 0} onClick={() => setOff(off + 1)}>&gt;</button>
      </div>
      <div className="spread"><span><span className="tag g">Lunas</span> <span className="tag p">Belum</span></span><small>{lb(ms[0])} → {lb(end)}</small></div>
      {!rows ? <p className="mut">Memuat…</p> : rows.map((x) => (
        <div className="card row" key={x.id}>
          <span className="av s">{x.nama[0]}</span><b>{x.nama}</b>
          <div className="sq">{x.c.map((o, i) => <i key={i} className={o ? 'ok' : ''} />)}</div>
        </div>
      ))}
    </>
  );
}

export default function Page() {
  return <Shell title="Grid iuran">{() => <Grid />}</Shell>;
}
