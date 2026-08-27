"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export default function TransaksiClient({
  canInput,
  categories,
  initialTransactions,
  members,
  memberName,
}) {
  const supabase = createClient();

  const [type, setType] = useState("in");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredCategories = categories.filter((c) => c.type === type);
  const uniqueCategoryNames = [...new Set(categories.map((c) => c.name))];

  // 4.8: cek klaim iuran pending untuk anggota yang sama & periode yang sama,
  // supaya bendahara tidak input manual dobel untuk transaksi yang sudah diklaim anggota.
  useEffect(() => {
    let cancelled = false;

    async function checkDuplicateClaim() {
      setDuplicateWarning("");

      const selectedCategory = categories.find((c) => c.id === categoryId);
      if (type !== "in" || !memberId || selectedCategory?.name !== "Iuran") {
        return;
      }

      const d = new Date(date);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      const { data: period } = await supabase
        .from("dues_periods")
        .select("id")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (!period || cancelled) return;

      const { data: pending } = await supabase
        .from("dues_payments")
        .select("id")
        .eq("member_id", memberId)
        .eq("period_id", period.id)
        .eq("status", "pending_verifikasi")
        .maybeSingle();

      if (pending && !cancelled) {
        setDuplicateWarning(
          "Anggota ini sudah punya klaim iuran yang menunggu verifikasi untuk periode ini. Cek halaman Verifikasi Iuran dulu sebelum input manual, supaya tidak tercatat dobel."
        );
      }
    }

    checkDuplicateClaim();
    return () => {
      cancelled = true;
    };
  }, [memberId, categoryId, date, type, categories, supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!categoryId || !amount) {
      setError("Kategori dan nominal wajib diisi.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: insertError } = await supabase
      .from("transactions")
      .insert({
        type,
        category_id: categoryId,
        member_id: memberId || null,
        amount: Number(amount),
        date,
        description: description || null,
        created_by: user.id,
      })
      .select(
        "id, type, amount, date, description, created_at, categories(name), members(name)"
      )
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTransactions((prev) => [
      { ...data, profiles: { members: { name: memberName } } },
      ...prev,
    ]);
    setAmount("");
    setDescription("");
    setCategoryId("");
    setMemberId("");
    setDuplicateWarning("");
  }

  const visibleTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.categories?.name !== filterCategory)
      return false;
    return true;
  });

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Transaksi Kas</h1>
        <a
          href="/dashboard"
          className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Dashboard
        </a>
      </div>

      {canInput && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-4"
        >
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              type="button"
              onClick={() => {
                setType("in");
                setCategoryId("");
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === "in"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setType("out");
                setCategoryId("");
              }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === "out"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    categoryId === c.id
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Anggota <span className="text-gray-400">(opsional)</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
            >
              <option value="">— Tidak spesifik —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Isi kalau ini pembayaran dari anggota tertentu (mis. Iuran).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nominal</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Keterangan <span className="text-gray-400">(opsional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/80"
            />
          </div>

          {duplicateWarning && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ⚠️ {duplicateWarning}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg text-white text-sm font-medium py-2.5 disabled:opacity-50 ${
              type === "in" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {loading
              ? "Menyimpan..."
              : `Simpan ${type === "in" ? "Pemasukan" : "Pengeluaran"}`}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Riwayat Transaksi
        </h2>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs rounded-lg border border-gray-300 px-2 py-1"
          >
            <option value="all">Semua Jenis</option>
            <option value="in">Pemasukan</option>
            <option value="out">Pengeluaran</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs rounded-lg border border-gray-300 px-2 py-1"
          >
            <option value="all">Semua Kategori</option>
            {uniqueCategoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white divide-y">
        {visibleTransactions.length === 0 && (
          <p className="p-6 text-sm text-gray-500 text-center">
            Belum ada transaksi.
          </p>
        )}
        {visibleTransactions.map((t) => (
          <div
            key={t.id}
            className="p-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-medium">{t.categories?.name ?? "-"}</p>
              <p className="text-xs text-gray-500">
                {new Date(t.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {t.description ? ` · ${t.description}` : ""}
              </p>
              {t.members?.name && (
                <p className="text-xs text-blue-600 font-medium">
                  Anggota: {t.members.name}
                </p>
              )}
              {t.profiles?.members?.name && (
                <p className="text-xs text-gray-400">
                  oleh {t.profiles.members.name}
                </p>
              )}
            </div>
            <p
              className={`text-sm font-semibold whitespace-nowrap ${
                t.type === "in" ? "text-green-600" : "text-red-600"
              }`}
            >
              {t.type === "in" ? "+" : "-"} {formatRupiah(t.amount)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
