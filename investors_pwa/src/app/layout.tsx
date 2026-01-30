import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreenFin - Green Investments',
  description: "Invest in India's green infrastructure",
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

