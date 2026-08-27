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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function KlaimIuranCard({ payment, period, userId }) {
  const supabase = createClient();
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [claimedDate, setClaimedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [claimedAmount, setClaimedAmount] = useState(
    period?.amount_default ?? 20000
  );
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!period) return null;

  if (!payment) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
        <p className="text-sm text-gray-500">
          Tagihan iuran untuk periode ini belum tersedia. Hubungi admin/bendahara.
        </p>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Bukti transfer/foto wajib diunggah.");
      return;
    }
    if (!claimedAmount || Number(claimedAmount) <= 0) {
      setError("Nominal wajib diisi.");
      return;
    }

    setLoading(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${payment.id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("bukti-iuran")
      .upload(path, file);

    if (uploadError) {
      setLoading(false);
      setError(`Gagal mengunggah bukti: ${uploadError.message}`);
      return;
    }

    const { error: rpcError } = await supabase.rpc("claim_dues_payment", {
      p_payment_id: payment.id,
      p_claimed_amount: Number(claimedAmount),
      p_claimed_date: claimedDate,
      p_proof_url: path,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setShowForm(false);
    setFile(null);
    router.refresh();
  }

  if (payment.status === "lunas") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-4">
        <p className="text-sm font-medium text-green-700">
          Iuran periode ini sudah lunas
        </p>
        {payment.paid_at && (
          <p className="text-xs text-green-600 mt-0.5">
            Tercatat {formatDate(payment.paid_at)}
          </p>
        )}
      </div>
    );
  }

  if (payment.status === "pending_verifikasi") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
        <p className="text-sm font-medium text-amber-700">
          Menunggu verifikasi bendahara
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Klaim: {formatRupiah(payment.claimed_amount)} pada{" "}
          {payment.claimed_date && formatDate(payment.claimed_date)}
        </p>
      </div>
    );
  }

  // status === "belum"
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Iuran periode ini belum lunas</p>
          <p className="text-xs text-gray-500">
            Nominal: {formatRupiah(period.amount_default)}
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs rounded-lg bg-black text-white px-3 py-1.5"
          >
            Saya Sudah Bayar
          </button>
        )}
      </div>

      {payment.rejection_reason && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
          Klaim sebelumnya ditolak: {payment.rejection_reason}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Tanggal Bayar
            </label>
            <input
              type="date"
              value={claimedDate}
              onChange={(e) => setClaimedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Nominal</label>
            <input
              type="number"
              min="1"
              value={claimedAmount}
              onChange={(e) => setClaimedAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Bukti Transfer/Foto <span className="text-red-500">*wajib</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-gray-300 text-sm py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-black text-white text-sm py-2 disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Klaim"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
