"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { employeeIdToEmail } from "@/lib/auth/employeeId";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: employeeIdToEmail(employeeId),
      password: pin,
    });

    setLoading(false);

    if (signInError) {
      setError("Nomor ID Card atau PIN salah. Silakan coba lagi.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold mb-1">KasKu</h1>
        <p className="text-sm text-gray-500 mb-6">
          Masuk pakai Nomor ID Card kantor kamu.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="username"
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
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
              placeholder="••••••"
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
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
