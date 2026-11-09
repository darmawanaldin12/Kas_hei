'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, ym, addM, lb } from '../../lib/supabase';

function Grid() {
  const [off, setOff] = useState(0);
  const [rows, setRows] = useState(null);
  const end = addM(ym(), off);
  const ms = [5, 4, 3, 2, 1, 0].map((i) => addM(end, -i));
  const nm = (m) => lb(m) + (m.slice(0, 4) !== end.slice(0, 4) ? " '" + m.slice(2, 4) : '');

  useEffect(() => {
    (async () => {
      const [p, i] = await Promise.all([
        sb.from('profiles').select('id,nama').eq('aktif', true).order('nama'),
        sb.from('iuran').select('anggota_id,bulan,status').in('status', ['lunas', 'menunggu_verifikasi']).gte('bulan', ms[0]).lte('bulan', end),
      ]);
      const st = {};
      (i.data || []).forEach((x) => {
        const k = x.anggota_id + x.bulan;
        if (st[k] !== 'lunas') st[k] = x.status;
      });
      setRows((p.data || []).map((x) => ({ ...x, c: ms.map((m) => st[x.id + m] || 'belum') })));
    })();
  }, [off]);

  return (
    <>
      <div className="nav-m">
        <button className="btn y" onClick={() => setOff(off - 1)}>&lt;</button>
        <div className="btn y" style={{ cursor: 'default' }}>{lb(end)} {end.slice(0, 4)}</div>
        <button className="btn y" disabled={off >= 0} onClick={() => setOff(off + 1)}>&gt;</button>
      </div>
      <div className="spread">
        <span><span className="tag g">Lunas ✓</span> <span className="tag p">Belum ✕</span> <span className="tag" style={{ background: '#FDE068' }}>Menunggu …</span></span>
      </div>
      <small>{nm(ms[0])} → {nm(end)} {end.slice(0, 4)}</small>
      {!rows ? <p className="mut">Memuat…</p> : rows.map((x) => {
        const belum = ms.filter((_, i) => x.c[i] === 'belum');
        const tunggu = ms.filter((_, i) => x.c[i] === 'menunggu_verifikasi');
        return (
          <div className="card" key={x.id}>
            <div className="row" style={{ gap: 10 }}>
              <span className="av s">{x.nama[0]}</span>
              <div>
                <b style={{ display: 'block' }}>{x.nama}</b>
                <small>
                  {belum.length ? 'Belum bayar: ' + belum.map(nm).join(', ') : 'Semua lunas ✓'}
                  {tunggu.length ? ' · Menunggu verifikasi: ' + tunggu.map(nm).join(', ') : ''}
                </small>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              {ms.map((m, i) => {
                const s = x.c[i];
                return (
                  <span key={m} className={'tag ' + (s === 'lunas' ? 'g' : s === 'belum' ? 'p' : '')} style={{ textAlign: 'center', ...(s === 'menunggu_verifikasi' ? { background: '#FDE068' } : {}) }}>
                    {nm(m)} {s === 'lunas' ? '✓' : s === 'belum' ? '✕' : '…'}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function Page() {
  return <Shell title="Grid iuran">{() => <Grid />}</Shell>;
}
