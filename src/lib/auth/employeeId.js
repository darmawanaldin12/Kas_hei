// Supabase Auth wajib pakai format email. Karena login anggota
// pakai Nomor ID Card + PIN (bukan email), kita konversi nomor ID
// jadi "email internal" yang konsisten & tidak pernah terlihat user.
//
// Domain buatan seperti ".internal" atau ".app" (yang tidak benar-benar
// terdaftar) ditolak Supabase Auth sebagai "invalid". Jadi kita pakai
// domain yang pasti valid (gmail.com) dengan prefix unik supaya tidak
// tabrakan dengan email asli siapa pun. Email ini TIDAK PERNAH dipakai
// untuk kirim/terima pesan sungguhan — murni identitas internal.
export function employeeIdToEmail(employeeId) {
  const normalized = employeeId.trim().toLowerCase().replace(/\s+/g, "");
  return `kaskantor.member.${normalized}@gmail.com`;
}
