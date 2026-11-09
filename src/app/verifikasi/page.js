'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb, rp, lb } from '../../lib/supabase';

function Verifikasi() {
  const [d, setD] = useState(null);
  const [tolak, setTolak] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: rows } = await sb.from('iuran')
      .select('id,anggota_id,bulan,nominal,metode,bukti_path,dikirim_at')
      .eq('status', 'menunggu_verifikasi')
      .order('dikirim_at', { ascending: true });
    const list = rows || [];
    const ids = [...new Set(list.map((x) => x.anggota_id))];
    const { data: ppl } = ids.length ? await sb.from('profiles').select('id,nama').in('id', ids) : { data: [] };
    const nama = Object.fromEntries((ppl || []).map((p) => [p.id, p.nama]));
    const lengkap = await Promise.all(list.map(async (x) => {
      let url = null;
      if (x.bukti_path) {
        const s = await sb.storage.from('bukti').createSignedUrl(x.bukti_path, 3600);
        url = s.data?.signedUrl || null;
      }
      return { ...x, nama: nama[x.anggota_id] || '?', url };
    }));
    setD(lengkap);
  };
  useEffect(() => { load(); }, []);

  async function ubah(id, patch) {
    setBusy(true); setMsg('');
    const { error } = await sb.from('iuran').update(patch).eq('id', id);
    setBusy(false);
    if (error) return setMsg(error.message);
    setTolak(null); setAlasan('');
    setMsg(patch.status === 'lunas' ? 'Disetujui, tercatat lunas ✓' : 'Bukti ditolak ✓');
    load();
  }

  if (!d) return <p className="mut">Memuat…</p>;
  return (
    <>
      <small>Periksa bukti dari anggota, lalu setujui atau tolak.</small>
      {msg && <div className="note">{msg}</div>}
      {!d.length && <p className="mut">Tidak ada bukti yang menunggu verifikasi.</p>}
      {d.map((x) => (
        <div className="card" key={x.id} style={{ marginTop: 12 }}>
          <div className="spread">
            <div><b style={{ display: 'block' }}>{x.nama}</b><small>Iuran {lb(x.bulan)} {x.bulan.slice(0, 4)} · {x.metode}</small></div>
            <b>{rp(x.nominal)}</b>
          </div>
          {x.url
            ? <a href={x.url} target="_blank" rel="noreferrer"><img src={x.url} alt={'Bukti ' + x.nama} style={{ width: '100%', borderRadius: 12, marginTop: 10 }} /></a>
            : <p className="mut">Foto bukti tidak bisa dimuat.</p>}
          {tolak === x.id ? (
            <>
              <label><small>Alasan penolakan</small>
                <input className="in" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Misal: foto buram, nominal tidak sesuai" /></label>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn pink s" disabled={busy || !alasan.trim()} onClick={() => ubah(x.id, { status: 'ditolak', catatan: alasan.trim() })}>Tolak bukti</button>
                <button className="btn s" disabled={busy} onClick={() => { setTolak(null); setAlasan(''); }}>Batal</button>
              </div>
            </>
          ) : (
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button className="btn y s" disabled={busy} onClick={() => ubah(x.id, { status: 'lunas', catatan: null })}>Setujui</button>
              <button className="btn pink s" disabled={busy} onClick={() => setTolak(x.id)}>Tolak</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default function Page() {
  return <Shell title="Verifikasi" only={['bendahara']}>{() => <Verifikasi />}</Shell>;
}
