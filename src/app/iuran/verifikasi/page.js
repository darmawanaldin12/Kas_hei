import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VerifikasiClient from "./VerifikasiClient";

export default async function VerifikasiIuranPage() {
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

  const { data: claims } = await supabase
    .from("dues_payments")
    .select(
      "id, claimed_amount, claimed_date, proof_url, members(name), dues_periods(month, year)"
    )
    .eq("status", "pending_verifikasi")
    .order("claimed_at", { ascending: true });

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Verifikasi Klaim Iuran</h1>
        <a
          href="/iuran"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Iuran
        </a>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Cocokkan klaim ke rekening/kas fisik sebelum konfirmasi. Setiap
        konfirmasi otomatis membuat entri transaksi kategori Iuran.
      </p>

      <VerifikasiClient initialClaims={claims ?? []} />
    </main>
  );
}
