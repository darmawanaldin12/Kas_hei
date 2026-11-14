'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../../components/Shell';
import Memuat from '../../components/Memuat';
import Sukses from '../../components/Sukses';
import Ikon from '../../components/Ikon';
import { sb, rp, ym, lb } from '../../lib/supabase';
import { siapkanFoto } from '../../lib/foto';

function Bukti({ me }) {
  const r = useRouter();
  const b = ym();
  const tgl = (s) => s ? new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB' : null;
  const [tahun, setTahun] = useState(Number(b.slice(0, 4)));
  const [nom, setNom] = useState(20000);
  const [st, setSt] = useState(null);
  const [pilih, setPilih] = useState([]);
  const [jml, setJml] = useState('');
  const [met, setMet] = useState('transfer');
  const [file, setFile] = useState(null);
  const [fkey, setFkey] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState(null);

  const ms = Array.from({ length: 12 }, (_, i) => `${tahun}-${String(i + 1).padStart(2, '0')}-01`);
  const nm = (m) => lb(m) + (m.slice(0, 4) !== String(tahun) ? " '" + m.slice(2, 4) : '');
  const full = (m) => lb(m) + ' ' + m.slice(0, 4);

  const load = async () => {
    const [s, i] = await Promise.all([
      sb.from('pengaturan').select('iuran_nominal').single(),
      sb.from('iuran').select('bulan,status,catatan,diverifikasi_at').eq('anggota_id', me.id)
        .gte('bulan', ms[0]).lte('bulan', ms[11]),
    ]);
    const n = s.data?.iuran_nominal || 20000;
    setNom(n);
    const m = {};
    (i.data || []).forEach((x) => { m[x.bulan] = x; });
    setSt(m);
    return { m, n };
  };

  useEffect(() => {
    load().then(({ m, n }) => {
      if (tahun !== Number(b.slice(0, 4))) return;
      const x = m[b];
      if (!x || x.status === 'ditolak') { setPilih([b]); setJml(String(n)); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahun]);

  const bisa = (m) => !st[m] || st[m].status === 'ditolak';

  const toggle = (m) => {
    if (!bisa(m)) return;
    const n = pilih.includes(m) ? pilih.filter((x) => x !== m) : [...pilih, m];
    setPilih(n);
    setJml(n.length ? String(nom * n.length) : '');
  };

  const ketik = (v) => {
    const dig = v.replace(/\D/g, '');
    setJml(dig);
    const n = Math.floor(Number(dig || 0) / nom);
    setPilih(ms.filter(bisa).slice(0, n));
  };

  const pilihSemua = () => {
    const n = ms.filter(bisa);
    setPilih(n);
    setJml(n.length ? String(nom * n.length) : '');
  };

  const kosongkan = () => { setPilih([]); setJml(''); };

  const angka = Number(jml || 0);
  const cocok = pilih.length > 0 && angka === nom * pilih.length;

  async function kirim() {
    if (!pilih.length) return setMsg('Pilih minimal satu bulan');
    if (!cocok) return setMsg('Jumlah transfer harus sama dengan jumlah bulan yang dicentang');
    if (!file) return setMsg('Pilih foto bukti dulu');
    setBusy(true); setMsg('Menyiapkan foto…');
    const foto = await siapkanFoto(file);
    setMsg('Mengirim…');
    const path = `${me.id}/${Date.now()}-${foto.name.replace(/[^\w.]/g, '_')}`;
    const u = await sb.storage.from('bukti').upload(path, foto, { contentType: foto.type || undefined });
    if (u.error) { setBusy(false); return setMsg(u.error.message); }
    const now = new Date().toISOString();
    const rows = [...pilih].sort().map((bulan) => ({
      anggota_id: me.id, bulan, nominal: nom, metode: met, bukti_path: path,
      status: 'menunggu_verifikasi', catatan: null, dikirim_at: now,
    }));
    const res = await sb.from('iuran').upsert(rows, { onConflict: 'anggota_id,bulan' });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    setMsg('');
    setSukses({
      judul: 'Bukti terkirim',
      sub: 'Tinggal tunggu bendahara memeriksa',
      rincian: [['Bulan', rows.map((x) => full(x.bulan)).join(', ')], ['Metode', met], ['Status', 'Menunggu verifikasi'], ['Total', rp(nom * rows.length), true]],
    });
    setFile(null); setFkey((k) => k + 1); setPilih([]); setJml(''); load();
  }

  if (!st) return <Memuat />;
  const ditolak = Object.values(st).filter((x) => x.status === 'ditolak' && x.catatan);
  const bebas = ms.filter(bisa).length;

  return (
    <>
      {sukses && (
        <Sukses
          judul={sukses.judul} sub={sukses.sub} rincian={sukses.rincian}
          tombol={[
            { teks: 'Selesai', klik: () => r.push('/') },
            { teks: 'Kirim lagi', kelas: 'y', klik: () => setSukses(null) },
          ]}
        />
      )}
      <small>Wajib dikirim setelah bayar iuran. Bayar beberapa bulan sekaligus? Ketik jumlah transfernya atau centang bulannya, cukup satu foto bukti.</small>

      <small style={{ display: 'block', marginTop: 14 }}>Pilih bulan yang dibayar ({rp(nom)} per bulan)</small>

      <div className="tahun-nav">
        <button className="btn" onClick={() => setTahun(tahun - 1)}>&lt;</button>
        <div className="btn lbl">{tahun}</div>
        <button className="btn" disabled={tahun >= Number(b.slice(0, 4))} onClick={() => setTahun(tahun + 1)}>&gt;</button>
      </div>

      <div className="bulan-grid">
        {ms.map((m) => {
          const x = st[m];
          if (x && x.status === 'lunas') return <span key={m} className="tag lunas">{nm(m)} ✓</span>;
          if (x && x.status === 'menunggu_verifikasi') return <span key={m} className="tag tunggu">{nm(m)} …</span>;
          const on = pilih.includes(m);
          return (
            <span key={m} role="button" tabIndex={0} onClick={() => toggle(m)}
              onKeyDown={(e) => { if (e.key === 'Enter') toggle(m); }}
              className={'tag' + (on ? ' pilih' : '')}
              style={{ cursor: 'pointer' }}>
              {on ? <Ikon name="kotak-centang" tebal={3} /> : <Ikon name="kotak" tebal={3} />} {nm(m)}
            </span>
          );
        })}
      </div>
      <small style={{ display: 'block', marginTop: 6 }}><Ikon name="centang" /> lunas · … menunggu verifikasi · <Ikon name="kotak" /> belum, bisa dipilih</small>

      <div className="pilih-cepat">
        <button onClick={pilihSemua}>Pilih semua belum lunas</button>
        <button onClick={kosongkan}>Kosongkan</button>
      </div>

      <div className="ringkas">
        <div>
          <small>Bulan dipilih</small>
          <b>{pilih.length} bulan</b>
        </div>
        <div className="kanan">
          <small>Total</small>
          <b>{rp(nom * pilih.length)}</b>
        </div>
      </div>

      {ditolak.map((x) => <div className="note bad" key={x.bulan}>Ditolak {nm(x.bulan)}{x.diverifikasi_at ? ' · ' + tgl(x.diverifikasi_at) : ''}: {x.catatan}</div>)}

      <label style={{ display: 'block' }}><small>Total yang ditransfer</small>
        <input className="in" inputMode="numeric" placeholder="Rp 0"
          value={jml ? 'Rp ' + Number(jml).toLocaleString('id-ID') : ''}
          onChange={(e) => ketik(e.target.value)} /></label>
      <small style={{ display: 'block' }}>
        {pilih.length ? pilih.length + ' bulan: ' + [...pilih].sort().map(full).join(', ') : 'Ketik jumlahnya (misal 60000 = 3 bulan) atau centang bulan di atas.'}
      </small>
      {angka > 0 && !cocok && (
        <div className="note bad" style={{ marginTop: 10 }}>
          {angka < nom
            ? 'Jumlah kurang dari iuran satu bulan (' + rp(nom) + ').'
            : angka % nom !== 0
              ? 'Jumlah harus kelipatan ' + rp(nom) + '.'
              : 'Hanya ' + bebas + ' bulan yang bisa dipilih di ' + tahun + ' (maksimal ' + rp(nom * bebas) + ').'}
        </div>
      )}

      <small style={{ display: 'block', marginTop: 12 }}>Metode bayar</small>
      <div className="seg">{['transfer', 'tunai'].map((m) => <button key={m} className={met === m ? 'on' : ''} onClick={() => setMet(m)}>{m}</button>)}</div>
      <label><small>Foto / screenshot bukti</small>
        <input key={fkey} className="in" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      <div className="note">Bendahara akan memeriksa bukti. Setelah disetujui, status tiap bulan berubah jadi LUNAS.</div>
      <button className="btn" disabled={busy || !cocok} onClick={kirim}>Kirim bukti</button>
      {msg && <p className="mut">{msg}</p>}
    </>
  );
}

export default function Page() {
  return <Shell title="Kirim bukti" only={['anggota', 'ketua']}>{(me) => <Bukti me={me} />}</Shell>;
}
