"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight, ChevronDown, LogIn, LayoutDashboard, LogOut, ShieldCheck, FileCheck, SearchCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { AuthGateModal } from "@/components/auth/auth-gate-modal";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
  stacked?: boolean;
}

export const WordsPullUp = ({
  text,
  className = "",
  showAsterisk = false,
  style,
  stacked = false,
}: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div
      ref={ref}
      className={`${stacked ? "inline-flex flex-col items-start" : "inline-flex flex-wrap"} ${className}`}
      style={style}
    >
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`inline-block relative ${stacked ? "leading-[0.84]" : ""}`}
            style={{ marginRight: stacked || isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span
                className="absolute top-[0.1em] -right-[0.38em] text-[0.42em] leading-none select-none font-normal"
                style={{ color: "#E1E0CC" }}
              >
                *
              </span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: React.CSSProperties;
}

export const WordsPullUpMultiStyle = ({
  segments,
  className = "",
  style,
}: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

export interface NavItem {
  label: string;
  href: string;
}

const defaultNavItems: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Reviews", href: "/reviews" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Guidelines", href: "/guidelines" },
  { label: "Passports", href: "/passports" },
  { label: "Insights", href: "/insights" },
];

export interface PrismaHeroProps {
  initialUser?: {
    name: string;
    email?: string;
    role: string;
    workspace: string;
  } | null;
  videoSrc?: string;
}

