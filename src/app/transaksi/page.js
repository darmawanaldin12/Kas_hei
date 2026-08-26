import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransaksiClient from "./TransaksiClient";

export default async function TransaksiPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, member_id, members(name)")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "anggota";
  const canInput = role === "admin" || role === "pengurus";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("is_active", true)
    .order("name");

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, type, amount, date, description, created_at, categories(name), profiles(members(name)), members(name)"
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: activeMembers } = await supabase
    .from("members")
    .select("id, name")
    .eq("status", "aktif")
    .order("name");

  return (
    <TransaksiClient
      canInput={canInput}
      categories={categories ?? []}
      initialTransactions={transactions ?? []}
      members={activeMembers ?? []}
      memberName={profile?.members?.name ?? user.email}
    />
  );
}
