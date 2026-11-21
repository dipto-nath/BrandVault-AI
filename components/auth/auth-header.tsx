'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthHeaderProps {
  currentPage: 'login' | 'register';
}

export function AuthHeader({ currentPage }: AuthHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 w-full px-6 sm:px-10 lg:px-12 flex items-center justify-between border-b border-[#16203A]/6 bg-[#FAF6EF]/80 backdrop-blur-md transition-all">
      {/* Brand logo (left) */}
      <Link
        href="/"
        className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B4BC8] rounded-xl pr-2"
        aria-label="BrandVault AI home"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B4BC8] to-[#1E2540] flex items-center justify-center text-white shadow-sm shadow-[#3B4BC8]/20 group-hover:scale-105 transition-transform duration-200">
          <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
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

      {/* Right Ghost link */}
      <div className="flex items-center gap-3">
        {currentPage === 'login' ? (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-[#3B4BC8] bg-[#3B4BC8]/8 hover:bg-[#3B4BC8]/15 border border-[#3B4BC8]/20 transition-all duration-200 hover:gap-2"
          >
            <span>Create account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold text-[#16203A] bg-[#16203A]/6 hover:bg-[#16203A]/12 border border-[#16203A]/12 transition-all duration-200 hover:gap-2"
          >
            <span>Sign in</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </header>
  );
}
