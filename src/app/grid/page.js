'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import Modal from '../../components/Modal';
import { sb, rp, ym, addM, lb } from '../../lib/supabase';
import { fotoUrl } from '../../lib/foto';

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
  const [member, setMember] = useState(null);
  const end = addM(ym(), off);
  const ms = [5, 4, 3, 2, 1, 0].map((i) => addM(end, -i));
  const nm = (m) => lb(m) + (m.slice(0, 4) !== end.slice(0, 4) ? " '" + m.slice(2, 4) : '');

  useEffect(() => {
    (async () => {
      const [p, i] = await Promise.all([
        sb.from('profiles').select('id,nama,aktif').order('nama'),
        sb.from('iuran')
          .select('id,anggota_id,bulan,status,nominal,metode,bukti_path,dikirim_at,diverifikasi_at,diverifikasi_oleh,catatan')
          .in('status', ['lunas', 'menunggu_verifikasi', 'ditolak']).gte('bulan', ms[0]).lte('bulan', end),
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
    const url = await fotoUrl(cell.bukti_path);
    setFoto({ id: cell.id, s: url ? 'ok' : 'gagal', url });
  }

  function bukaAnggota(x) {
    setMember({
      nama: x.nama,
      bulan: ms.map((m, i) => {
        const cell = x.c[i];
        return {
          bulan: m,
          label: nm(m),
          status: cell ? cell.status : 'belum',
          nominal: cell?.nominal || null,
          metode: cell?.metode || null,
        };
      }),
    });
  }

  const kuning = { background: 'var(--warning)' };
  const merah = { background: 'var(--danger)', color: '#fff' };
  const f = det && foto && foto.id === det.id ? foto : null;

  return (
    <>
      <div className="nav-m">
        <button className="btn y" onClick={() => setOff(off - 1)}>&lt;</button>
        <div className="btn y" style={{ cursor: 'default' }}>{lb(end)} {end.slice(0, 4)}</div>
        <button className="btn y" disabled={off >= 0} onClick={() => setOff(off + 1)}>&gt;</button>
      </div>
      <div className="spread">
        <span><span className="tag g">Lunas ✓</span> <span className="tag p">Belum ✕</span> <span className="tag" style={kuning}>Menunggu …</span> <span className="tag" style={merah}>Ditolak !</span></span>
      </div>
      <small>{nm(ms[0])} → {nm(end)} {end.slice(0, 4)} · Ketuk nama untuk rincian anggota, ketuk bulan untuk detail</small>
      {!rows ? <Memuat /> : rows.map((x) => {
        const belum = ms.filter((_, i) => !x.c[i]);
        const tunggu = ms.filter((_, i) => x.c[i] && x.c[i].status === 'menunggu_verifikasi');
        const tolak = ms.filter((_, i) => x.c[i] && x.c[i].status === 'ditolak');
        return (
          <div className="card" key={x.id}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onClick={() => bukaAnggota(x)}
              onKeyDown={(e) => { if (e.key === 'Enter') bukaAnggota(x); }}
            >
              <span className="av s">{x.nama[0]}</span>
              <div>
                <b style={{ display: 'block' }}>{x.nama}</b>
                <small>
                  {belum.length ? 'Belum bayar: ' + belum.map(nm).join(', ') : (tolak.length ? '' : 'Semua lunas ✓')}
                  {tunggu.length ? (belum.length ? ' · ' : '') + 'Menunggu verifikasi: ' + tunggu.map(nm).join(', ') : ''}
                  {tolak.length ? (belum.length || tunggu.length ? ' · ' : '') + 'Ditolak: ' + tolak.map(nm).join(', ') : ''}
                </small>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              {ms.map((m, i) => {
                const cell = x.c[i];
                const lunas = cell && cell.status === 'lunas';
                const ditolak = cell && cell.status === 'ditolak';
                const tg = cell && !lunas && !ditolak;
                return (
                  <span
                    key={m}
                    role={cell ? 'button' : undefined}
                    tabIndex={cell ? 0 : undefined}
                    onClick={cell ? () => buka(x, cell) : undefined}
                    onKeyDown={cell ? (e) => { if (e.key === 'Enter') buka(x, cell); } : undefined}
                    className={'tag ' + (lunas ? 'g' : !cell ? 'p' : '')}
                    style={{ textAlign: 'center', cursor: cell ? 'pointer' : 'default', ...(tg ? kuning : {}), ...(ditolak ? merah : {}) }}
                  >
                    {nm(m)} {lunas ? '✓' : ditolak ? '!' : !cell ? '✕' : '…'}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {det && (
        <Modal judul={det.nama} onTutup={() => setDet(null)}>
          <small>Iuran {lb(det.bulan)} {det.bulan.slice(0, 4)}</small>
            <div style={{ marginTop: 8 }}>
              {det.status === 'lunas' ? <span className="tag g">Lunas ✓</span>
                : det.status === 'ditolak' ? <span className="tag" style={merah}>Ditolak !</span>
                : <span className="tag" style={kuning}>Menunggu verifikasi …</span>}
            </div>
            <Info k="Nominal" v={rp(det.nominal) + (det.metode ? ' · ' + det.metode : '')} />
            <Info k="Diinput" v={tgl(det.dikirim_at) || (det.bukti_path ? '-' : 'Dicatat langsung oleh bendahara')} />
            <Info
              k={det.status === 'ditolak' ? 'Ditolak' : 'Disetujui'}
              v={det.status === 'lunas'
                ? (tgl(det.diverifikasi_at) || '-') + (det.diverifikasi_oleh && names[det.diverifikasi_oleh] ? ' · oleh ' + names[det.diverifikasi_oleh] : '')
                : det.status === 'ditolak'
                  ? (tgl(det.diverifikasi_at) || 'Oleh bendahara') + (det.diverifikasi_oleh && names[det.diverifikasi_oleh] ? ' · oleh ' + names[det.diverifikasi_oleh] : '')
                  : 'Belum, menunggu bendahara'}
            />
            {det.catatan && <Info k={det.status === 'ditolak' ? 'Alasan penolakan' : 'Catatan'} v={det.catatan} />}
            <div style={{ marginTop: 12 }}>
              <small>Foto bukti</small>
              {!f || f.s === 'muat' ? <Memuat kecil />
                : f.s === 'ok' ? <img src={f.url} alt={'Bukti ' + det.nama} style={{ width: '100%', borderRadius: 12, marginTop: 6 }} />
                : f.s === 'tanpa' ? <p className="mut">Tidak ada foto (dicatat langsung oleh bendahara).</p>
                : <p className="mut">Foto bukti hanya bisa dilihat bendahara, ketua, dan pemilik iuran.</p>}
            </div>
          <button className="btn y s" style={{ marginTop: 14 }} onClick={() => setDet(null)}>Tutup</button>
        </Modal>
      )}

      {member && (
        <Modal judul={member.nama} onTutup={() => setMember(null)}>
          <small>Rincian iuran {nm(ms[0])} — {nm(end)} {end.slice(0, 4)}</small>
            <div style={{ marginTop: 14 }}>
              {member.bulan.map((b) => {
                const lunas = b.status === 'lunas';
                const ditolak = b.status === 'ditolak';
                const tunggu = b.status === 'menunggu_verifikasi';
                const bg = lunas ? 'var(--success)' : ditolak ? 'var(--danger)' : tunggu ? 'var(--warning)' : 'var(--peach)';
                const color = ditolak ? '#fff' : 'var(--ink)';
                const label = lunas ? 'Lunas' : ditolak ? 'Ditolak' : tunggu ? 'Menunggu' : 'Belum';
                return (
                  <div key={b.bulan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid var(--divider)' }}>
                    <div>
                      <b style={{ display: 'block', fontSize: 15 }}>{b.label} {b.bulan.slice(0, 4)}</b>
                      {b.nominal && <small>{rp(b.nominal)}{b.metode ? ' · ' + b.metode : ''}</small>}
                    </div>
                    <span className="tag" style={{ background: bg, color, fontSize: 11 }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <small>
                {member.bulan.filter((b) => b.status === 'lunas').length} / {member.bulan.length} lunas
              </small>
              <button className="btn y s" onClick={() => setMember(null)}>Tutup</button>
            </div>
        </Modal>
      )}
    </>
  );
}

export default function Page() {
  return <Shell title="Grid iuran">{() => <Grid />}</Shell>;
}
