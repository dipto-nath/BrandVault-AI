'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthHeaderProps {
  currentPage: 'login' | 'register';
}

export function AuthHeader({ currentPage }: AuthHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[72px] w-full border-b border-[#E4DCCB] bg-[#F8F4EC]/90 backdrop-blur-md transition-all">
      <div className="w-full max-w-[1280px] h-full mx-auto px-6 sm:px-10 lg:px-12 flex items-center justify-between">
        {/* Brand logo (left) - aligned with left column content */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B4BC8] rounded-[10px]"
          aria-label="BrandVault AI home"
        >
          <div className="w-8 h-8 rounded-[8px] bg-[#16203A] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck className="w-4.5 h-4.5" strokeWidth={2.2} />
          </div>
          <span className="font-serif text-[19px] sm:text-[20px] font-bold tracking-tight text-[#16203A]">
            BrandVault <span className="text-[#3B4BC8] font-sans text-xs uppercase tracking-widest font-extrabold ml-0.5">AI</span>
          </span>
        </Link>

        {/* Center Nav links */}
        <nav className="hidden sm:flex items-center gap-7 text-[13.5px] font-medium text-[#5B6477]" aria-label="Quick links">
          <Link
            href="/docs"
            className="hover:text-[#16203A] transition-colors duration-150 py-1"
          >
            Docs
          </Link>
          <Link
            href="/how-it-works"
            className="hover:text-[#16203A] transition-colors duration-150 py-1"
          >
            How it works
          </Link>
        </nav>

        {/* Right Action link - aligned with form card right edge */}
        <div className="flex items-center gap-3">
          {currentPage === 'login' ? (
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs sm:text-[13px] font-medium text-[#16203A] bg-white border border-[#E4DCCB] hover:border-[#16203A]/30 hover:bg-[#FAF6EF] shadow-2xs transition-all duration-200"
            >
              <span>Create account</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5B6477]" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs sm:text-[13px] font-medium text-[#16203A] bg-white border border-[#E4DCCB] hover:border-[#16203A]/30 hover:bg-[#FAF6EF] shadow-2xs transition-all duration-200"
            >
              <span>Sign in</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5B6477]" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
