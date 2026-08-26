"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold mb-1">Daftar Akun</h1>
        <p className="text-sm text-gray-500 mb-6">
          Halaman ini untuk setup awal (bootstrap admin). Setelah akun
          pertama dibuat, admin bisa mengelola anggota lain lewat halaman
          Anggota.
        </p>

        {success ? (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-3">
            Akun berhasil dibuat. Cek email untuk konfirmasi (jika diaktifkan),
            lalu{" "}
            <a href="/login" className="underline font-medium">
              login di sini
            </a>
            . Role default akun baru adalah <b>anggota</b> — admin perlu
            menaikkan role lewat Supabase dashboard untuk akun pertama.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
                placeholder="Minimal 6 karakter"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black text-white text-sm font-medium py-2.5 disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
