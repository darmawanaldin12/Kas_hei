import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nameToEmail } from "@/lib/auth/employeeId";

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Hanya admin yang bisa menambah anggota." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const name = (body.name || "").trim();
  const employeeId = (body.employeeId || "").trim();
  const phone = (body.phone || "").trim() || null;
  const email = (body.email || "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (employeeId.length < 6) {
    return NextResponse.json(
      { error: "Nomor ID Card minimal 6 karakter." },
      { status: 400 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY belum di-set di server. Tambahkan dulu env var ini di Vercel.",
      },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: nameToEmail(name),
      password: employeeId,
      email_confirm: true,
      user_metadata: { name, employee_id: employeeId },
    });

  if (createError) {
    const message = createError.message.includes("already been registered")
      ? "Sudah ada akun dengan nama yang sama persis. Tambahkan inisial/nama tengah untuk membedakan."
      : createError.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Trigger handle_new_user otomatis bikin row `members`.
  // Kalau ada phone/email tambahan, update di sini.
  if (phone || email) {
    await admin
      .from("members")
      .update({ phone, email })
      .eq("employee_id", employeeId);
  }

  return NextResponse.json({ ok: true, userId: created.user?.id });
}
