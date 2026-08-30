"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function TutupBukuClient({
  month,
  year,
  monthLabel,
  closing,
  reconciliation,
  runningBalance,
}) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const isLocked = closing?.is_locked === true;
  const hasOutstanding =
    reconciliation.belum.length + reconciliation.pending.length > 0;

  async function handleClose() {
    setLoading(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("close_month", {
      p_month: month,
      p_year: year,
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.refresh();
  }

  async function handleReopen() {
    if (!confirm("Buka kunci bulan ini? Transaksi akan bisa diedit lagi.")) {
      return;
    }
    setLoading(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("reopen_month", {
      p_month: month,
      p_year: year,
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.refresh();
  }

  if (isLocked) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-white font-medium">
            🔒 Terkunci
          </span>
          <p className="text-sm font-medium">{monthLabel}</p>
        </div>
        <p className="text-sm text-gray-500 mb-1">
          Saldo akhir tersimpan:{" "}
          <span className="font-semibold text-gray-800">
            {formatRupiah(closing.closing_balance)}
          </span>
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Ditutup {new Date(closing.closed_at).toLocaleString("id-ID")}
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={handleReopen}
          className="w-full rounded-lg border border-amber-300 text-amber-700 text-sm font-medium py-2.5 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Buka Kunci Ulang"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium mb-1">{monthLabel}</p>
      <p className="text-sm text-gray-500 mb-4">
        Saldo kumulatif s.d. akhir bulan ini:{" "}
        <span className="font-semibold text-gray-800">
          {formatRupiah(runningBalance)}
        </span>
      </p>

      {/* Checklist rekonsiliasi — PRD §4.8 */}
      <div className="rounded-lg bg-gray-50 p-3 mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">
          Checklist rekonsiliasi sebelum tutup buku
        </p>
        {reconciliation.pending.length > 0 && (
          <p className="text-xs text-amber-700 mb-1">
            ⚠️ {reconciliation.pending.length} anggota masih menunggu
            verifikasi klaim iuran:{" "}
            {reconciliation.pending.map((m) => m.name).join(", ")}
          </p>
        )}
        {reconciliation.belum.length > 0 && (
          <p className="text-xs text-gray-500">
            {reconciliation.belum.length} anggota belum bayar iuran bulan
            ini: {reconciliation.belum.map((m) => m.name).join(", ")}
          </p>
        )}
        {!hasOutstanding && (
          <p className="text-xs text-green-700">
            ✓ Semua anggota aktif sudah lunas iuran bulan ini.
          </p>
        )}
      </div>

      <label className="flex items-start gap-2 mb-3 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Saya sudah mengecek daftar di atas dan tetap ingin menutup buku
          bulan ini. Setelah ditutup, transaksi di bulan ini tidak bisa
          diedit/dihapus pengurus tanpa dibuka kunci ulang oleh admin.
        </span>
      </label>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || !confirmChecked}
        onClick={handleClose}
        className="w-full rounded-lg bg-black text-white text-sm font-medium py-2.5 disabled:opacity-50"
      >
        {loading ? "Menutup buku..." : "Tutup Buku Bulan Ini"}
      </button>
    </div>
  );
}
