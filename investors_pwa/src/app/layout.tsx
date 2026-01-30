import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenFin - Green Investments',
  description: "Invest in India's green infrastructure. Earn Green Credits on every investment.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GreenFin',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto min-h-screen">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
