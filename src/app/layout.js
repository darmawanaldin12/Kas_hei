import './globals.css';
import { Bricolage_Grotesque } from 'next/font/google';
import PwaRegister from '../components/PwaRegister';

const font = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Kas Kantor',
  description: 'Kas dan iuran bulanan kantor',
  applicationName: 'Kas Kantor',
  icons: { icon: '/icon-192', apple: '/icon-192' },
  appleWebApp: { capable: true, title: 'Kas Kantor', statusBarStyle: 'default' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#86BFFF' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={font.className}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
