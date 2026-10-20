'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { sb } from '../../lib/supabase';

const kosong = { nama: '', nama_login: '', email_pengingat: '', password: '', role: 'anggota', mulai: '' };

function Anggota({ me }) {
  const [l, setL] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(kosong);
  const [msg, setMsg] = useState('');

  const load = () => sb.from('profiles').select('id,nama,nama_login,role').eq('aktif', true).order('nama').then((x) => setL(x.data || []));
  useEffect(() => { load(); }, []);

  async function tambah() {
    setMsg('Menyimpan…');
    const { data: { session } } = await sb.auth.getSession();
    const body = { ...f, mulai_bulan: f.mulai ? f.mulai + '-01' : undefined };
    const r = await fetch('/api/anggota', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) });
    const j = await r.json();
    setMsg(r.ok ? 'Anggota ditambahkan ✓' : j.error);
    if (r.ok) { setF(kosong); load(); }
  }
  async function hapus(id) {
    if (!confirm('Nonaktifkan anggota ini? Riwayat tetap utuh.')) return;
    await sb.from('profiles').update({ aktif: false }).eq('id', id); load();
  }
  const set = (k, v) => setF({ ...f, [k]: v });

  return (
    <>
      <button className="btn" onClick={() => setOpen(!open)}>+ Tambah anggota</button>
      {open && (
        <div className="card" style={{ marginTop: 14 }}>
          <label><small>Nama lengkap</small><input className="in" value={f.nama} onChange={(e) => set('nama', e.target.value)} /></label>
          <label><small>Nama login (huruf kecil, tanpa spasi)</small><input className="in" autoCapitalize="none" value={f.nama_login} onChange={(e) => set('nama_login', e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="mis. budi" /></label>
          <label><small>Email (untuk pengingat)</small><input className="in" type="email" value={f.email_pengingat} onChange={(e) => set('email_pengingat', e.target.value)} /></label>
          <label><small>Kata sandi (anggota: NIK, min. 6)</small><input className="in" value={f.password} onChange={(e) => set('password', e.target.value)} /></label>
          <label><small>Mulai iuran dari bulan (kosong = bulan ini)</small><input className="in" type="month" value={f.mulai} onChange={(e) => set('mulai', e.target.value)} /></label>
          <label><small>Peran</small><select className="in" value={f.role} onChange={(e) => set('role', e.target.value)}><option value="anggota">Anggota</option><option value="bendahara">Bendahara</option><option value="ketua">Ketua</option></select></label>
          <button className="btn" onClick={tambah}>Simpan</button>
          {msg && <p className="mut">{msg}</p>}
        </div>
      )}
      <small className="h">{l.length} anggota</small>
      {l.map((x) => (
        <div className="card row" key={x.id}>
          <span className="av s">{x.nama[0]}</span>
          <div style={{ flex: 1 }}>
            <b style={{ display: 'block' }}>{x.nama}</b>
            <span className={'tag ' + (x.role === 'ketua' ? 'y' : x.role === 'bendahara' ? 'p' : '')}>{x.role}</span>
            {x.nama_login && <small className="mut" style={{ marginLeft: 8 }}>@{x.nama_login}</small>}
          </div>
          {x.id !== me.id && <button className="btn pink s" onClick={() => hapus(x.id)}>Hapus</button>}
        </div>
      ))}
    </>
  );
}

export default function Page() {
  return <Shell title="Anggota" only={['ketua']}>{(me) => <Anggota me={me} />}</Shell>;
}
