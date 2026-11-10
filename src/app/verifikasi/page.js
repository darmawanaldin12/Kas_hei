'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import Sukses from '../../components/Sukses';
import { sb, rp, ym, lb } from '../../lib/supabase';

const thn = ym().slice(0, 4);
const nm = (m) => lb(m) + (m.slice(0, 4) !== thn ? " '" + m.slice(2, 4) : '');

function Verifikasi() {
  const [d, setD] = useState(null);
  const [sel, setSel] = useState({});
  const [tolak, setTolak] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState(null);
  const [zoom, setZoom] = useState(null);

  const load = async () => {
    const { data: rows } = await sb.from('iuran')
      .select('id,anggota_id,bulan,nominal,metode,bukti_path,dikirim_at')
      .eq('status', 'menunggu_verifikasi')
      .order('dikirim_at', { ascending: true });
    const list = rows || [];
    const ids = [...new Set(list.map((x) => x.anggota_id))];
    const { data: ppl } = ids.length ? await sb.from('profiles').select('id,nama').in('id', ids) : { data: [] };
    const nama = Object.fromEntries((ppl || []).map((p) => [p.id, p.nama]));

    const g = {};
    list.forEach((x) => {
      const k = x.anggota_id + '|' + (x.bukti_path || x.id);
      if (!g[k]) g[k] = { k, nama: nama[x.anggota_id] || '?', metode: x.metode, bukti_path: x.bukti_path, items: [] };
      g[k].items.push(x);
    });
    const grup = Object.values(g);
    grup.forEach((x) => x.items.sort((a, b) => a.bulan.localeCompare(b.bulan)));
    await Promise.all(grup.map(async (x) => {
      x.url = null;
      if (x.bukti_path) {
        const s = await sb.storage.from('bukti').createSignedUrl(x.bukti_path, 3600);
        x.url = s.data?.signedUrl || null;
      }
    }));
    setSel(Object.fromEntries(list.map((x) => [x.id, true])));
    setD(grup);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!zoom) return;
    const esc = (e) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [zoom]);

  async function ubah(x, ids, patch) {
    setBusy(true); setMsg('');
    const { error } = await sb.from('iuran').update(patch).in('id', ids);
    setBusy(false);
    if (error) return setMsg(error.message);
    const dipilih = x.items.filter((it) => ids.includes(it.id));
    const total = dipilih.reduce((a, it) => a + Number(it.nominal || 0), 0);
    const lunas = patch.status === 'lunas';
    setSukses({
      tipe: lunas ? 'ok' : 'tolak',
      judul: lunas ? 'Bukti disetujui' : 'Bukti ditolak',
      sub: lunas ? 'Tercatat lunas dan masuk ke kas' : 'Anggota akan melihat alasan penolakan',
      rincian: [['Anggota', x.nama], ['Bulan', dipilih.map((it) => nm(it.bulan)).join(', ')], ['Alasan', lunas ? '' : patch.catatan], [lunas ? 'Total' : 'Nominal', rp(total), true]],
    });
    setTolak(null); setAlasan('');
    load();
  }

  if (!d) return <Memuat />;
  return (
    <>
      {sukses && (
        <Sukses
          tipe={sukses.tipe} judul={sukses.judul} sub={sukses.sub} rincian={sukses.rincian}
          tombol={[{ teks: 'Lanjut', klik: () => setSukses(null) }]}
        />
      )}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, cursor: 'zoom-out',
          }}
        >
          <img
            src={zoom.url} alt={'Bukti ' + zoom.nama}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
          />
          <button
            type="button" className="btn pink s" onClick={() => setZoom(null)}
            style={{ position: 'absolute', top: 12, right: 12 }}
          >Tutup</button>
        </div>
      )}
      <small>Periksa bukti dari anggota. Kalau satu bukti untuk beberapa bulan, centang bulan yang jumlah transfernya sesuai.</small>
      {msg && <div className="note bad">{msg}</div>}
      {!d.length && <p className="mut">Tidak ada bukti yang menunggu verifikasi.</p>}
      {d.map((x) => {
        const pilih = x.items.filter((it) => sel[it.id]).map((it) => it.id);
        const total = x.items.filter((it) => sel[it.id]).reduce((a, it) => a + Number(it.nominal || 0), 0);
        return (
          <div className="card" key={x.k} style={{ marginTop: 12 }}>
            <div className="spread">
              <div><b style={{ display: 'block' }}>{x.nama}</b><small>{x.items.length} bulan · {x.metode}</small></div>
              <b>{rp(x.items.reduce((a, it) => a + Number(it.nominal || 0), 0))}</b>
            </div>
            <small style={{ display: 'block', marginTop: 10 }}>Bulan yang disetujui/ditolak (ketuk untuk centang)</small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {x.items.map((it) => {
                const on = !!sel[it.id];
                return (
                  <span key={it.id} role="button" tabIndex={0} className="tag p"
                    onClick={() => setSel((s) => ({ ...s, [it.id]: !s[it.id] }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSel((s) => ({ ...s, [it.id]: !s[it.id] })); }}
                    style={{ cursor: 'pointer', ...(on ? { background: '#1a1a2e', color: '#fff' } : {}) }}>
                    {on ? '☑' : '☐'} {nm(it.bulan)} · {rp(it.nominal)}
                  </span>
                );
              })}
            </div>
            {x.url
              ? <img src={x.url} alt={'Bukti ' + x.nama} onClick={() => setZoom({ url: x.url, nama: x.nama })} style={{ width: '100%', borderRadius: 12, marginTop: 10, cursor: 'zoom-in' }} />
              : <p className="mut">Foto bukti tidak bisa dimuat.</p>}
            {tolak === x.k ? (
              <>
                <label><small>Alasan penolakan</small>
                  <input className="in" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Misal: foto buram, nominal kurang" /></label>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn pink s" disabled={busy || !alasan.trim() || !pilih.length} onClick={() => ubah(x, pilih, { status: 'ditolak', catatan: alasan.trim() })}>Tolak {pilih.length} bulan</button>
                  <button className="btn s" disabled={busy} onClick={() => { setTolak(null); setAlasan(''); }}>Batal</button>
                </div>
              </>
            ) : (
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <button className="btn y s" disabled={busy || !pilih.length} onClick={() => ubah(x, pilih, { status: 'lunas', catatan: null })}>Setujui {pilih.length} bulan ({rp(total)})</button>
                <button className="btn pink s" disabled={busy || !pilih.length} onClick={() => setTolak(x.k)}>Tolak</button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function Page() {
  return <Shell title="Verifikasi" only={['bendahara']}>{() => <Verifikasi />}</Shell>;
}
