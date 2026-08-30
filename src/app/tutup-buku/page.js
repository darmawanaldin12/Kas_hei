import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import TutupBukuClient from "./TutupBukuClient";

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

export default async function TutupBukuPage({ searchParams }) {
  const params = await searchParams;
  const now = new Date();
  const month = Number(params?.month) || now.getMonth() + 1;
  const year = Number(params?.year) || now.getFullYear();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: closing } = await supabase
    .from("monthly_closings")
    .select("id, closing_balance, closed_by, closed_at, is_locked")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  // Checklist rekonsiliasi: anggota aktif yang belum/pending di periode ini
  const { data: period } = await supabase
    .from("dues_periods")
    .select("id")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  const { data: activeMembers } = await supabase
    .from("members")
    .select("id, name")
    .eq("status", "aktif");

  let reconciliation = { belum: [], pending: [] };
  if (period) {
    const { data: payments } = await supabase
      .from("dues_payments")
      .select("member_id, status")
      .eq("period_id", period.id);

    const statusByMember = new Map(
      (payments ?? []).map((p) => [p.member_id, p.status])
    );

    for (const m of activeMembers ?? []) {
      const status = statusByMember.get(m.id) ?? "belum";
      if (status === "pending_verifikasi") reconciliation.pending.push(m);
      else if (status === "belum") reconciliation.belum.push(m);
    }
  } else {
    // Belum ada periode iuran sama sekali = semua anggota aktif dianggap belum bayar
    reconciliation.belum = activeMembers ?? [];
  }

  // Saldo kumulatif s.d. akhir bulan (preview sebelum ditutup)
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data: txUpToEnd } = await supabase
    .from("transactions")
    .select("type, amount")
    .lte("date", endDate);

  const runningBalance = (txUpToEnd ?? []).reduce(
    (sum, t) => sum + (t.type === "in" ? Number(t.amount) : -Number(t.amount)),
    0
  );

  const { data: history } = await supabase
    .from("monthly_closings")
    .select("month, year, closing_balance, is_locked, closed_at")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(12);

  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Tutup Buku Bulanan</h1>
        <a
          href="/dashboard"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/tutup-buku?month=${prevMonth}&year=${prevYear}`}
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          ← Sebelumnya
        </Link>
        <p className="font-medium text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <Link
          href={`/tutup-buku?month=${nextMonth}&year=${nextYear}`}
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Berikutnya →
        </Link>
      </div>

      <div className="mb-6">
        <TutupBukuClient
          month={month}
          year={year}
          monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
          closing={closing}
          reconciliation={reconciliation}
          runningBalance={runningBalance}
        />
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Riwayat Tutup Buku
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        {(history ?? []).length === 0 && (
          <p className="p-6 text-sm text-gray-500 text-center">
            Belum ada bulan yang ditutup buku.
          </p>
        )}
        {(history ?? []).map((h) => (
          <div
            key={`${h.month}-${h.year}`}
            className="p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">
                {MONTH_NAMES[h.month - 1]} {h.year}
              </p>
              <p className="text-xs text-gray-400">
                {h.is_locked ? "🔒 Terkunci" : "🔓 Terbuka"}
              </p>
            </div>
            <p className="text-sm font-semibold">
              {formatRupiah(h.closing_balance)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
