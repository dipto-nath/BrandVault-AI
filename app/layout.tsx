import type { Metadata } from 'next';
import { Inter, Newsreader, Plus_Jakarta_Sans, Nunito, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-rounded',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrandVault AI — Evidence-First Brand Governance',
  description: 'Verify content against approved brand knowledge, explain every issue and keep every publishing decision accountable.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} ${nunito.variable} ${outfit.variable} ${newsreader.variable} antialiased`}>{children}</body>
    </html>
  );
}
