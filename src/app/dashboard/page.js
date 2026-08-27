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

      <div className="grid grid-cols-2 gap-4">
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

      <p className="text-xs text-gray-400 mt-4">
        Grafik bulanan & ringkasan iuran akan ditambahkan pada tahap
        berikutnya.
      </p>
    </main>
  );
}
