export default function manifest() {
  return {
    name: 'Kas Kantor',
    short_name: 'Kas Kantor',
    description: 'Kas dan iuran bulanan kantor',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'id',
    background_color: '#FFF4D6',
    theme_color: '#FFD93D',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
