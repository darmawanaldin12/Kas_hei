"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_BADGE = {
  lunas: { label: "Lunas", className: "bg-green-100 text-green-700" },
  pending_verifikasi: {
    label: "Menunggu Verifikasi",
    className: "bg-amber-100 text-amber-700",
  },
  belum: { label: "Belum", className: "bg-gray-100 text-gray-500" },
};

export default function IuranMemberList({
  members,
  initialPayments,
  periodId,
  amountDefault,
}) {
  const supabase = createClient();

  // Map member_id -> payment row (atau null kalau belum ada row sama sekali)
  const [paymentByMember, setPaymentByMember] = useState(() => {
    const map = new Map();
    initialPayments.forEach((p) => map.set(p.member_id, p));
    return map;
  });
  const [busyId, setBusyId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  async function handleToggle(member) {
    const payment = paymentByMember.get(member.id);
    const isPaid = payment?.status === "lunas";

    setBusyId(member.id);
    setErrorId(null);

    // Optimistic update — UI langsung berubah, tidak nunggu network.
    const optimisticPayment = isPaid
      ? { ...payment, status: "belum", paid_at: null }
      : {
          ...(payment ?? { member_id: member.id, period_id: periodId }),
          status: "lunas",
          paid_at: new Date().toISOString(),
          amount: amountDefault,
        };
    setPaymentByMember((prev) => {
      const next = new Map(prev);
      next.set(member.id, optimisticPayment);
      return next;
    });

    let error;
    if (isPaid) {
      ({ error } = await supabase
        .from("dues_payments")
        .update({ status: "belum", paid_at: null })
        .eq("id", payment.id));
    } else if (payment?.id) {
      ({ error } = await supabase
        .from("dues_payments")
        .update({
          status: "lunas",
          paid_at: new Date().toISOString(),
          amount: amountDefault,
        })
        .eq("id", payment.id));
    } else {
      const { data, error: insertError } = await supabase
        .from("dues_payments")
        .insert({
          member_id: member.id,
          period_id: periodId,
          status: "lunas",
          paid_at: new Date().toISOString(),
          amount: amountDefault,
        })
        .select()
        .single();
      error = insertError;
      if (data) {
        setPaymentByMember((prev) => {
          const next = new Map(prev);
          next.set(member.id, data);
          return next;
        });
      }
    }

    setBusyId(null);

    if (error) {
      setErrorId(member.id);
      // Revert optimistic update kalau gagal.
      setPaymentByMember((prev) => {
        const next = new Map(prev);
        if (payment) next.set(member.id, payment);
        else next.delete(member.id);
        return next;
      });
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y">
      {members.map((m) => {
        const payment = paymentByMember.get(m.id);
        const status = payment?.status ?? "belum";
        const badge = STATUS_BADGE[status];
        const isPaid = status === "lunas";
        const isPending = status === "pending_verifikasi";
        const isBusy = busyId === m.id;

        return (
          <div key={m.id} className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{m.name}</p>
              {isPaid && payment?.paid_at && (
                <p className="text-xs text-gray-400">
                  Dibayar{" "}
                  {new Date(payment.paid_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
              {errorId === m.id && (
                <p className="text-xs text-red-500">
                  Gagal menyimpan, coba lagi.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
              {!isPending && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleToggle(m)}
                  className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50 disabled:opacity-50 min-w-[92px]"
                >
                  {isBusy ? "..." : isPaid ? "Batalkan" : "Tandai Lunas"}
                </button>
              )}
              {isPending && (
                <a
                  href="/iuran/verifikasi"
                  className="text-xs rounded-lg border border-amber-300 text-amber-700 px-2.5 py-1.5 hover:bg-amber-50"
                >
                  Verifikasi
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