export function PrismaHero({
  initialUser = null,
  videoSrc = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4",
}: PrismaHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<string>("/overview");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check URL query for ?auth=required from middleware redirect
  useEffect(() => {
    if (searchParams.get("auth") === "required") {
      const nextPath = searchParams.get("next") || "/overview";
      setModalTarget(nextPath);
      setModalOpen(true);
    }
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (!initialUser) {
      e.preventDefault();
      setModalTarget(href);
      setModalOpen(true);
    }
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    if (initialUser) {
      router.push("/overview");
    } else {
      e.preventDefault();
      setModalTarget("/overview");
      setModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  return (
    <div className="relative w-full">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden bg-[#141210]">
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
        />

        {/* Noise overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

        {/* Navbar */}
        <nav className="absolute left-1/2 top-0 z-30 -translate-x-1/2 max-w-[96vw]">
          <div className="flex items-center gap-4 sm:gap-7 md:gap-9 lg:gap-11 rounded-b-[24px] md:rounded-b-[28px] bg-black/95 border-b border-x border-[#EDEAE1]/15 px-5 sm:px-8 md:px-10 py-3 md:py-3.5 font-sans overflow-x-auto no-scrollbar shadow-lg backdrop-blur-md">
            {/* Wordmark */}
            <Link
              href="/"
              className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold tracking-tight text-[#EFECE1] hover:text-white transition-colors duration-200 flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="font-serif text-[17px] tracking-tight text-white">BrandVault</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#2F4FB3]/40 border border-[#2F4FB3]/50 text-[#8EA8F5]">
                AI
              </span>
            </Link>

            {/* Nav links */}
            {defaultNavItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-[13px] sm:text-[14px] font-normal tracking-tight text-[#E8E4D5]/80 hover:text-white transition-colors duration-200 whitespace-nowrap cursor-pointer"
              >
                {item.label}
              </button>
            ))}

            {/* Auth Pill */}
            {initialUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#EDEAE1] hover:bg-white text-[#0F141A] px-3.5 py-1.5 text-xs font-medium tracking-tight transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#2F4FB3]" />
                  <span>Dashboard</span>
                  <ChevronDown className="w-3 h-3 text-[#5A627A]" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] shadow-xl py-2 text-[#1E2540] z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-[#E8E2D5]/70">
                      <p className="text-xs font-semibold text-[#1E2540] truncate">{initialUser.name}</p>
                      <p className="text-[11px] text-[#6B7280] capitalize">{initialUser.role.toLowerCase()}</p>
                    </div>
                    <Link
                      href="/overview"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#1E2540] hover:bg-[#EDE8DE] transition-colors"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#2F4FB3]" />
                      <span>Workspace Overview</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#B24A4A] hover:bg-[#B24A4A]/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-full bg-[#EDEAE1] hover:bg-white text-[#0F141A] px-4 py-1.5 text-xs sm:text-sm font-medium tracking-tight transition-all shadow-sm whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 text-[#2F4FB3]" />
                <span>Login</span>
                <ArrowRight className="w-3 h-3 text-[#0F141A] transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </nav>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 sm:px-8 sm:pb-10 md:px-12 md:pb-14 lg:px-16 lg:pb-14">
          <div className="grid grid-cols-12 items-end gap-6 lg:gap-10">
            {/* Wordmark Column */}
            <div className="col-span-12 lg:col-span-7 min-w-0">
              <div className="mb-2">
                <span className="inline-block text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-[#EDEAE2]/70">
                  Evidence-First Brand Governance
                </span>
              </div>
              <h1
                className="font-serif font-bold leading-[0.85] tracking-[-0.04em] select-none text-[#EFECE1]"
                style={{
                  fontSize: "clamp(2.8rem, 8.2vw, 9.6rem)",
                }}
              >
                <WordsPullUp text="BrandVault" showAsterisk={false} stacked />
              </h1>
            </div>

            {/* Content Column */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 sm:gap-5 pb-1 lg:pb-3 max-w-xl lg:ml-auto">
              {/* Product value prop understood in five seconds */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <p className="text-xs sm:text-[13px] font-medium text-[#EDEAE1] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8EA8F5] shrink-0" />
                  <span>Every claim checked against approved sources before it goes live.</span>
                </p>
              </div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-[14.5px] sm:text-[16px] font-normal leading-[1.56] tracking-[-0.01em] text-[#EDEAE2]/85"
              >
                BrandVault AI is a pre-publication review gate for brand content. It verifies claims against approved knowledge, explains every finding with traceable citations, and keeps every decision accountable.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-2.5 pt-1"
              >
                <div className="flex items-center gap-3.5 flex-wrap">
                  {/* Primary Button: Explore Platform */}
                  <button
                    type="button"
                    onClick={handleExploreClick}
                    className="group inline-flex items-center gap-3.5 self-start rounded-full py-2 pl-6 pr-2 font-sans text-[14.5px] sm:text-[15.5px] font-medium tracking-tight transition-all duration-200 hover:gap-4 shadow-sm"
                    style={{ background: "#EDEAE1", color: "#0F141A" }}
                  >
                    <span>Explore Platform</span>
                    <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black transition-transform duration-200 group-hover:scale-105">
                      <ArrowRight className="h-4 w-4 text-[#EDEAE1]" />
                    </span>
                  </button>

                  {/* Secondary Glass Pill: Login */}
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full font-sans text-[14px] sm:text-[15px] font-medium tracking-tight transition-all duration-200"
                    style={{
                      background: "rgba(237, 234, 225, 0.12)",
                      color: "#EDEAE1",
                      border: "1px solid rgba(237, 234, 225, 0.22)",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(237, 234, 225, 0.22)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(237, 234, 225, 0.12)")}
                  >
                    Login
                  </Link>
                </div>

                {/* Sublink: New here? Create workspace */}
                <p className="text-xs text-[#EDEAE2]/60 pt-1">
                  New here?{" "}
                  <Link href="/signup" className="text-[#EDEAE2] font-medium underline underline-offset-4 hover:text-white transition-colors">
                    Create workspace
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works 4-Step Strip */}
      <section className="relative w-full bg-[#1A1816] border-t border-[#EDEAE1]/10 py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#8EA8F5]">Workflow</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#EFECE1] mt-1.5">
              How BrandVault Verifies Content
            </h2>
            <p className="text-sm text-[#EDEAE2]/70 max-w-xl mx-auto mt-2">
              A transparent four-stage pipeline connecting claims to approved ground truth.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#2F4FB3]/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-[#EDEAE2]/80">01</span>
                <FileCheck className="w-5 h-5 text-[#8EA8F5]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white mb-2">Submit</h3>
              <p className="text-xs leading-relaxed text-[#EDEAE2]/70">
                Paste campaign drafts, ad copy, or upload product spec sheets into the Review Studio.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#2F4FB3]/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-[#EDEAE2]/80">02</span>
                <SearchCheck className="w-5 h-5 text-[#E6A23C]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white mb-2">Verify Sources</h3>
              <p className="text-xs leading-relaxed text-[#EDEAE2]/70">
                AI extracts claims, runs exact-match tests against approved facts, and retrieves citation chunks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#2F4FB3]/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-[#EDEAE2]/80">03</span>
                <CheckCircle2 className="w-5 h-5 text-[#4BB543]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white mb-2">Review & Correct</h3>
              <p className="text-xs leading-relaxed text-[#EDEAE2]/70">
                A human reviewer accepts, edits, or overrides findings with written rationale. AI never publishes.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#2F4FB3]/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-[#EDEAE2]/80">04</span>
                <ShieldCheck className="w-5 h-5 text-[#2F4FB3]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-white mb-2">Evidence Passport</h3>
              <p className="text-xs leading-relaxed text-[#EDEAE2]/70">
                Generate a tamper-evident audit passport with a cryptographic hash and exportable decision trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Gate Modal */}
      <AuthGateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        destinationPath={modalTarget}
      />
    </div>
  );
}

export default PrismaHero;
