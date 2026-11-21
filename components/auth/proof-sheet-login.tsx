'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneFrame } from './scene-frame';

const STEP_DURATIONS = [2500, 3000, 3000, 2000, 3500];
const TOTAL_STEPS = 5;

export function ProofSheetLogin() {
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<number | null>(null);
  const [isReduced, setIsReduced] = useState(false);
  const [stampImpact, setStampImpact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Loop timer
  useEffect(() => {
    if (isReduced) return;
    const now = Date.now();
    if (pausedUntil && now < pausedUntil) {
      const wait = pausedUntil - now;
      const t = setTimeout(() => setPausedUntil(null), wait);
      return () => clearTimeout(t);
    }
    if (isHovered) return;

    const timer = setTimeout(() => {
      setStep((prev) => {
        const next = (prev + 1) % TOTAL_STEPS;
        if (next === 4) {
          setStampImpact(true);
          setTimeout(() => setStampImpact(false), 300);
        }
        return next;
      });
    }, STEP_DURATIONS[step]);

    return () => clearTimeout(timer);
  }, [step, isHovered, pausedUntil, isReduced]);

  const handleTickClick = useCallback((index: number) => {
    setStep(index);
    if (index === 4) {
      setStampImpact(true);
      setTimeout(() => setStampImpact(false), 300);
    }
    setPausedUntil(Date.now() + 8000);
  }, []);

  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none pt-4 pb-2" aria-hidden="true">
      {/* SVG Filters for ink roughness */}
      <svg className="hidden" aria-hidden="true">
        <defs>
          <filter id="ink-roughness" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Behind Sheets (Pile of past reviews) */}
      <div
        className="absolute inset-0 rounded-[6px] border border-[#E4DCCB] bg-[#FBF9F4] pointer-events-none transition-transform"
        style={{
          height: 'clamp(360px, 46vh, 440px)',
          transform: 'rotate(-2.2deg) translate3d(-6px, 4px, 0)',
          boxShadow: '0 8px 24px rgba(22, 32, 58, 0.04)',
        }}
      >
        <div className="absolute top-4 right-5 opacity-25 border border-[#3F8F6B] text-[#3F8F6B] font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rotate-[-8deg] rounded-xs font-bold">
          APPROVED · BVP-2026-0000
        </div>
      </div>

      <div
        className="absolute inset-0 rounded-[6px] border border-[#E4DCCB] bg-[#FFFDF8] pointer-events-none transition-transform"
        style={{
          height: 'clamp(360px, 46vh, 440px)',
          transform: 'rotate(1.4deg) translate3d(4px, 2px, 0)',
          boxShadow: '0 8px 24px rgba(22, 32, 58, 0.04)',
        }}
      >
        <div className="absolute top-4 right-8 opacity-25 border border-[#C2402E] text-[#C2402E] font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rotate-[4deg] rounded-xs font-bold">
          REWRITTEN · BVP-2025-0988
        </div>
      </div>

      {/* Main Proof Sheet in Shared SceneFrame */}
      <SceneFrame
        onHoverChange={setIsHovered}
        ariaLabel="Interactive proof sheet demonstrating automated claim checking"
      >
        <div
          className={`relative w-full rounded-[6px] border border-[#E4DCCB] bg-[#FFFDF8] p-6 sm:p-7 flex flex-col justify-between overflow-hidden transition-transform ${
            stampImpact ? 'translate-y-[2px]' : ''
          }`}
          style={{
            height: 'clamp(360px, 46vh, 440px)',
            transform: 'rotate(-0.8deg)',
          }}
        >
          {/* Subtle paper grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* 1. Header Line */}
          <div className="border-b border-[#E4DCCB] pb-3 mb-4 flex items-center justify-between text-[11.5px] font-sans text-[#5B6477]">
            <span className="tracking-tight font-medium">Review 1042 — Campaign copy — NexTech Nova</span>
            <span className="font-mono text-[10px] text-[#5B6477]/70">p.1 of 1</span>
          </div>

          {/* 2 & 3 & 4 & 5. Editorial Body with Claim & Marginalia */}
          <div className="relative flex-1">
            <div className="relative max-w-[340px]">
              <p className="font-serif text-[22px] sm:text-[25px] leading-[1.3] text-[#16203A] font-medium">
                NexTech Nova delivers{' '}
                <span className="relative inline-block font-medium">
                  {/* Highlighter wash on Step >= 1 */}
                  {(step >= 1 || isReduced) && (
                    <motion.svg
                      className="absolute -inset-x-1.5 -inset-y-0.5 w-[calc(100%+12px)] h-[calc(100%+4px)] pointer-events-none -z-10"
                      viewBox="0 0 160 32"
                      preserveAspectRatio="none"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ transformOrigin: 'left' }}
                    >
                      <path
                        d="M 2,16 Q 40,10 80,18 Q 120,24 158,16"
                        stroke="#F59E0B"
                        strokeWidth="24"
                        strokeOpacity="0.32"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </motion.svg>
                  )}

                  {/* Strikeout on Step >= 2 */}
                  <span
                    className={
                      step >= 2
                        ? 'line-through text-[#C2402E] opacity-75 decoration-[#C2402E] decoration-2'
                        : ''
                    }
                  >
                    all-day
                  </span>
                  <span> battery life.</span>

                  {/* Footnote reference mark */}
                  <sup className="text-[12px] font-serif italic text-[#3B4BC8] font-bold ml-0.5">
                    [1]
                  </sup>
                </span>
              </p>

              {/* Corrected text in red below */}
              <div
                className={`mt-1.5 min-h-[22px] flex items-center gap-1.5 font-serif italic text-[14px] sm:text-[15px] text-[#C2402E] font-semibold tracking-tight transition-all duration-300 ${
                  step >= 2
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-1 pointer-events-none select-none'
                }`}
                aria-hidden={step < 2}
              >
                <span className="font-sans text-xs not-italic">↳</span>
                <span>up to 18 hours of mixed-use</span>
              </div>
            </div>

            {/* Marginal Note & Leader Line on Step >= 1 */}
            <AnimatePresence>
              {(step >= 1 || isReduced) && (
                <motion.div
                  className="mt-3.5 sm:mt-4 pl-3 border-l-2 border-[#E4DCCB] max-w-[360px]"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="font-serif italic text-[13px] sm:text-[13.5px] leading-relaxed text-[#16203A]">
                    <span className="font-bold text-[#3B4BC8] not-italic mr-1.5">[1]</span>
                    Spec sheet v3.2, p.4: up to 18 hrs of mixed use.
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-sans text-[#5B6477]">
                    <span className="font-medium text-[#C2402E]">Conflict:</span>
                    <span>62% of the 85% match needed</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 7. Stamped Approved Seal on Step 4 or Reduced Motion */}
            {(step === 4 || isReduced) && (
              <motion.div
                className="absolute right-2 bottom-1 pointer-events-none select-none"
                style={{ filter: 'url(#ink-roughness)' }}
                initial={isReduced ? { scale: 1, opacity: 1 } : { scale: 1.35, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="border-[2.5px] border-[#3F8F6B] rounded-[4px] p-2 sm:p-2.5 text-center font-bold"
                  style={{
                    transform: 'rotate(-6deg)',
                    color: '#3F8F6B',
                    backgroundColor: 'rgba(63, 143, 107, 0.04)',
                    boxShadow: '0 0 0 1px rgba(63, 143, 107, 0.25) inset',
                  }}
                >
                  <div className="border border-[#3F8F6B] px-3 py-1">
                    <div className="text-[14px] sm:text-[16px] tracking-[0.22em] font-extrabold uppercase font-sans leading-none">
                      APPROVED
                    </div>
                    <div className="text-[9.5px] font-mono tracking-wider font-semibold mt-1 text-[#3F8F6B]/90">
                      BVP-2026-0001 · 21 NOV
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 6. Proofreader Toolbar at Sheet Foot */}
          <div className="pt-3 border-t border-[#E4DCCB] flex items-center justify-between text-xs text-[#5B6477] font-sans">
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-all ${
                  step >= 3
                    ? 'bg-[#16203A] text-white shadow-xs'
                    : 'bg-[#F4EEE1] text-[#16203A] hover:bg-[#EAE3D5]'
                }`}
              >
                Rewrite
              </span>
              <span className="text-[#5B6477]/50">·</span>
              <span className="hover:text-[#16203A] cursor-default">Add evidence</span>
              <span className="text-[#5B6477]/50">·</span>
              <span className="hover:text-[#16203A] cursor-default">Escalate</span>
            </div>
            <span className="font-mono text-[10px] text-[#5B6477]/60">EVIDENCE-GATE</span>
          </div>
        </div>
      </SceneFrame>

      {/* Clickable Step Ink Ticks (Restrained) */}
      <div className="flex items-center justify-center gap-3 mt-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleTickClick(i)}
            aria-label={`Jump to proof sheet step ${i + 1}`}
            className="p-1 focus:outline-none"
          >
            <span
              className={`block transition-all duration-200 ${
                step === i
                  ? 'w-4 h-[2px] bg-[#16203A]'
                  : 'w-2 h-[1px] bg-[#16203A]/30 hover:bg-[#16203A]/60'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
