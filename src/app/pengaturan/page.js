'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../../components/Shell';
import { sb } from '../../lib/supabase';
import { siapkanAvatar } from '../../lib/foto';

const kunci = { background: 'var(--locked)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

function Pengaturan({ me }) {
  const r = useRouter();
  const pilihFoto = useRef(null);
  const [foto, setFoto] = useState(null);
  const [nl, setNl] = useState(me.nama_login || '');
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [mFoto, setMFoto] = useState(null);
  const [mUser, setMUser] = useState(null);
  const [mSandi, setMSandi] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!me.foto_path) return;
    sb.storage.from('profil').download(me.foto_path).then((f) => { if (f.data) setFoto(URL.createObjectURL(f.data)); });
  }, []);

  const token = async () => (await sb.auth.getSession()).data.session?.access_token;
  const panggil = async (body) => {
    const res = await fetch('/api/akun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (await token()) },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, ...j } : { ok: false, error: j.error || 'Gagal, coba lagi' };
  };

  async function gantiFoto(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy('foto'); setMFoto(null);
    const av = await siapkanAvatar(f);
    if (!av) { setBusy(''); return setMFoto({ bad: true, t: 'Foto tidak bisa dibaca. Coba foto lain.' }); }
    const path = me.id + '/' + Date.now() + '.jpg';
    const up = await sb.storage.from('profil').upload(path, av, { contentType: 'image/jpeg' });
    if (up.error) { setBusy(''); return setMFoto({ bad: true, t: up.error.message }); }
    const res = await panggil({ aksi: 'foto', path });
    setBusy('');
    if (!res.ok) return setMFoto({ bad: true, t: res.error });
    setFoto(URL.createObjectURL(av));
    setMFoto({ t: 'Foto profil disimpan' });
    setTimeout(() => window.location.reload(), 700);
  }

  async function simpanUser() {
    const v = nl.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(v)) return setMUser({ bad: true, t: 'Username 3-30 karakter: huruf kecil, angka, titik, strip, atau garis bawah' });
    setBusy('user'); setMUser(null);
    const res = await panggil({ aksi: 'username', nama_login: v });
    setBusy('');
    if (!res.ok) return setMUser({ bad: true, t: res.error });
    setNl(res.nama_login);
    setMUser({ t: 'Username disimpan. Login berikutnya pakai "' + res.nama_login + '"' });
  }

  async function simpanSandi() {
    if (!lama) return setMSandi({ bad: true, t: 'Isi kata sandi sekarang' });
    if (baru.length < 6) return setMSandi({ bad: true, t: 'Kata sandi baru minimal 6 karakter' });
    if (baru !== ulang) return setMSandi({ bad: true, t: 'Pengulangan kata sandi tidak sama' });
    if (baru === lama) return setMSandi({ bad: true, t: 'Kata sandi baru harus berbeda dari yang sekarang' });
    setBusy('sandi'); setMSandi(null);
    const { data: { user } } = await sb.auth.getUser();
    const cek = await sb.auth.signInWithPassword({ email: user?.email || '', password: lama });
    if (cek.error) { setBusy(''); return setMSandi({ bad: true, t: 'Kata sandi sekarang salah' }); }
    const { error } = await sb.auth.updateUser({ password: baru });
    setBusy('');
    if (error) return setMSandi({ bad: true, t: error.message });
    setLama(''); setBaru(''); setUlang('');
    setMSandi({ t: 'Kata sandi diganti' });
  }

  const Pesan = ({ m }) => (m ? <div className={'note' + (m.bad ? ' bad' : '')}>{m.t}</div> : null);

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="av" style={{ width: 72, height: 72, fontSize: 28, flex: 'none', overflow: 'hidden', padding: 0 }}>
            {foto
              ? <img src={foto} alt="Foto profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
              : me.nama[0]}
          </div>
          <div>
            <b style={{ display: 'block' }}>{me.nama}</b>
            <small style={{ display: 'block', marginBottom: 8 }}>Foto hanya tampil di pojok atas akunmu</small>
            <input ref={pilihFoto} type="file" accept="image/*" onChange={gantiFoto} style={{ display: 'none' }} />
            <button className="btn y s" disabled={busy === 'foto'} onClick={() => pilihFoto.current?.click()}>{busy === 'foto' ? 'Menyimpan…' : 'Ganti foto'}</button>
          </div>
        </div>
        <Pesan m={mFoto} />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <b style={{ display: 'block', marginBottom: 8 }}>Akun</b>
        <small>Nama di Grid dan Riwayat</small>
        <div className="in" style={{ ...kunci, marginTop: 4 }}><b>{me.nama}</b><span aria-hidden="true">{'🔒'}</span></div>
        <small style={{ display: 'block', marginBottom: 12 }}>Dikunci. Yang bisa mengubah hanya ketua.</small>
        <label><small>Username untuk masuk</small>
          <input className="in" autoCapitalize="none" autoCorrect="off" autoComplete="username" value={nl} onChange={(e) => setNl(e.target.value)} /></label>
        <small style={{ display: 'block', marginBottom: 10 }}>Huruf kecil, angka, titik, strip, atau garis bawah. 3–30 karakter.</small>
        <button className="btn y s" disabled={busy === 'user' || !nl.trim() || nl.trim().toLowerCase() === (me.nama_login || '')} onClick={simpanUser}>{busy === 'user' ? 'Menyimpan…' : 'Simpan username'}</button>
        <Pesan m={mUser} />
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <b style={{ display: 'block', marginBottom: 8 }}>Ganti kata sandi</b>
        <label><small>Kata sandi sekarang</small>
          <input className="in" type="password" autoComplete="current-password" value={lama} onChange={(e) => setLama(e.target.value)} /></label>
        <label><small>Kata sandi baru</small>
          <input className="in" type="password" autoComplete="new-password" value={baru} onChange={(e) => setBaru(e.target.value)} /></label>
        <label><small>Ulangi kata sandi baru</small>
          <input className="in" type="password" autoComplete="new-password" value={ulang} onChange={(e) => setUlang(e.target.value)} /></label>
        <button className="btn y s" style={{ marginTop: 10 }} disabled={busy === 'sandi'} onClick={simpanSandi}>{busy === 'sandi' ? 'Menyimpan…' : 'Simpan kata sandi'}</button>
        <Pesan m={mSandi} />
      </div>

      <button className="btn pink" style={{ marginTop: 14 }} onClick={async () => { await sb.auth.signOut(); r.replace('/login'); }}>Keluar</button>
    </>
  );
}

export default function Page() {
  return <Shell title="Pengaturan">{(me) => <Pengaturan me={me} />}</Shell>;
}
