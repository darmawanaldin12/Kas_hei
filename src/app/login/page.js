'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../lib/supabase';

export default function Login() {
  const r = useRouter();
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [m, setM] = useState('');
  const [busy, setBusy] = useState(false);

  async function masuk(ev) {
    ev.preventDefault();
    setBusy(true); setM('');
    const { error } = await sb.auth.signInWithPassword({ email: e.trim(), password: p });
    if (error) { setM('Email atau kata sandi salah'); setBusy(false); } else r.replace('/');
  }

  return (
    <div className="login">
      <div className="logo">$</div>
      <h1>Kas<br />Kantor</h1>
      <p>Masuk untuk melihat dan mencatat kas.</p>
      <form className="card" onSubmit={masuk}>
        <label><small>Email</small><input className="in" type="email" required value={e} onChange={(x) => setE(x.target.value)} placeholder="nama@kantor.com" /></label>
        <label><small>Kata sandi</small><input className="in" type="password" required value={p} onChange={(x) => setP(x.target.value)} placeholder="••••••••" /></label>
        <button className="btn" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
      </form>
      {m && <div className="note" style={{ background: '#ff6b9d' }}>{m}</div>}
      <div className="note">Akun dibuat oleh ketua. Peran kamu (anggota, bendahara, ketua) sudah ditentukan.</div>
    </div>
  );
}
