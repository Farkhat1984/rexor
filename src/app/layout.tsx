import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "REXOR — Магазин наручных часов",
  description: "Каталог наручных часов в Алматы. Широкий ассортимент брендов по честным ценам.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1D2223",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="pb-16">
        <AuthProvider>
          <main className="min-h-screen">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
