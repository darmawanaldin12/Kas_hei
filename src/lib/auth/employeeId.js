// Supabase Auth wajib pakai format email. Karena login anggota pakai
// Nama Lengkap + Nomor ID Card (bukan email asli), kita konversi nama
// jadi "email internal" yang konsisten & tidak pernah terlihat user.
//
// Domain buatan seperti ".internal" atau ".app" (yang tidak benar-benar
// terdaftar) ditolak Supabase Auth sebagai "invalid". Jadi kita pakai
// domain yang pasti valid (gmail.com) dengan prefix unik supaya tidak
// tabrakan dengan email asli siapa pun. Email ini TIDAK PERNAH dipakai
// untuk kirim/terima pesan sungguhan — murni identitas internal.
//
// CATATAN: karena nama dipakai sebagai identitas unik, dua anggota
// dengan nama PERSIS SAMA akan bentrok. Kalau terjadi, tambahkan
// inisial/nama tengah saat daftar untuk membedakan.
export function nameToEmail(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `kaskantor.member.${slug}@gmail.com`;
}
