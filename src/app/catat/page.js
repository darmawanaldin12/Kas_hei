'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import { sb, rp, ym, addM, lb } from '../../lib/supabase';

function Catat({ me }) {
  const b = ym();
  const ms = Array.from({ length: 12 }, (_, i) => addM(b, i - 8));
  const nm = (m) => lb(m) + (m.slice(0, 4) !== b.slice(0, 4) ? " '" + m.slice(2, 4) : '');
  const kuning = { background: '#FDE068' };

  const [mode, setMode] = useState('iuran');
  const [ready, setReady] = useState(false);
  const [ang, setAng] = useState([]);
  const [kat, setKat] = useState([]);
  const [nom, setNom] = useState(20000);
  const [aId, setAId] = useState('');
  const [st, setSt] = useState({});
  const [pilih, setPilih] = useState([]);
  const [met, setMet] = useState('transfer');
  const [file, setFile] = useState(null);
  const [fkey, setFkey] = useState(0);
  const [c, setC] = useState('');
  const [k, setK] = useState('');
  const [jk, setJk] = useState('');
  const [ver, setVer] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, kt, s] = await Promise.all([
        sb.from('profiles').select('id,nama').eq('aktif', true).order('nama'),
        sb.from('kategori_kas').select('id,nama').eq('jenis', 'keluar'),
        sb.from('pengaturan').select('iuran_nominal').single(),
      ]);
      setAng(p.data || []); setKat(kt.data || []);
      setNom(s.data?.iuran_nominal || 20000);
      setAId(p.data?.[0]?.id || ''); setK(kt.data?.[0]?.id || '');
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!aId) return;
    (async () => {
      const { data } = await sb.from('iuran').select('bulan,status').eq('anggota_id', aId).gte('bulan', ms[0]).lte('bulan', ms[ms.length - 1]);
      const m = {};
      (data || []).forEach((x) => { m[x.bulan] = x.status; });
      setSt(m);
      setPilih((p) => p.filter((x) => !m[x] || m[x] === 'ditolak'));
    })();
  }, [aId, ver]);

  const bisa = (m) => !st[m] || st[m] === 'ditolak';
  const toggle = (m) => setPilih((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  async function simpanIuran() {
    if (!aId) return setMsg('Pilih anggota dulu');
    if (!pilih.length) return setMsg('Pilih minimal satu bulan');
    if (!file) return setMsg('Foto bukti wajib diunggah');
    setBusy(true); setMsg('Menyimpan…');
    const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
    const u = await sb.storage.from('bukti').upload(path, file);
    if (u.error) { setBusy(false); return setMsg(u.error.message); }
    const now = new Date().toISOString();
    const rows = [...pilih].sort().map((bulan) => ({
      anggota_id: aId, bulan, nominal: nom, metode: met, bukti_path: path,
      status: 'lunas', catatan: c || null, dikirim_at: now,
    }));
    const r = await sb.from('iuran').upsert(rows, { onConflict: 'anggota_id,bulan' });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    setMsg('Tersimpan ✓ ' + rows.length + ' bulan, total ' + rp(nom * rows.length));
    setPilih([]); setFile(null); setFkey((v) => v + 1); setC(''); setVer((v) => v + 1);
  }

  async function simpanKeluar() {
    if (!(+jk > 0)) return setMsg('Isi jumlah pengeluaran');
    setBusy(true); setMsg('Menyimpan…');
    const r = await sb.from('kas_transaksi').insert({ jenis: 'keluar', kategori_id: k || null, jumlah: +jk, keterangan: c || null });
    setBusy(false);
    setMsg(r.error ? r.error.message : 'Tersimpan ✓');
    if (!r.error) { setJk(''); setC(''); }
  }

  if (!ready) return <Memuat />;
  return (
    <>
      <div className="seg">
        <button className={mode === 'iuran' ? 'on' : ''} onClick={() => { setMode('iuran'); setMsg(''); }}>Iuran masuk</button>
        <button className={mode === 'keluar' ? 'on' : ''} onClick={() => { setMode('keluar'); setMsg(''); }}>Pengeluaran</button>
      </div>
      <small>Khusus bendahara. Langsung tercatat dan terekam.</small>
      <div style={{ height: 12 }} />
      {mode === 'iuran' ? (
        <>
          <label><small>Anggota</small>
            <select className="in" value={aId} onChange={(e) => { setAId(e.target.value); setPilih([]); }}>{ang.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>
          <small>Bulan (bisa pilih lebih dari satu)</small>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '6px 0 6px' }}>
            {ms.map((m) => {
              const s = st[m];
              if (s === 'lunas') return <span key={m} className="tag g" style={{ textAlign: 'center' }}>{nm(m)} ✓</span>;
              if (s === 'menunggu_verifikasi') return <span key={m} className="tag" style={{ textAlign: 'center', ...kuning }}>{nm(m)} …</span>;
              const on = pilih.includes(m);
              return (
                <span key={m} role="button" tabIndex={0} onClick={() => toggle(m)} onKeyDown={(e) => { if (e.key === 'Enter') toggle(m); }}
                  className="tag p" style={{ textAlign: 'center', cursor: 'pointer', ...(on ? { background: '#1a1a2e', color: '#fff' } : {}) }}>
                  {on ? '\u2611' : '\u2610'} {nm(m)}
                </span>
              );
            })}
          </div>
          <small style={{ display: 'block', marginBottom: 12 }}>✓ lunas · … menunggu verifikasi (setujui di menu Verifikasi) · ☐ belum, bisa dipilih</small>
          <label><small>Jumlah (otomatis dari bulan yang dipilih)</small>
            <input className="in" readOnly placeholder="Rp 0" value={pilih.length ? rp(nom * pilih.length) : ''} /></label>
          <small style={{ display: 'block', marginBottom: 12 }}>{pilih.length ? pilih.length + ' bulan \u00d7 ' + rp(nom) + ': ' + [...pilih].sort().map(nm).join(', ') : rp(nom) + ' per bulan'}</small>
          <small>Metode bayar</small>
          <div className="seg">{['transfer', 'tunai'].map((m) => <button key={m} className={met === m ? 'on' : ''} onClick={() => setMet(m)}>{m}</button>)}</div>
          <label><small>Foto / screenshot bukti (wajib)</small>
            <input key={fkey} className="in" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          <label><small>Catatan (opsional)</small><input className="in" value={c} onChange={(e) => setC(e.target.value)} placeholder="Misal: transfer, tunai" /></label>
          <div className="note">Setiap catatan menyimpan siapa yang input dan kapan. Tidak bisa dihapus diam-diam.</div>
          <button className="btn" disabled={busy || !pilih.length || !file} onClick={simpanIuran}>Simpan pembayaran</button>
        </>
      ) : (
        <>
          <label><small>Kategori</small>
            <select className="in" value={k} onChange={(e) => setK(e.target.value)}>{kat.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}</select></label>
          <label><small>Jumlah (Rp)</small><input className="in" type="number" inputMode="numeric" value={jk} onChange={(e) => setJk(e.target.value)} /></label>
          <label><small>Keterangan</small><input className="in" value={c} onChange={(e) => setC(e.target.value)} placeholder="Misal: beli kertas HVS" /></label>
          <div className="note">Setiap catatan menyimpan siapa yang input dan kapan. Tidak bisa dihapus diam-diam.</div>
          <button className="btn" disabled={busy} onClick={simpanKeluar}>Simpan pengeluaran</button>
        </>
      )}
      {msg && <p className="mut">{msg}</p>}
    </>
  );
}

export default function Page() {
  return <Shell title="Catat" only={['bendahara']}>{(me) => <Catat me={me} />}</Shell>;
}
