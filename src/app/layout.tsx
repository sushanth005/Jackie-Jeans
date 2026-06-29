import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import AnimatedBg from '@/components/AnimatedBg';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jackie Jeans — Find Your Perfect Fit',
  description:
    'Jackie Jeans Fit Quiz — answer 10 quick questions and discover jeans that actually fit you.',
  keywords: ['jackie jeans', 'jeans fit quiz', 'denim fit', 'perfect jeans'],
  authors: [{ name: 'Jackie Jeans' }],
  icons: {
    icon: [
      { url: '/monogram.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/monogram.svg',
    apple: '/monogram.svg',
  },
  openGraph: {
    title: 'Jackie Jeans — Find Your Perfect Fit',
    description: 'Jeans that fit. The first time.',
    type: 'website',
    siteName: 'Jackie Jeans',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07090F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        {/* AnimatedBg is OUTSIDE PageTransition so CSS transform on the transition
            wrapper never creates a containing block that traps position:fixed */}
        <AnimatedBg />
        <Navbar />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
