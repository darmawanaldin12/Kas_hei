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
    background_color: '#86BFFF',
    theme_color: '#86BFFF',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
