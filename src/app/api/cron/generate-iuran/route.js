import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Dipanggil otomatis oleh Vercel Cron tiap tanggal 25 (lihat vercel.json).
// Vercel otomatis kirim header "Authorization: Bearer <CRON_SECRET>"
// kalau env var CRON_SECRET di-set di project, jadi endpoint ini aman
// dari diakses sembarang orang.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("dues_periods")
    .select("id")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      message: "Periode bulan ini sudah ada, tidak dibuat ulang.",
      periodId: existing.id,
    });
  }

  const { data: created, error } = await admin
    .from("dues_periods")
    .insert({ month, year, amount_default: 20000 })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `Periode ${month}/${year} berhasil dibuat otomatis.`,
    periodId: created.id,
  });
}
