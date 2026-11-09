'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, rp, ym, addM, lb } from '../../lib/supabase';

function Bukti({ me }) {
  const b = ym();
  const ms = [-5, -4, -3, -2, -1, 0, 1, 2].map((i) => addM(b, i));
  const nm = (m) => lb(m) + (m.slice(0, 4) !== b.slice(0, 4) ? " '" + m.slice(2, 4) : '');
  const kuning = { background: '#FDE068' };
  const [nom, setNom] = useState(20000);
  const [st, setSt] = useState(null);
  const [pilih, setPilih] = useState([]);
  const [jml, setJml] = useState('');
  const [met, setMet] = useState('transfer');
  const [file, setFile] = useState(null);
  const [fkey, setFkey] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [s, i] = await Promise.all([
      sb.from('pengaturan').select('iuran_nominal').single(),
      sb.from('iuran').select('bulan,status,catatan').eq('anggota_id', me.id).gte('bulan', ms[0]).lte('bulan', ms[ms.length - 1]),
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
      const x = m[b];
      if (!x || x.status === 'ditolak') { setPilih([b]); setJml(String(n)); }
    });
  }, []);

  const bisa = (m) => !st[m] || st[m].status === 'ditolak';

  // Ketuk bulan -> jumlah transfer ikut berubah
  const toggle = (m) => {
    const n = pilih.includes(m) ? pilih.filter((x) => x !== m) : [...pilih, m];
    setPilih(n);
    setJml(n.length ? String(nom * n.length) : '');
  };

  // Ketik jumlah transfer -> bulan terpilih otomatis (dari bulan tertunggak paling lama)
  const ketik = (v) => {
    const dig = v.replace(/\D/g, '');
    setJml(dig);
    const n = Math.floor(Number(dig || 0) / nom);
    setPilih(ms.filter(bisa).slice(0, n));
  };

  const angka = Number(jml || 0);
  const cocok = pilih.length > 0 && angka === nom * pilih.length;

  async function kirim() {
    if (!pilih.length) return setMsg('Pilih minimal satu bulan');
    if (!cocok) return setMsg('Jumlah transfer harus sama dengan jumlah bulan yang dicentang');
    if (!file) return setMsg('Pilih foto bukti dulu');
    setBusy(true); setMsg('Mengirim…');
    const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
    const u = await sb.storage.from('bukti').upload(path, file);
    if (u.error) { setBusy(false); return setMsg(u.error.message); }
    const now = new Date().toISOString();
    const rows = [...pilih].sort().map((bulan) => ({
      anggota_id: me.id, bulan, nominal: nom, metode: met, bukti_path: path,
      status: 'menunggu_verifikasi', catatan: null, dikirim_at: now,
    }));
    const r = await sb.from('iuran').upsert(rows, { onConflict: 'anggota_id,bulan' });
    setBusy(false);
    if (r.error) return setMsg(r.error.message);
    setMsg('Terkirim untuk ' + rows.length + ' bulan. Tunggu verifikasi bendahara.');
    setFile(null); setFkey((k) => k + 1); setPilih([]); setJml(''); load();
  }

  if (!st) return <p className="mut">Memuat…</p>;
  const ditolak = Object.values(st).filter((x) => x.status === 'ditolak' && x.catatan);
  const bebas = ms.filter(bisa).length;
  return (
    <>
      <small>Wajib dikirim setelah bayar iuran. Bayar beberapa bulan sekaligus? Ketik jumlah transfernya atau centang bulannya, cukup satu foto bukti.</small>
      <small style={{ display: 'block', marginTop: 12 }}>Pilih bulan yang dibayar ({rp(nom)} per bulan)</small>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 6 }}>
        {ms.map((m) => {
          const x = st[m];
          if (x && x.status === 'lunas') return <span key={m} className="tag g" style={{ textAlign: 'center' }}>{nm(m)} ✓</span>;
          if (x && x.status === 'menunggu_verifikasi') return <span key={m} className="tag" style={{ textAlign: 'center', ...kuning }}>{nm(m)} …</span>;
          const on = pilih.includes(m);
          return (
            <span key={m} role="button" tabIndex={0} onClick={() => toggle(m)} onKeyDown={(e) => { if (e.key === 'Enter') toggle(m); }}
              className="tag p" style={{ textAlign: 'center', cursor: 'pointer', ...(on ? { background: '#1a1a2e', color: '#fff' } : {}) }}>
              {on ? '☑' : '☐'} {nm(m)}
            </span>
          );
        })}
      </div>
      <small style={{ display: 'block', marginTop: 6 }}>✓ lunas · … menunggu verifikasi · ☐ belum, bisa dipilih</small>
      {ditolak.map((x) => <div className="note bad" key={x.bulan}>Ditolak {nm(x.bulan)}: {x.catatan}</div>)}

      <label style={{ display: 'block', marginTop: 12 }}><small>Total yang ditransfer</small>
        <input className="in" inputMode="numeric" placeholder="Rp 0"
          value={jml ? 'Rp ' + Number(jml).toLocaleString('id-ID') : ''}
          onChange={(e) => ketik(e.target.value)} /></label>
      <small style={{ display: 'block' }}>
        {pilih.length ? pilih.length + ' bulan: ' + [...pilih].sort().map(nm).join(', ') : 'Ketik jumlahnya (misal 60000 = 3 bulan) atau centang bulan di atas.'}
      </small>
      {angka > 0 && !cocok && (
        <div className="note bad">
          {angka < nom
            ? 'Jumlah kurang dari iuran satu bulan (' + rp(nom) + ').'
            : angka % nom !== 0
              ? 'Jumlah harus kelipatan ' + rp(nom) + '.'
              : 'Hanya ' + bebas + ' bulan yang bisa dipilih (maksimal ' + rp(nom * bebas) + ').'}
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
  return <Shell title="Kirim bukti" only={['anggota']}>{(me) => <Bukti me={me} />}</Shell>;
}
