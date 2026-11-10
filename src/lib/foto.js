import { sb } from './supabase';

// Ambil foto bukti sebagai blob lalu beri tipe gambar yang benar (dari isi file),
// supaya tetap tampil walau tipe file di storage kosong/salah (application/octet-stream).
export async function fotoUrl(path) {
  if (!path) return null;
  const { data, error } = await sb.storage.from('bukti').download(path);
  if (error || !data) return null;
  const b = new Uint8Array(await data.slice(0, 12).arrayBuffer());
  let t = '';
  if (b[0] === 0xff && b[1] === 0xd8) t = 'image/jpeg';
  else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) t = 'image/png';
  else if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) t = 'image/gif';
  else if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) t = 'image/webp';
  else {
    const ext = (path.split('.').pop() || '').toLowerCase();
    t = { png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif' }[ext] || 'image/jpeg';
  }
  return URL.createObjectURL(new Blob([data], { type: t }));
}
