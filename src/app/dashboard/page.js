import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const roleLabel = {
  admin: "Admin/Bendahara",
  pengurus: "Pengurus",
  anggota: "Anggota",
};

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, member_id, members(name, employee_id)")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "anggota";
  const canManage = role === "admin" || role === "pengurus";
  const displayName = profile?.members?.name ?? user.email;
  const employeeId = profile?.members?.employee_id;

  const { data: allTx } = await supabase
    .from("transactions")
    .select("type, amount");

  const saldo = (allTx ?? []).reduce(
    (sum, t) => sum + (t.type === "in" ? Number(t.amount) : -Number(t.amount)),
    0
  );
  const totalMasuk = (allTx ?? [])
    .filter((t) => t.type === "in")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalKeluar = (allTx ?? [])
    .filter((t) => t.type === "out")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // 4.9: ringkasan status iuran bulan berjalan (lunas / pending verifikasi / belum)
  let duesSummary = null;
  if (canManage) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: period } = await supabase
      .from("dues_periods")
      .select("id")
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();

    if (period) {
      const { data: activeMembers } = await supabase
        .from("members")
        .select("id")
        .eq("status", "aktif");

      const { data: payments } = await supabase
        .from("dues_payments")
        .select("member_id, status")
        .eq("period_id", period.id);

      const total = activeMembers?.length ?? 0;
      const lunas = (payments ?? []).filter((p) => p.status === "lunas").length;
      const pending = (payments ?? []).filter(
        (p) => p.status === "pending_verifikasi"
      ).length;
      const belum = total - lunas - pending;

      duesSummary = { total, lunas, pending, belum };
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Saldo Kas</h1>
          <p className="text-sm text-gray-500">
            {displayName}
            {employeeId ? ` (${employeeId})` : ""} · {roleLabel[role] ?? role}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Keluar
          </button>
        </form>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <a
          href="/transaksi"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Transaksi Kas →
        </a>
        <a
          href="/iuran"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Iuran Bulanan →
        </a>
        {role !== "anggota" && (
          <a
            href="/anggota"
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Kelola Anggota →
          </a>
        )}
        {canManage && (
          <a
            href="/laporan/tahunan"
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Laporan Tahunan →
          </a>
        )}
        {role === "admin" && (
          <a
            href="/tutup-buku"
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Tutup Buku →
          </a>
        )}
        {role === "admin" && (
          <a
            href="/audit-log"
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Audit Log →
          </a>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 p-6 bg-white mb-4">
        <p className="text-sm text-gray-500 mb-1">Saldo Kas Saat Ini</p>
        <p className="text-3xl font-semibold">{formatRupiah(saldo)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">Total Pemasukan</p>
          <p className="text-lg font-semibold text-green-600">
            {formatRupiah(totalMasuk)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">Total Pengeluaran</p>
          <p className="text-lg font-semibold text-red-600">
            {formatRupiah(totalKeluar)}
          </p>
        </div>
      </div>

      {duesSummary && (
        <div className="rounded-xl border border-gray-200 p-4 bg-white mb-4">
          <p className="text-xs text-gray-500 mb-2">
            Status Iuran Bulan Ini ({duesSummary.total} anggota aktif)
          </p>
          <div className="flex gap-2">
            <span className="flex-1 text-center rounded-lg bg-green-50 text-green-700 text-sm font-medium py-2">
              {duesSummary.lunas} Lunas
            </span>
            <span className="flex-1 text-center rounded-lg bg-amber-50 text-amber-700 text-sm font-medium py-2">
              {duesSummary.pending} Pending
            </span>
            <span className="flex-1 text-center rounded-lg bg-gray-50 text-gray-500 text-sm font-medium py-2">
              {duesSummary.belum} Belum
            </span>
          </div>
          {duesSummary.pending > 0 && (
            <a
              href="/iuran/verifikasi"
              className="block text-center text-xs text-amber-700 mt-2 underline"
            >
              Verifikasi klaim yang menunggu →
            </a>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Grafik bulanan akan ditambahkan pada tahap berikutnya.
      </p>
    </main>
  );
}
