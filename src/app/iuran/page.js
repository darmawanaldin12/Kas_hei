import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import KlaimIuranCard from "./KlaimIuranCard";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const STATUS_BADGE = {
  lunas: { label: "Lunas", className: "bg-green-100 text-green-700" },
  pending_verifikasi: {
    label: "Menunggu Verifikasi",
    className: "bg-amber-100 text-amber-700",
  },
  belum: { label: "Belum", className: "bg-gray-100 text-gray-500" },
};

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

async function createPeriod(formData) {
  "use server";
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  const supabase = await createClient();
  await supabase
    .from("dues_periods")
    .insert({ month, year, amount_default: 20000 });

  revalidatePath("/iuran");
}

async function togglePayment(formData) {
  "use server";
  const memberId = formData.get("memberId");
  const periodId = formData.get("periodId");
  const currentStatus = formData.get("currentStatus");
  const amount = Number(formData.get("amount"));
  const paymentId = formData.get("paymentId");

  const supabase = await createClient();

  if (currentStatus === "lunas") {
    if (paymentId) {
      await supabase
        .from("dues_payments")
        .update({ status: "belum", paid_at: null })
        .eq("id", paymentId);
    }
  } else if (paymentId) {
    await supabase
      .from("dues_payments")
      .update({ status: "lunas", paid_at: new Date().toISOString(), amount })
      .eq("id", paymentId);
  } else {
    await supabase.from("dues_payments").insert({
      member_id: memberId,
      period_id: periodId,
      status: "lunas",
      paid_at: new Date().toISOString(),
      amount,
    });
  }

  revalidatePath("/iuran");
}

export default async function IuranPage({ searchParams }) {
  const params = await searchParams;
  const now = new Date();
  const month = Number(params?.month) || now.getMonth() + 1;
  const year = Number(params?.year) || now.getFullYear();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, member_id")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "anggota";
  const canManage = role === "admin" || role === "pengurus";

  const { data: period } = await supabase
    .from("dues_periods")
    .select("id, amount_default, month, year")
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  const { data: activeMembers } = await supabase
    .from("members")
    .select("id, name")
    .eq("status", "aktif")
    .order("name");

  let payments = [];
  if (period) {
    const { data } = await supabase
      .from("dues_payments")
      .select(
        "id, member_id, status, paid_at, amount, claimed_amount, claimed_date, proof_url, rejection_reason"
      )
      .eq("period_id", period.id);
    payments = data ?? [];
  }

  const paymentByMember = new Map(payments.map((p) => [p.member_id, p]));
  const lunasCount = (activeMembers ?? []).filter(
    (m) => paymentByMember.get(m.id)?.status === "lunas"
  ).length;
  const pendingCount = (activeMembers ?? []).filter(
    (m) => paymentByMember.get(m.id)?.status === "pending_verifikasi"
  ).length;

  const ownPayment = profile?.member_id
    ? paymentByMember.get(profile.member_id) ?? null
    : null;

  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Iuran Bulanan</h1>
        <a
          href="/dashboard"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/iuran?month=${prevMonth}&year=${prevYear}`}
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          ← Sebelumnya
        </Link>
        <p className="font-medium text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <Link
          href={`/iuran?month=${nextMonth}&year=${nextYear}`}
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Berikutnya →
        </Link>
      </div>

      {!canManage && period && (
        <KlaimIuranCard payment={ownPayment} period={period} userId={user.id} />
      )}

      {!period ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Periode {MONTH_NAMES[month - 1]} {year} belum dibuat.
          </p>
          {canManage ? (
            <form action={createPeriod}>
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="year" value={year} />
              <button
                type="submit"
                className="rounded-lg bg-black text-white text-sm font-medium px-4 py-2"
              >
                Buat Periode (Rp20.000/anggota)
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">
              Hubungi admin untuk membuat periode ini.
            </p>
          )}
        </div>
      ) : (
        <>
          {canManage && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {lunasCount} dari {activeMembers?.length ?? 0} anggota
                    sudah bayar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Nominal: {formatRupiah(period.amount_default)}/anggota
                  </p>
                </div>
                {pendingCount > 0 && (
                  <a
                    href="/iuran/verifikasi"
                    className="text-xs rounded-lg bg-amber-100 text-amber-700 font-medium px-3 py-1.5"
                  >
                    {pendingCount} menunggu verifikasi →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white divide-y">
            {(activeMembers ?? []).map((m) => {
              const payment = paymentByMember.get(m.id);
              const status = payment?.status ?? "belum";
              const badge = STATUS_BADGE[status];
              const isPaid = status === "lunas";
              const isPending = status === "pending_verifikasi";
              return (
                <div
                  key={m.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    {isPaid && payment?.paid_at && (
                      <p className="text-xs text-gray-400">
                        Dibayar{" "}
                        {new Date(payment.paid_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short" }
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    {canManage && !isPending && (
                      <form action={togglePayment}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <input
                          type="hidden"
                          name="periodId"
                          value={period.id}
                        />
                        <input
                          type="hidden"
                          name="currentStatus"
                          value={payment?.status ?? "belum"}
                        />
                        <input
                          type="hidden"
                          name="amount"
                          value={period.amount_default}
                        />
                        <input
                          type="hidden"
                          name="paymentId"
                          value={payment?.id ?? ""}
                        />
                        <button
                          type="submit"
                          className="text-xs rounded-lg border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
                        >
                          {isPaid ? "Batalkan" : "Tandai Lunas"}
                        </button>
                      </form>
                    )}
                    {canManage && isPending && (
                      <a
                        href="/iuran/verifikasi"
                        className="text-xs rounded-lg border border-amber-300 text-amber-700 px-2.5 py-1.5 hover:bg-amber-50"
                      >
                        Verifikasi
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
