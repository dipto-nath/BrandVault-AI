"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({
  text,
  className = "",
  showAsterisk = false,
  style,
}: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
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
          animate={isInView ? { y: 0, opacity: 1 } : {}}
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

/* ---------------- Hero ---------------- */
export interface NavItem {
  label: string;
  href: string;
}

export interface PrismaHeroProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  navItems?: NavItem[];
  videoSrc?: string;
}

const defaultNavItems: NavItem[] = [
  { label: "Overview", href: "/overview" },
  { label: "Reviews", href: "/reviews" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Guidelines", href: "/guidelines" },
  { label: "Passports", href: "/passports" },
  { label: "Insights", href: "/insights" },
];

const PrismaHero = ({
  title = "BrandVault AI",
  description = "BrandVault AI is a pre-publication review gate for brand content. It verifies claims against approved knowledge, explains every finding with traceable citations, and keeps every decision accountable.",
  ctaText = "Explore Platform",
  ctaHref = "/overview",
  secondaryCtaText = "Open Demo",
  secondaryCtaHref = "/demo",
  navItems = defaultNavItems,
  videoSrc = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4",
}: PrismaHeroProps) => {
  return (
    <section className="h-screen w-full">
      <div className="relative h-full w-full overflow-hidden bg-[#141210]">
        
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        {/* Navbar — styled to precisely match the clean, warm-ivory editorial reference */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2 max-w-[96vw]">
          <div className="flex items-center gap-5 sm:gap-8 md:gap-12 lg:gap-14 rounded-b-[24px] md:rounded-b-[28px] bg-black px-6 sm:px-9 md:px-12 py-3.5 md:py-4.5 font-jakarta overflow-x-auto no-scrollbar">
            <Link
              href="/"
              className="text-[14px] sm:text-[15px] md:text-[16px] font-medium tracking-tight text-[#EFECE1] hover:text-white transition-colors duration-200 whitespace-nowrap"
            >
              BrandVault
            </Link>

            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[13px] sm:text-[14.5px] md:text-[15.5px] font-normal tracking-tight text-[#E8E4D5]/90 hover:text-white transition-colors duration-200 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 sm:px-8 sm:pb-8 md:px-12 md:pb-12 lg:px-14 lg:pb-12">
          <div className="grid grid-cols-12 items-end gap-6 lg:gap-8">
            
            {/* Wordmark Column: strictly sized so it never overflows */}
            <div className="col-span-12 lg:col-span-7 min-w-0">
              <h1
                className="font-jakarta font-medium leading-[0.88] tracking-[-0.06em] select-none text-[#EFECE1]"
                style={{
                  fontSize: "clamp(3.2rem, 6.8vw, 8.5rem)",
                }}
              >
                <WordsPullUp text={title} showAsterisk={false} />
              </h1>
            </div>

            {/* Content Column: cleanly positioned with dedicated width, styled to match reference */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 sm:gap-6 pb-1 lg:pb-3 max-w-xl lg:ml-auto">
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="font-jakarta text-[14.5px] sm:text-[16px] md:text-[17px] font-normal leading-[1.56] tracking-[-0.01em] text-[#EDEAE2]/90"
              >
                {description}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3.5 pt-1 flex-wrap"
              >
                <Link
                  href={ctaHref}
                  className="group inline-flex items-center gap-3.5 self-start rounded-full py-2 pl-7 pr-2.5 font-jakarta text-[15px] sm:text-[16px] font-medium tracking-tight transition-all duration-200 hover:gap-4 shadow-sm"
                  style={{ background: "#EDEAE1", color: "#0F141A" }}
                >
                  <span>{ctaText}</span>
                  <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black transition-transform duration-200 group-hover:scale-105">
                    <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#EDEAE1]" />
                  </span>
                </Link>

                {secondaryCtaText && (
                  <Link
                    href={secondaryCtaHref}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full font-jakarta text-[14.5px] sm:text-[15.5px] font-medium tracking-tight transition-all duration-200"
                    style={{
                      background: "rgba(237, 234, 225, 0.12)",
                      color: "#EDEAE1",
                      border: "1px solid rgba(237, 234, 225, 0.22)",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(237, 234, 225, 0.22)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(237, 234, 225, 0.12)")}
                  >
                    {secondaryCtaText}
                  </Link>
                )}
              </motion.div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export { PrismaHero };
export default PrismaHero;
