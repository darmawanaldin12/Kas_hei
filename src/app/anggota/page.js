'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import Modal from '../../components/Modal';
import { sb } from '../../lib/supabase';

const kosong = { nama: '', nama_login: '', email_pengingat: '', password: '', role: 'anggota', mulai: '' };

function Anggota({ me }) {
  const [l, setL] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(kosong);
  const [msg, setMsg] = useState('');
  const [uji, setUji] = useState({ id: '', t: '', bad: false });
  const [reset, setReset] = useState(null);
  const [sandiBaru, setSandiBaru] = useState('');
  const [pesanReset, setPesanReset] = useState('');
  const [busyReset, setBusyReset] = useState(false);
  const [suksesReset, setSuksesReset] = useState(false);

  const load = () => sb.from('profiles').select('id,nama,nama_login,role,email_pengingat').eq('aktif', true).order('nama').then((x) => setL(x.data || []));
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
  async function ujiEmail(x) {
    setUji({ id: x.id, t: 'Mengirim…', bad: false });
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch('/api/pengingat-uji', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ anggota_id: x.id }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setUji({ id: x.id, t: j.error || 'Gagal mengirim', bad: true });
    setUji({ id: x.id, t: 'Terkirim ke ' + j.ke + (j.uji ? ' (email uji, tidak ada tunggakan)' : ' (' + j.bulan + ' bulan tunggakan)'), bad: false });
  }
  const set = (k, v) => setF({ ...f, [k]: v });

  function bukaReset(x) {
    setReset(x);
    setSandiBaru('');
    setPesanReset('');
    setSuksesReset(false);
  }
  function tutupReset() {
    setReset(null);
    setSandiBaru('');
    setPesanReset('');
    setSuksesReset(false);
  }
  async function simpanReset() {
    if (!reset || sandiBaru.length < 6) return;
    setBusyReset(true);
    setPesanReset('');
    const { data: { session } } = await sb.auth.getSession();
    const r = await fetch('/api/reset-sandi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ anggota_id: reset.id, password: sandiBaru }),
    });
    const j = await r.json().catch(() => ({}));
    setBusyReset(false);
    if (!r.ok) return setPesanReset(j.error || 'Gagal mengganti sandi');
    setSuksesReset(true);
    setSandiBaru('');
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(!open)}>+ Tambah anggota</button>
      {open && (
        <div className="card" style={{ marginTop: 14 }}>
          <label><small>Nama lengkap</small><input className="in" value={f.nama} onChange={(e) => set('nama', e.target.value)} /></label>
          <label><small>Nama login (huruf kecil, tanpa spasi)</small><input className="in" autoCapitalize="none" value={f.nama_login} onChange={(e) => set('nama_login', e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="mis. budi" /></label>
          <label><small>Email untuk pengingat (opsional)</small><input className="in" type="email" value={f.email_pengingat} onChange={(e) => set('email_pengingat', e.target.value)} /></label>
          <label><small>Kata sandi (anggota: NIK, min. 6)</small><input className="in" value={f.password} onChange={(e) => set('password', e.target.value)} /></label>
          <label><small>Mulai iuran dari bulan (kosong = bulan ini)</small><input className="in" type="month" value={f.mulai} onChange={(e) => set('mulai', e.target.value)} /></label>
          <label><small>Peran</small><select className="in" value={f.role} onChange={(e) => set('role', e.target.value)}><option value="anggota">Anggota</option><option value="bendahara">Bendahara</option><option value="ketua">Ketua</option></select></label>
          <button className="btn" onClick={tambah}>Simpan</button>
          {msg && <p className="mut">{msg}</p>}
        </div>
      )}
      <small className="h">{l.length} anggota</small>
      {l.map((x) => (
        <div className="card" key={x.id}>
          <div className="row" style={{ marginBottom: 0 }}>
            <span className="av s">{x.nama[0]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block' }}>{x.nama}</b>
              <span className={'tag ' + (x.role === 'ketua' ? 'y' : x.role === 'bendahara' ? 'p' : '')}>{x.role}</span>
              {x.nama_login && <small className="mut" style={{ marginLeft: 8 }}>@{x.nama_login}</small>}
            </div>
          </div>
          {(x.email_pengingat || x.id === me.id || x.role !== 'ketua') && (
            <div className="aksi-anggota">
              {x.email_pengingat && <button className="btn y s" disabled={uji.id === x.id && uji.t === 'Mengirim…'} onClick={() => ujiEmail(x)}>Uji email</button>}
              {(x.id === me.id || x.role !== 'ketua') && <button className="btn lilac s" onClick={() => bukaReset(x)}>Reset sandi</button>}
              {x.id !== me.id && <button className="btn pink s" onClick={() => hapus(x.id)}>Hapus</button>}
            </div>
          )}
          {uji.id === x.id && uji.t && <div className={'note' + (uji.bad ? ' bad' : '')} style={{ marginTop: 10 }}>{uji.t}</div>}
        </div>
      ))}

      {reset && (
        <Modal judul="Reset sandi" onTutup={tutupReset}>
          <small>{reset.nama}{reset.nama_login ? ' · @' + reset.nama_login : ''}</small>
          {suksesReset ? (
            <>
              <div className="note" style={{ marginTop: 12 }}>
                Sandi {reset.nama} sudah diganti. Sampaikan sandi barunya langsung ke yang bersangkutan.
              </div>
              <button className="btn" onClick={tutupReset}>Selesai</button>
            </>
          ) : (
            <>
              <div className="note" style={{ marginTop: 12 }}>
                Sandi lama langsung tidak berlaku. Ketik sandi baru, lalu sampaikan ke yang bersangkutan.
              </div>
              <label>
                <small>Sandi baru</small>
                <input className="in" type="password" autoComplete="new-password" value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)} placeholder="Minimal 6 karakter" />
              </label>
              {reset.id === me.id && <small style={{ display: 'block', marginBottom: 12 }}>Ini akunmu sendiri. Gunakan sandi baru saat masuk berikutnya.</small>}
              {pesanReset && <div className="note bad">{pesanReset}</div>}
              <button className="btn" disabled={busyReset || sandiBaru.length < 6} onClick={simpanReset}>
                {busyReset ? 'Menyimpan…' : 'Simpan sandi baru'}
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

export default function Page() {
  return <Shell title="Anggota" only={['ketua']}>{(me) => <Anggota me={me} />}</Shell>;
}
