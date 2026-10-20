import './globals.css';
import PwaRegister from '../components/PwaRegister';

export const metadata = {
  title: 'Kas Kantor',
  description: 'Kas dan iuran bulanan kantor',
  applicationName: 'Kas Kantor',
  icons: { icon: '/icon-192', apple: '/icon-192' },
  appleWebApp: { capable: true, title: 'Kas Kantor', statusBarStyle: 'default' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFD93D' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
