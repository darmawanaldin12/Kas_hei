'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, ym, addM, lb } from '../../lib/supabase';

function Catat() {
  const [mode, setMode] = useState('iuran');
  const [ang, setAng] = useState([]);
  const [kat, setKat] = useState([]);
  const [f, setF] = useState({ a: '', b: ym(), j: 20000, c: '', k: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const [p, k, s] = await Promise.all([
        sb.from('profiles').select('id,nama').eq('aktif', true).order('nama'),
        sb.from('kategori_kas').select('id,nama').eq('jenis', 'keluar'),
        sb.from('pengaturan').select('iuran_nominal').single(),
      ]);
      setAng(p.data || []); setKat(k.data || []);
      setF((v) => ({ ...v, a: p.data?.[0]?.id || '', j: s.data?.iuran_nominal || 20000, k: k.data?.[0]?.id || '' }));
    })();
  }, []);

  const set = (k, v) => setF({ ...f, [k]: v });

  async function simpan() {
    setMsg('Menyimpan…');
    const r = mode === 'iuran'
      ? await sb.from('iuran').upsert({ anggota_id: f.a, bulan: f.b, nominal: +f.j, metode: 'tunai', status: 'lunas', catatan: f.c || null }, { onConflict: 'anggota_id,bulan' })
      : await sb.from('kas_transaksi').insert({ jenis: 'keluar', kategori_id: f.k || null, jumlah: +f.j, keterangan: f.c || null });
    setMsg(r.error ? r.error.message : 'Tersimpan ✓');
  }

  return (
    <>
      <div className="seg">
        <button className={mode === 'iuran' ? 'on' : ''} onClick={() => setMode('iuran')}>Iuran masuk</button>
        <button className={mode === 'keluar' ? 'on' : ''} onClick={() => setMode('keluar')}>Pengeluaran</button>
      </div>
      <small>Khusus bendahara. Langsung tercatat dan terekam.</small>
      <div style={{ height: 12 }} />
      {mode === 'iuran' ? (
        <>
          <label><small>Anggota</small>
            <select className="in" value={f.a} onChange={(e) => set('a', e.target.value)}>{ang.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>
          <small>Bulan</small>
          <div className="seg">{[addM(ym(), -2), addM(ym(), -1), ym()].map((m) => <button key={m} className={f.b === m ? 'on' : ''} onClick={() => set('b', m)}>{lb(m)}</button>)}</div>
        </>
      ) : (
        <label><small>Kategori</small>
          <select className="in" value={f.k} onChange={(e) => set('k', e.target.value)}>{kat.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>
      )}
      <label><small>Jumlah (Rp)</small><input className="in" type="number" value={f.j} onChange={(e) => set('j', e.target.value)} /></label>
      <label><small>{mode === 'iuran' ? 'Catatan (opsional)' : 'Keterangan'}</small><input className="in" value={f.c} onChange={(e) => set('c', e.target.value)} placeholder="Misal: transfer, tunai" /></label>
      <div className="note">Setiap catatan menyimpan siapa yang input dan kapan. Tidak bisa dihapus diam-diam.</div>
      <button className="btn" onClick={simpan}>{mode === 'iuran' ? 'Simpan pembayaran' : 'Simpan pengeluaran'}</button>
      {msg && <p className="mut">{msg}</p>}
    </>
  );
}

export default function Page() {
  return <Shell title="Catat" only={['bendahara']}>{() => <Catat />}</Shell>;
}
