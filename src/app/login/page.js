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

const Mata = ({ coret }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {coret && <path d="M4 4l16 16" />}
  </svg>
);

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
          <div style={{ position: 'relative', margin: '6px 0 14px' }}>
            <input className="in" type={lihat ? 'text' : 'password'} required autoComplete="current-password" autoCapitalize="none" autoCorrect="off" value={p} onChange={(x) => setP(x.target.value)} placeholder="••••••••" style={{ margin: 0, paddingRight: 56 }} />
            <button type="button" onClick={() => setLihat(!lihat)} aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={lihat}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'var(--ink)', cursor: 'pointer', padding: 0 }}>
              <Mata coret={lihat} />
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
