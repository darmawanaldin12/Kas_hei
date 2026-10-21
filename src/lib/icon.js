import { ImageResponse } from 'next/og';

// Ikon aplikasi: lingkaran kuning dengan huruf K di atas latar biru (Varian C).
// Isi dibuat di dalam area aman 80% supaya aman dipakai sebagai ikon maskable.
export function iconResponse(size) {
  const b = Math.round(size * 0.03);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#86BFFF' }}>
        <div
          style={{
            width: '66%',
            height: '66%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFE066',
            border: `${b}px solid #1A1A2E`,
            borderRadius: '50%',
            boxShadow: `${b}px ${b}px 0 #1A1A2E`,
            color: '#1A1A2E',
            fontSize: Math.round(size * 0.46),
            fontWeight: 900,
          }}
        >
          K
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
