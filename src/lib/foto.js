import { sb } from './supabase';

const ascii = (b, a, z) => String.fromCharCode(...b.slice(a, z));

// Ambil foto bukti sebagai blob bertipe gambar yang benar.
// Foto HEIC/HEIF (default kamera HP) tidak bisa ditampilkan browser, jadi diubah ke JPEG dulu.
export async function fotoUrl(path) {
  if (!path) return null;
  const { data, error } = await sb.storage.from('bukti').download(path);
  if (error || !data) return null;
  try {
    const b = new Uint8Array(await data.slice(0, 16).arrayBuffer());
    const ext = (path.split('.').pop() || '').toLowerCase();
    const brand = ascii(b, 8, 12);
    const heic = ascii(b, 4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand);

    if (heic || ext === 'heic' || ext === 'heif') {
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
