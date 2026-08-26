import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

async function toggleStatus(formData) {
  "use server";
  const id = formData.get("id");
  const currentStatus = formData.get("currentStatus");
  const newStatus = currentStatus === "aktif" ? "nonaktif" : "aktif";

  const supabase = await createClient();
  await supabase.from("members").update({ status: newStatus }).eq("id", id);
  revalidatePath("/anggota");
}

export default async function AnggotaPage() {
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
  if (role === "anggota") redirect("/dashboard");
  const isAdmin = role === "admin";

  const { data: members } = await supabase
    .from("members")
    .select("id, name, employee_id, phone, email, status, joined_at")
    .order("name");

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Anggota</h1>
          <p className="text-sm text-gray-500">
            {members?.length ?? 0} anggota terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/anggota/baru"
              className="text-sm rounded-lg bg-black text-white px-3 py-1.5"
            >
              + Tambah
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        {members?.length === 0 && (
          <p className="p-6 text-sm text-gray-500">
            Belum ada anggota. Klik &quot;+ Tambah&quot; untuk mulai.
          </p>
        )}
        {members?.map((m) => (
          <div
            key={m.id}
            className="p-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium text-sm">{m.name}</p>
              <p className="text-xs text-gray-500">
                ID: {m.employee_id ?? "-"}
                {m.phone ? ` · ${m.phone}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  m.status === "aktif"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {m.status === "aktif" ? "Aktif" : "Nonaktif"}
              </span>
              {isAdmin && (
                <>
                  <Link
                    href={`/anggota/${m.id}/edit`}
                    className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                  <form action={toggleStatus}>
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="hidden"
                      name="currentStatus"
                      value={m.status}
                    />
                    <button
                      type="submit"
                      className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
                    >
                      {m.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
