import "./globals.css";

export const metadata = {
  title: "KasKu — Kas Kantor",
  description: "Aplikasi pencatatan kas kantor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
