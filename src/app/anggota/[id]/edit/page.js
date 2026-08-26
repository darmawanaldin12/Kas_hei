import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

async function updateMember(formData) {
  "use server";
  const id = formData.get("id");
  const phone = formData.get("phone") || null;
  const email = formData.get("email") || null;

  const supabase = await createClient();
  await supabase.from("members").update({ phone, email }).eq("id", id);

  revalidatePath("/anggota");
  redirect("/anggota");
}

export default async function EditMemberPage({ params }) {
  const { id } = await params;
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

  if (profile?.role !== "admin") redirect("/anggota");

  const { data: member } = await supabase
    .from("members")
    .select("id, name, employee_id, phone, email")
    .eq("id", id)
    .single();

  if (!member) notFound();

  return (
    <main className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-1">Edit Anggota</h1>
      <p className="text-sm text-gray-500 mb-6">
        {member.name} · ID: {member.employee_id ?? "-"}
      </p>

      <form action={updateMember} className="space-y-4">
        <input type="hidden" name="id" value={member.id} />

        <div>
          <label className="block text-sm font-medium mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            disabled
            value={member.name}
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Nama tidak bisa diubah di sini karena dipakai untuk login.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">No. HP</label>
          <input
            type="text"
            name="phone"
            defaultValue={member.phone ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={member.email ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black text-white text-sm font-medium py-2.5"
        >
          Simpan Perubahan
        </button>
      </form>
    </main>
  );
}
