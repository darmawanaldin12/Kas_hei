import './globals.css';

export const metadata = { title: 'Kas Kantor', description: 'Kas dan iuran bulanan kantor' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
