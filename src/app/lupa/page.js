'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Lupa() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState(null);

  async function kirim(ev) {
    ev.preventDefault();
    setBusy(true); setHasil(null);
    try {
      const r = await fetch('/api/lupa-sandi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      setHasil(r.ok ? { ok: true } : { bad: true, t: j.error || 'Gagal, coba lagi' });
    } catch (e) {
      setHasil({ bad: true, t: 'Tidak bisa terhubung. Coba lagi.' });
    }
    setBusy(false);
  }

  return (
    <div className="login">
      <div className="login-top">
        <div className="logo">?</div>
        <h1>Lupa<br />sandi</h1>
        <p>Masukkan email pengingat yang terdaftar. Kata sandi sementara akan dikirim ke sana.</p>
      </div>
      <form className="card" onSubmit={kirim}>
        <label><small>Email</small>
          <input className="in" type="email" required autoCapitalize="none" autoCorrect="off" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@gmail.com" /></label>
        <button className="btn" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim kata sandi'}</button>
      </form>
      {hasil?.ok && (
        <div className="note">
          Kalau email itu terdaftar, kata sandi sementara sudah dikirim. Cek Kotak Masuk dan folder Spam, lalu masuk dan ganti kata sandi di menu Pengaturan. Kalau belum ada, tunggu beberapa menit.
        </div>
      )}
      {hasil?.bad && <div className="note bad">{hasil.t}</div>}
      <div className="note">Email belum terdaftar atau tidak ingat emailnya? Minta ketua untuk mengisi atau mereset akunmu.</div>
      <Link href="/login" className="btn y">Kembali masuk</Link>
    </div>
  );
}
