import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatRibu(n) {
  // Format singkat untuk sel grid, mis. "20.000" tanpa "Rp".
  return new Intl.NumberFormat("id-ID").format(n);
}

export default async function LaporanTahunanPage({ searchParams }) {
  const params = await searchParams;
  const now = new Date();
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

  const role = profile?.role ?? "anggota";
  if (role !== "admin" && role !== "pengurus") {
    redirect("/dashboard");
  }

  // Anggota (aktif & nonaktif, supaya histori tahun-tahun sebelumnya tetap utuh)
  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name");

  const { data: periods } = await supabase
    .from("dues_periods")
    .select("id, month")
    .eq("year", year)
    .order("month");

  const periodIds = (periods ?? []).map((p) => p.id);
  const periodByMonth = new Map((periods ?? []).map((p) => [p.month, p.id]));

  let payments = [];
  if (periodIds.length > 0) {
    const { data } = await supabase
      .from("dues_payments")
      .select("member_id, period_id, status, amount")
      .in("period_id", periodIds)
      .eq("status", "lunas");
    payments = data ?? [];
  }

  // grid[memberId][month] = amount
  const grid = new Map();
  for (const p of payments) {
    const period = (periods ?? []).find((per) => per.id === p.period_id);
    if (!period) continue;
    if (!grid.has(p.member_id)) grid.set(p.member_id, new Map());
    grid.get(p.member_id).set(period.month, Number(p.amount));
  }

  const memberTotals = new Map();
  for (const [memberId, monthMap] of grid.entries()) {
    let sum = 0;
    for (const v of monthMap.values()) sum += v;
    memberTotals.set(memberId, sum);
  }

  // Hanya tampilkan anggota yang punya minimal 1 pembayaran di tahun ini,
  // supaya laporan tidak penuh baris kosong untuk tahun-tahun lama.
  const rows = (members ?? []).filter((m) => grid.has(m.id));

  const { data: yearTx } = await supabase
    .from("transactions")
    .select("type, amount, date")
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`);

  const totalMasuk = (yearTx ?? [])
    .filter((t) => t.type === "in")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalKeluar = (yearTx ?? [])
    .filter((t) => t.type === "out")
    .reduce((s, t) => s + Number(t.amount), 0);
  const saldoTahunIni = totalMasuk - totalKeluar;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Laporan Tahunan</h1>
        <a
          href="/dashboard"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/laporan/tahunan?year=${year - 1}`}
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          ← {year - 1}
        </Link>
        <p className="font-medium text-sm">Tahun {year}</p>
        <Link
          href={`/laporan/tahunan?year=${year + 1}`}
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          {year + 1} →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 text-center">
          Belum ada data iuran untuk tahun {year}.
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto mb-4">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-left font-medium sticky left-0 bg-gray-800">
                  No
                </th>
                <th className="px-3 py-2 text-left font-medium sticky left-8 bg-gray-800">
                  Nama
                </th>
                {MONTH_SHORT.map((m) => (
                  <th key={m} className="px-2 py-2 text-center font-medium">
                    {m}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((m, idx) => {
                const monthMap = grid.get(m.id) ?? new Map();
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-gray-400 sticky left-0 bg-white">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap sticky left-8 bg-white">
                      {m.name}
                    </td>
                    {MONTH_SHORT.map((_, mi) => {
                      const val = monthMap.get(mi + 1);
                      return (
                        <td
                          key={mi}
                          className={`px-2 py-2 text-center whitespace-nowrap ${
                            val ? "text-gray-700" : "text-gray-300"
                          }`}
                        >
                          {val ? formatRibu(val) : "—"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {formatRibu(memberTotals.get(m.id) ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Jumlah Uang Masuk ({year})</span>
          <span className="font-semibold text-green-600">
            {formatRupiah(totalMasuk)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Jumlah Uang Keluar ({year})</span>
          <span className="font-semibold text-red-600">
            {formatRupiah(totalKeluar)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-700 font-medium">
            Selisih Kas Tahun {year}
          </span>
          <span
            className={`font-semibold ${
              saldoTahunIni >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatRupiah(saldoTahunIni)}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Export PDF/Excel untuk laporan ini akan ditambahkan pada tahap
        berikutnya (roadmap Fase 2).
      </p>
    </main>
  );
}
