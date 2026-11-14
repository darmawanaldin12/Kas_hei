'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import Sukses from '../../components/Sukses';
import Ikon from '../../components/Ikon';
import { sb, rp, ym, addM, lb } from '../../lib/supabase';
import { siapkanFoto } from '../../lib/foto';

function Catat({ me }) {
  const r = useRouter();
  const b = ym();
  const ms = Array.from({ length: 12 }, (_, i) => addM(b, i - 8));
  const nm = (m) => lb(m) + (m.slice(0, 4) !== b.slice(0, 4) ? " '" + m.slice(2, 4) : '');
  const kuning = { background: 'var(--warning)' };

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
  const [met2, setMet2] = useState('transfer');
  const [file2, setFile2] = useState(null);
  const [fkey2, setFkey2] = useState(0);
  const [aId2, setAId2] = useState('');
  const [bulan2, setBulan2] = useState('');

  const [ver, setVer] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState(null);

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
    setBusy(true); setMsg('Menyiapkan foto…');
    const foto = await siapkanFoto(file);
    setMsg('Menyimpan…');
    const path = `${me.id}/${Date.now()}-${foto.name.replace(/[^\w.]/g, '_')}`;
    const u = await sb.storage.from('bukti').upload(path, foto, { contentType: foto.type || undefined });
    if (u.error) { setBusy(false); return setMsg(u.error.message); }
    const now = new Date().toISOString();
    const rows = [...pilih].sort().map((bulan) => ({
      anggota_id: aId, bulan, nominal: nom, metode: met, bukti_path: path,
      status: 'lunas', catatan: c || null, dikirim_at: now,
    }));
    const res = await sb.from('iuran').upsert(rows, { onConflict: 'anggota_id,bulan' });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    const daftar = [...pilih].sort().map(nm).join(', ');
    const nama = ang.find((x) => x.id === aId)?.nama;
    setMsg('');
    setSukses({
      judul: 'Pembayaran tersimpan',
      sub: 'Tercatat lunas dan sudah masuk ke kas',
      rincian: [['Anggota', nama], ['Bulan', daftar], ['Metode', met], ['Total', rp(nom * rows.length), true]],
    });
    setPilih([]); setFile(null); setFkey((v) => v + 1); setC(''); setVer((v) => v + 1);
  }

  async function simpanKeluar() {
    if (!(+jk > 0)) return setMsg('Isi jumlah pengeluaran');
    setBusy(true); setMsg('Menyimpan…');
    let buktiPath = null;
    if (file2) {
      const foto = await siapkanFoto(file2);
      const path = `keluar/${me.id}/${Date.now()}-${foto.name.replace(/[^\w.]/g, '_')}`;
      const u = await sb.storage.from('bukti').upload(path, foto, { contentType: foto.type || undefined });
      if (u.error) { setBusy(false); return setMsg(u.error.message); }
      buktiPath = path;
    }
    const res = await sb.from('kas_transaksi').insert({
      jenis: 'keluar',
      kategori_id: k || null,
      jumlah: +jk,
      keterangan: c || null,
      anggota_id: aId2 || null,
      bulan: bulan2 ? bulan2 + '-01' : null,
      metode: met2 || null,
      bukti_path: buktiPath,
    });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    setMsg('');
    const namaAng = ang.find((x) => x.id === aId2)?.nama;
    setSukses({
      judul: 'Pengeluaran tersimpan',
      sub: 'Sudah tercatat di kas',
      rincian: [
        ['Kategori', kat.find((x) => x.id === k)?.nama],
        namaAng ? ['Anggota', namaAng] : null,
        bulan2 ? ['Bulan', nm(bulan2 + '-01')] : null,
        ['Metode', met2],
        ['Keterangan', c],
        ['Jumlah', rp(+jk), true],
      ].filter(Boolean),
    });
    setJk(''); setC(''); setAId2(''); setBulan2(''); setFile2(null); setFkey2((v) => v + 1);
  }

  if (!ready) return <Memuat />;
  return (
    <>
      {sukses && (
        <Sukses
          judul={sukses.judul} sub={sukses.sub} rincian={sukses.rincian}
          tombol={[
            { teks: 'Selesai', klik: () => r.push('/') },
            { teks: 'Catat lagi', kelas: 'y', klik: () => setSukses(null) },
          ]}
        />
      )}
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
                  className="tag p" style={{ textAlign: 'center', cursor: 'pointer', ...(on ? { background: 'var(--ink)', color: '#fff' } : {}) }}>
                  {on ? <Ikon name="kotak-centang" tebal={3} /> : <Ikon name="kotak" tebal={3} />} {nm(m)}
                </span>
              );
            })}
          </div>
          <small style={{ display: 'block', marginBottom: 12 }}><Ikon name="centang" /> lunas · … menunggu verifikasi (setujui di menu Verifikasi) · <Ikon name="kotak" /> belum, bisa dipilih</small>
          <label><small>Jumlah (otomatis dari bulan yang dipilih)</small>
            <input className="in" readOnly placeholder="Rp 0" value={pilih.length ? rp(nom * pilih.length) : ''} /></label>
          <small style={{ display: 'block', marginBottom: 12 }}>{pilih.length ? pilih.length + ' bulan × ' + rp(nom) + ': ' + [...pilih].sort().map(nm).join(', ') : rp(nom) + ' per bulan'}</small>
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
          <label><small>Anggota (opsional)</small>
            <select className="in" value={aId2} onChange={(e) => setAId2(e.target.value)}>
              <option value="">— Tidak terkait anggota —</option>
              {ang.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
            </select></label>
          <label><small>Bulan terkait (opsional)</small>
            <input className="in" type="month" value={bulan2} onChange={(e) => setBulan2(e.target.value)} /></label>
          <label><small>Jumlah (Rp)</small><input className="in" type="number" inputMode="numeric" value={jk} onChange={(e) => setJk(e.target.value)} /></label>
          <small>Metode</small>
          <div className="seg">{['transfer', 'tunai'].map((m) => <button key={m} className={met2 === m ? 'on' : ''} onClick={() => setMet2(m)}>{m}</button>)}</div>
          <label><small>Foto / nota bukti (opsional)</small>
            <input key={fkey2} className="in" type="file" accept="image/*" onChange={(e) => setFile2(e.target.files?.[0] || null)} /></label>
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
