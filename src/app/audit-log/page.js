import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const TABLE_LABEL = {
  transactions: "Transaksi",
  dues_payments: "Iuran",
};

const ACTION_LABEL = {
  create: "Dibuat",
  update: "Diubah",
  delete: "Dihapus",
};

const ACTION_COLOR = {
  create: "bg-green-100 text-green-700",
  update: "bg-amber-100 text-amber-700",
  delete: "bg-red-100 text-red-700",
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Ambil field yang berubah antara old/new value (untuk ringkasan singkat).
function diffSummary(oldValue, newValue) {
  if (!oldValue || !newValue) return null;
  const changed = [];
  for (const key of Object.keys(newValue)) {
    if (key === "updated_at" || key === "created_at") continue;
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changed.push(`${key}: ${oldValue[key] ?? "-"} → ${newValue[key] ?? "-"}`);
    }
  }
  return changed.length ? changed.join(", ") : null;
}

export default async function AuditLogPage({ searchParams }) {
  const params = await searchParams;
  const filterTable = params?.table || "all";
  const filterAction = params?.action || "all";

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
  if (role !== "admin") {
    redirect("/dashboard");
  }

  let query = supabase
    .from("audit_logs")
    .select(
      "id, table_name, record_id, action, old_value, new_value, actor_id, created_at, profiles(members(name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filterTable !== "all") {
    query = query.eq("table_name", filterTable);
  }
  if (filterAction !== "all") {
    query = query.eq("action", filterAction);
  }

  const { data: logs, error } = await query;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <a
          href="/dashboard"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Jejak setiap perubahan pada transaksi kas & iuran — siapa, apa, kapan.
        Menampilkan 100 aktivitas terbaru.
      </p>

      <form className="flex gap-2 mb-4">
        <select
          name="table"
          defaultValue={filterTable}
          className="text-xs rounded-lg border border-gray-300 px-2 py-1.5"
        >
          <option value="all">Semua Tabel</option>
          <option value="transactions">Transaksi</option>
          <option value="dues_payments">Iuran</option>
        </select>
        <select
          name="action"
          defaultValue={filterAction}
          className="text-xs rounded-lg border border-gray-300 px-2 py-1.5"
        >
          <option value="all">Semua Aksi</option>
          <option value="create">Dibuat</option>
          <option value="update">Diubah</option>
          <option value="delete">Dihapus</option>
        </select>
        <button
          type="submit"
          className="text-xs rounded-lg bg-black text-white px-3 py-1.5"
        >
          Filter
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
          Gagal memuat audit log: {error.message}
        </p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        {(logs ?? []).length === 0 && (
          <p className="p-6 text-sm text-gray-500 text-center">
            Belum ada aktivitas tercatat.
          </p>
        )}
        {(logs ?? []).map((log) => {
          const summary =
            log.action === "update"
              ? diffSummary(log.old_value, log.new_value)
              : null;
          return (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ACTION_COLOR[log.action] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(log.created_at)}
                </span>
              </div>
              <p className="text-sm font-medium">
                {TABLE_LABEL[log.table_name] ?? log.table_name}
                <span className="text-gray-400 font-normal">
                  {" "}
                  · oleh {log.profiles?.members?.name ?? "Sistem"}
                </span>
              </p>
              {summary && (
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {summary}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
