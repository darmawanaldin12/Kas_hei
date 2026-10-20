import { ImageResponse } from 'next/og';

// Ikon aplikasi bergaya neubrutalism: kotak pink tebal di atas latar kuning.
// Isi dibuat di dalam area aman 80% supaya aman dipakai sebagai ikon maskable.
export function iconResponse(size) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFD93D' }}>
        <div
          style={{
            width: '66%',
            height: '66%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FF6B9D',
            border: `${Math.round(size * 0.03)}px solid #111111`,
            boxShadow: `${Math.round(size * 0.03)}px ${Math.round(size * 0.03)}px 0 #111111`,
            color: '#111111',
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
