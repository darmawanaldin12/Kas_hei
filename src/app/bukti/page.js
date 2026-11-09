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
    setNom(s.data?.iuran_nominal || 20000);
    const m = {};
    (i.data || []).forEach((x) => { m[x.bulan] = x; });
    setSt(m);
    return m;
  };
  useEffect(() => {
    load().then((m) => { const x = m[b]; if (!x || x.status === 'ditolak') setPilih([b]); });
  }, []);

  const bisa = (m) => !st[m] || st[m].status === 'ditolak';
  const toggle = (m) => setPilih((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  async function kirim() {
    if (!pilih.length) return setMsg('Pilih minimal satu bulan');
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
    setFile(null); setFkey((k) => k + 1); setPilih([]); load();
  }

  if (!st) return <p className="mut">Memuat…</p>;
  const ditolak = Object.values(st).filter((x) => x.status === 'ditolak' && x.catatan);
  return (
    <>
      <small>Wajib dikirim setelah bayar iuran. Bayar beberapa bulan sekaligus? Centang semua bulannya, cukup satu foto bukti.</small>
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
      <div className="card spread" style={{ marginTop: 12 }}>
        <div><small>Total yang ditransfer ({pilih.length} bulan)</small><div className="big" style={{ margin: 0, fontSize: 24 }}>{rp(nom * pilih.length)}</div></div>
      </div>
      <small>Metode bayar</small>
      <div className="seg">{['transfer', 'tunai'].map((m) => <button key={m} className={met === m ? 'on' : ''} onClick={() => setMet(m)}>{m}</button>)}</div>
      <label><small>Foto / screenshot bukti</small>
        <input key={fkey} className="in" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      <div className="note">Bendahara akan memeriksa bukti. Setelah disetujui, status tiap bulan berubah jadi LUNAS.</div>
      <button className="btn" disabled={busy || !pilih.length} onClick={kirim}>Kirim bukti</button>
      {msg && <p className="mut">{msg}</p>}
    </>
  );
}

export default function Page() {
  return <Shell title="Kirim bukti" only={['anggota']}>{(me) => <Bukti me={me} />}</Shell>;
}
