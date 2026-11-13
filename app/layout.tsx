import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
const inter = Inter({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

export const metadata: Metadata = {
  title: 'BrandVault AI — Evidence-First Brand Governance',
  description: 'Verify content against approved brand knowledge, explain every issue and keep every publishing decision accountable.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
