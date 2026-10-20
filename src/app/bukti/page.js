'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, rp, ym, lb } from '../../lib/supabase';

function Bukti({ me }) {
  const b = ym();
  const [nom, setNom] = useState(20000);
  const [st, setSt] = useState(null);
  const [met, setMet] = useState('transfer');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [s, i] = await Promise.all([
      sb.from('pengaturan').select('iuran_nominal').single(),
      sb.from('iuran').select('status,catatan').eq('anggota_id', me.id).eq('bulan', b).maybeSingle(),
    ]);
    setNom(s.data?.iuran_nominal || 20000); setSt(i.data);
  };
  useEffect(() => { load(); }, []);

  async function kirim() {
    if (!file) return setMsg('Pilih foto bukti dulu');
    setMsg('Mengirim…');
    const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`;
    const u = await sb.storage.from('bukti').upload(path, file);
    if (u.error) return setMsg(u.error.message);
    const r = await sb.from('iuran').upsert({ anggota_id: me.id, bulan: b, nominal: nom, metode: met, bukti_path: path, status: 'menunggu_verifikasi' }, { onConflict: 'anggota_id,bulan' });
    setMsg(r.error ? r.error.message : 'Terkirim. Tunggu verifikasi bendahara.');
    setFile(null); load();
  }

  const tag = !st ? ['p', 'Belum ada bukti'] : st.status === 'lunas' ? ['g', 'Lunas'] : st.status === 'ditolak' ? ['p', 'Ditolak'] : ['y', 'Menunggu verifikasi'];
  return (
    <>
      <small>Wajib dikirim setelah bayar iuran.</small>
      <div className="card spread" style={{ marginTop: 12 }}>
        <div><small>Iuran {lb(b)} {b.slice(0, 4)}</small><div className="big" style={{ margin: 0, fontSize: 24 }}>{rp(nom)}</div></div>
        <span className={'tag ' + tag[0]}>{tag[1]}</span>
      </div>
      {st?.status === 'ditolak' && st.catatan && <div className="note" style={{ background: '#ff6b9d' }}>{st.catatan}</div>}
      <small>Metode bayar</small>
      <div className="seg">{['transfer', 'tunai'].map((m) => <button key={m} className={met === m ? 'on' : ''} onClick={() => setMet(m)}>{m}</button>)}</div>
      <label><small>Foto / screenshot bukti</small>
        <input className="in" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      <div className="note">Bendahara akan memeriksa bukti. Setelah disetujui, status berubah jadi LUNAS.</div>
      <button className="btn" disabled={st?.status === 'lunas'} onClick={kirim}>Kirim bukti</button>
      {msg && <p className="mut">{msg}</p>}
    </>
  );
}

export default function Page() {
  return <Shell title="Kirim bukti" only={['anggota']}>{(me) => <Bukti me={me} />}</Shell>;
}
