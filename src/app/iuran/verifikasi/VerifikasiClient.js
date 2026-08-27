"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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

export default function VerifikasiClient({ initialClaims }) {
  const supabase = createClient();
  const router = useRouter();

  const [claims, setClaims] = useState(initialClaims);
  const [busyId, setBusyId] = useState(null);
  const [proofUrls, setProofUrls] = useState({});
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");

  async function handleLihatBukti(claim) {
    if (proofUrls[claim.id]) return;
    const { data, error: signError } = await supabase.storage
      .from("bukti-iuran")
      .createSignedUrl(claim.proof_url, 120);

    if (signError) {
      setError(`Gagal memuat bukti: ${signError.message}`);
      return;
    }
    setProofUrls((prev) => ({ ...prev, [claim.id]: data.signedUrl }));
  }

  async function handleKonfirmasi(claim) {
    setBusyId(claim.id);
    setError("");
    const { error: rpcError } = await supabase.rpc("verify_dues_payment", {
      p_payment_id: claim.id,
    });
    setBusyId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setClaims((prev) => prev.filter((c) => c.id !== claim.id));
    router.refresh();
  }

  async function handleTolak(claim) {
    const reason = notes[claim.id]?.trim();
    if (!reason) {
      setError("Isi catatan alasan penolakan dulu sebelum menolak klaim.");
      return;
    }
    setBusyId(claim.id);
    setError("");
    const { error: rpcError } = await supabase.rpc("reject_dues_payment", {
      p_payment_id: claim.id,
      p_reason: reason,
    });
    setBusyId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setClaims((prev) => prev.filter((c) => c.id !== claim.id));
    router.refresh();
  }

  if (claims.length === 0) {
    return (
      <p className="p-6 text-sm text-gray-500 text-center rounded-xl border border-gray-200 bg-white">
        Tidak ada klaim yang menunggu verifikasi.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {claims.map((claim) => (
        <div
          key={claim.id}
          className="rounded-xl border border-amber-200 bg-white p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">{claim.members?.name}</p>
            <span className="text-xs text-gray-400">
              {MONTH_NAMES[claim.dues_periods?.month - 1]}{" "}
              {claim.dues_periods?.year}
            </span>
          </div>

          <p className="text-sm text-gray-700">
            Klaim: <span className="font-medium">{formatRupiah(claim.claimed_amount)}</span>{" "}
            pada {claim.claimed_date && formatDate(claim.claimed_date)}
          </p>

          {proofUrls[claim.id] ? (
            <a
              href={proofUrls[claim.id]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2"
            >
              <img
                src={proofUrls[claim.id]}
                alt="Bukti transfer"
                className="max-h-48 rounded-lg border border-gray-200"
              />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => handleLihatBukti(claim)}
              className="text-xs text-blue-600 underline mt-2"
            >
              Lihat bukti transfer
            </button>
          )}

          <div className="mt-3">
            <label className="block text-xs font-medium mb-1">
              Catatan verifikasi{" "}
              <span className="text-gray-400">(wajib diisi jika menolak)</span>
            </label>
            <input
              type="text"
              value={notes[claim.id] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))
              }
              placeholder="mis. nominal tidak cocok dengan mutasi rekening"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={busyId === claim.id}
              onClick={() => handleTolak(claim)}
              className="flex-1 rounded-lg border border-red-300 text-red-600 text-sm py-2 disabled:opacity-50"
            >
              Tolak
            </button>
            <button
              type="button"
              disabled={busyId === claim.id}
              onClick={() => handleKonfirmasi(claim)}
              className="flex-1 rounded-lg bg-green-600 text-white text-sm py-2 disabled:opacity-50"
            >
              {busyId === claim.id ? "Memproses..." : "Konfirmasi Lunas"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
