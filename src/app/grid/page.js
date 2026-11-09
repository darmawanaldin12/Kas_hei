'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, rp, ym, addM, lb } from '../../lib/supabase';

const tgl = (s) => (s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB' : null);

function Info({ k, v }) {
  return <div style={{ marginTop: 10 }}><small>{k}</small><b style={{ display: 'block' }}>{v}</b></div>;
}

function Grid() {
  const [off, setOff] = useState(0);
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [det, setDet] = useState(null);
  const [foto, setFoto] = useState(null);
  const end = addM(ym(), off);
  const ms = [5, 4, 3, 2, 1, 0].map((i) => addM(end, -i));
  const nm = (m) => lb(m) + (m.slice(0, 4) !== end.slice(0, 4) ? " '" + m.slice(2, 4) : '');

  useEffect(() => {
    (async () => {
      const [p, i] = await Promise.all([
        sb.from('profiles').select('id,nama,aktif').order('nama'),
        sb.from('iuran')
          .select('id,anggota_id,bulan,status,nominal,metode,bukti_path,dikirim_at,diverifikasi_at,diverifikasi_oleh,catatan')
          .in('status', ['lunas', 'menunggu_verifikasi']).gte('bulan', ms[0]).lte('bulan', end),
      ]);
      const all = p.data || [];
      setNames(Object.fromEntries(all.map((x) => [x.id, x.nama])));
      const st = {};
      (i.data || []).forEach((x) => {
        const k = x.anggota_id + x.bulan;
        if (!st[k] || st[k].status !== 'lunas') st[k] = x;
      });
      setRows(all.filter((x) => x.aktif).map((x) => ({ ...x, c: ms.map((m) => st[x.id + m] || null) })));
    })();
  }, [off]);

  async function buka(x, cell) {
    setDet({ ...cell, nama: x.nama });
    if (!cell.bukti_path) return setFoto({ id: cell.id, s: 'tanpa' });
    setFoto({ id: cell.id, s: 'muat' });
    const r = await sb.storage.from('bukti').createSignedUrl(cell.bukti_path, 3600);
    setFoto({ id: cell.id, s: r.data?.signedUrl ? 'ok' : 'gagal', url: r.data?.signedUrl });
  }

  const kuning = { background: '#FDE068' };
  const f = det && foto && foto.id === det.id ? foto : null;

  return (
    <>
      <div className="nav-m">
        <button className="btn y" onClick={() => setOff(off - 1)}>&lt;</button>
        <div className="btn y" style={{ cursor: 'default' }}>{lb(end)} {end.slice(0, 4)}</div>
        <button className="btn y" disabled={off >= 0} onClick={() => setOff(off + 1)}>&gt;</button>
      </div>
      <div className="spread">
        <span><span className="tag g">Lunas ✓</span> <span className="tag p">Belum ✕</span> <span className="tag" style={kuning}>Menunggu …</span></span>
      </div>
      <small>{nm(ms[0])} → {nm(end)} {end.slice(0, 4)} · Ketuk bulan berstatus ✓ atau … untuk melihat rincian</small>
      {!rows ? <p className="mut">Memuat…</p> : rows.map((x) => {
        const belum = ms.filter((_, i) => !x.c[i]);
        const tunggu = ms.filter((_, i) => x.c[i] && x.c[i].status === 'menunggu_verifikasi');
        return (
          <div className="card" key={x.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                const cell = x.c[i];
                const lunas = cell && cell.status === 'lunas';
                const tg = cell && !lunas;
                return (
                  <span
                    key={m}
                    role={cell ? 'button' : undefined}
                    tabIndex={cell ? 0 : undefined}
                    onClick={cell ? () => buka(x, cell) : undefined}
                    onKeyDown={cell ? (e) => { if (e.key === 'Enter') buka(x, cell); } : undefined}
                    className={'tag ' + (lunas ? 'g' : !cell ? 'p' : '')}
                    style={{ textAlign: 'center', cursor: cell ? 'pointer' : 'default', ...(tg ? kuning : {}) }}
                  >
                    {nm(m)} {lunas ? '✓' : !cell ? '✕' : '…'}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {det && (
        <div onClick={() => setDet(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,43,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', margin: 0 }}>
            <b style={{ display: 'block', fontSize: 18 }}>{det.nama}</b>
            <small>Iuran {lb(det.bulan)} {det.bulan.slice(0, 4)}</small>
            <div style={{ marginTop: 8 }}>
              {det.status === 'lunas' ? <span className="tag g">Lunas ✓</span> : <span className="tag" style={kuning}>Menunggu verifikasi …</span>}
            </div>
            <Info k="Nominal" v={rp(det.nominal) + (det.metode ? ' · ' + det.metode : '')} />
            <Info k="Diinput" v={tgl(det.dikirim_at) || (det.bukti_path ? '-' : 'Dicatat langsung oleh bendahara')} />
            <Info
              k="Disetujui"
              v={det.status === 'lunas'
                ? (tgl(det.diverifikasi_at) || '-') + (det.diverifikasi_oleh && names[det.diverifikasi_oleh] ? ' · oleh ' + names[det.diverifikasi_oleh] : '')
                : 'Belum, menunggu bendahara'}
            />
            {det.catatan && <Info k="Catatan" v={det.catatan} />}
            <div style={{ marginTop: 12 }}>
              <small>Foto bukti</small>
              {!f || f.s === 'muat' ? <p className="mut">Memuat foto…</p>
                : f.s === 'ok' ? <a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={'Bukti ' + det.nama} style={{ width: '100%', borderRadius: 12, marginTop: 6 }} /></a>
                : f.s === 'tanpa' ? <p className="mut">Tidak ada foto (dicatat langsung oleh bendahara).</p>
                : <p className="mut">Foto bukti hanya bisa dilihat bendahara, ketua, dan pemilik iuran.</p>}
            </div>
            <button className="btn y s" style={{ marginTop: 14 }} onClick={() => setDet(null)}>Tutup</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Page() {
  return <Shell title="Grid iuran">{() => <Grid />}</Shell>;
}
