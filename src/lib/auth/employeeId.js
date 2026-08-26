// Supabase Auth wajib pakai format email. Karena login anggota
// pakai Nomor ID Card + PIN (bukan email), kita konversi nomor ID
// jadi "email internal" yang konsisten & tidak pernah terlihat user.
export function employeeIdToEmail(employeeId) {
  const normalized = employeeId.trim().toLowerCase().replace(/\s+/g, "");
  return `${normalized}@kaskantor.internal`;
}
