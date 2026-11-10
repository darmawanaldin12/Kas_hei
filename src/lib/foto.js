import { sb } from './supabase';

const ascii = (b, a, z) => String.fromCharCode(...b.slice(a, z));

function adaHeic(b, ext, tipe) {
  const brand = ascii(b, 8, 12);
  return (ascii(b, 4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand))
    || ext === 'heic' || ext === 'heif' || /hei[cf]/.test(tipe || '');
}

// Ambil foto bukti sebagai blob bertipe gambar yang benar.
// Foto HEIC/HEIF (default kamera HP, upload lama) tidak bisa ditampilkan browser, jadi diubah ke JPEG dulu.
export async function fotoUrl(path) {
  if (!path) return null;
  const { data, error } = await sb.storage.from('bukti').download(path);
  if (error || !data) return null;
  try {
    const b = new Uint8Array(await data.slice(0, 16).arrayBuffer());
    const ext = (path.split('.').pop() || '').toLowerCase();

    if (adaHeic(b, ext, '')) {
      const heic2any = (await import('heic2any')).default;
      const out = await heic2any({ blob: new Blob([data], { type: 'image/heic' }), toType: 'image/jpeg', quality: 0.85 });
      return URL.createObjectURL(Array.isArray(out) ? out[0] : out);
    }

    let t = '';
    if (b[0] === 0xff && b[1] === 0xd8) t = 'image/jpeg';
    else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) t = 'image/png';
    else if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) t = 'image/gif';
    else if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') t = 'image/webp';
    else t = { png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] || 'image/jpeg';
    return URL.createObjectURL(new Blob([data], { type: t }));
  } catch (e) {
    return null;
  }
}

// Dipanggil sebelum unggah: HEIC diubah ke JPEG, sisi terpanjang dibatasi 1600px, kualitas 85%.
// Kalau gagal di tengah jalan, file asli dikembalikan apa adanya.
export async function siapkanFoto(file) {
  try {
    const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const ext = ((file.name || '').split('.').pop() || '').toLowerCase();
    let blob = file;
    if (adaHeic(b, ext, file.type)) {
      const heic2any = (await import('heic2any')).default;
      const out = await heic2any({ blob: new Blob([file], { type: 'image/heic' }), toType: 'image/jpeg', quality: 0.9 });
      blob = Array.isArray(out) ? out[0] : out;
    }
    const bmp = await createImageBitmap(blob);
    const sk = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * sk));
    c.height = Math.max(1, Math.round(bmp.height * sk));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
    if (!out) return file;
    const nama = (file.name || 'bukti').replace(/\.[^.]+$/, '') + '.jpg';
    return new File([out], nama, { type: 'image/jpeg' });
  } catch (e) {
    return file;
  }
}
