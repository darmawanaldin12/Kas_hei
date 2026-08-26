"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { employeeIdToEmail } from "@/lib/auth/employeeId";

export default function RegisterPage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: employeeIdToEmail(employeeId),
      password: pin,
      options: {
        data: {
          employee_id: employeeId.trim(),
          name: name.trim(),
        },
      },
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
            Akun berhasil dibuat. Kalau konfirmasi email diaktifkan di
            Supabase, minta admin nonaktifkan dulu untuk akun berbasis ID
            Card ini. Lalu{" "}
            <a href="/login" className="underline font-medium">
              login di sini
            </a>{" "}
            pakai Nomor ID Card &amp; PIN. Role default akun baru adalah{" "}
            <b>anggota</b> — untuk akun pertama, naikkan role jadi{" "}
            <b>admin</b> lewat Supabase dashboard.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
                placeholder="Nama sesuai ID Card"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="employeeId"
              >
                Nomor ID Card
              </label>
              <input
                id="employeeId"
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
                placeholder="Contoh: EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="pin">
                PIN
              </label>
              <input
                id="pin"
                type="password"
                required
                minLength={6}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
                placeholder="Minimal 6 digit"
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
