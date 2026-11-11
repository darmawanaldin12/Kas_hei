'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sb } from '../../lib/supabase';

// Login pakai nama login (mis. "budi"). Di belakang layar dipetakan ke email internal.
// Akun lama yang masih pakai email tetap bisa masuk (kalau ada "@", dianggap email).
const keEmail = (v) => {
  const s = v.trim().toLowerCase();
  return s.includes('@') ? s : s + '@kas.internal';
};

export default function Login() {
  const r = useRouter();
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [lihat, setLihat] = useState(false);
  const [m, setM] = useState('');
  const [busy, setBusy] = useState(false);

  async function masuk(ev) {
    ev.preventDefault();
    setBusy(true); setM('');
    const { error } = await sb.auth.signInWithPassword({ email: keEmail(e), password: p });
    if (error) { setM('Nama atau kata sandi salah'); setBusy(false); } else r.replace('/');
  }

  return (
    <div className="login">
      <div className="login-top">
        <div className="logo">$</div>
        <h1>Kas<br />Kantor</h1>
        <span className="stk">Masuk dulu ya</span>
        <p>Masuk untuk melihat dan mencatat kas.</p>
      </div>
      <form className="card" onSubmit={masuk}>
        <label><small>Nama</small><input className="in" required autoCapitalize="none" autoCorrect="off" autoComplete="username" value={e} onChange={(x) => setE(x.target.value)} placeholder="mis. budi" /></label>
        <label><small>Kata sandi</small>
          <div style={{ position: 'relative' }}>
            <input className="in" type={lihat ? 'text' : 'password'} required autoComplete="current-password" autoCapitalize="none" autoCorrect="off" value={p} onChange={(x) => setP(x.target.value)} placeholder="••••••••" style={{ paddingRight: 96 }} />
            <button type="button" onClick={() => setLihat(!lihat)} aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={lihat}
              style={{ position: 'absolute', right: 8, top: 14, height: 36, minWidth: 80, border: '3px solid var(--ink)', borderRadius: 999, background: 'var(--sun)', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: 'var(--ink)', cursor: 'pointer' }}>
              {lihat ? 'Sembunyi' : 'Lihat'}
            </button>
          </div>
        </label>
        <button className="btn" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        <p style={{ marginTop: 14, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
          <Link href="/lupa" style={{ color: 'var(--ink)' }}>Lupa kata sandi?</Link>
        </p>
      </form>
      {m && <div className="note bad">{m}</div>}
      <div className="note">Akun dibuat oleh ketua. Kata sandi awal anggota adalah NIK.</div>
    </div>
  );
}
