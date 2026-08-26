import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const roleLabel = {
  admin: "Admin/Bendahara",
  pengurus: "Pengurus",
  anggota: "Anggota",
};

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

      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <p className="text-sm text-gray-500 mb-1">Saldo Kas Saat Ini</p>
        <p className="text-3xl font-semibold">Rp 0</p>
        <p className="text-xs text-gray-400 mt-2">
          Grafik & ringkasan iuran akan ditambahkan pada tahap berikutnya.
        </p>
      </div>
    </main>
  );
}
