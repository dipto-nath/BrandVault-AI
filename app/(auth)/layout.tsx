import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FBF7EF] text-[#1E2540] flex flex-col selection:bg-[#E3EAFA] selection:text-[#2F4FB3]">
      {/* Top Header */}
      <header className="w-full border-b border-[#E6DCC8]/60 bg-[#FFFDF9]/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#2F4FB3] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-lg tracking-tight text-[#1E2540]">
            BrandVault <span className="text-[#2F4FB3] font-sans font-medium text-sm">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs text-[#4C5470] hidden sm:inline">Exploring the system?</span>
          <Link
            href="/demo"
            className="px-3.5 py-1.5 rounded-lg border border-[#E6DCC8] bg-[#F4EEE1]/80 hover:bg-[#E6DCC8]/60 text-xs font-medium text-[#1E2540] transition-colors"
          >
            Try the demo &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#4C5470]/80 border-t border-[#E6DCC8]/40">
        Evidence-first brand governance &middot; Pre-publication review gate
      </footer>
    </div>
  );
}
