'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  QrCode,
  Shield,
  MousePointer2,
} from 'lucide-react';

/* 14s loop step definitions:
 * Step 0 (0 - 3s): Sentence with scanning beam, amber wavy underline, "Needs evidence" chip.
 * Step 1 (3 - 6s): Citation card slides in, similarity bar fills to 62% (coral), chip changes to "Conflict".
 * Step 2 (6 - 8.5s): Resolution buttons stagger in, virtual cursor glides in and clicks "Rewrite".
 * Step 3 (8.5 - 11.5s): Sentence morphs to approved copy, confetti burst, chip turns sage "Approved".
 * Step 4 (11.5 - 14.5s): Evidence Passport ticket stamps in with slight rotation & bounce, holds, then loops.
 */
const TOTAL_STEPS = 5;
const STEP_DURATIONS = [3000, 3000, 2500, 3000, 3000];

export function ClaimDemoShowpiece() {
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isReduced, setIsReduced] = useState(false);
  const [isInView, setIsInView] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reduced motion detection
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // IntersectionObserver to pause when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Single deterministic timer state machine
  useEffect(() => {
    if (isReduced || !isInView) return;

    const now = Date.now();
    if (pausedUntil && now < pausedUntil) {
      const waitTime = pausedUntil - now;
      const t = setTimeout(() => setPausedUntil(null), waitTime);
      return () => clearTimeout(t);
    }

    if (isHovered) return;

    const duration = STEP_DURATIONS[step];
    const timer = setTimeout(() => {
      setStep((prev) => (prev + 1) % TOTAL_STEPS);
    }, duration);

    return () => clearTimeout(timer);
  }, [step, isHovered, pausedUntil, isReduced, isInView]);

  const handleDotClick = useCallback((index: number) => {
    setStep(index);
    setPausedUntil(Date.now() + 8000); // Pause auto-loop for 8s on manual dot click
  }, []);

  // 3D tilt tracking (perspective 1000px, max 6 deg, transform only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setMousePos({
      x: (nx - 0.5) * 12, // max ~6 deg
      y: (ny - 0.5) * -12,
    });
    setGlarePos({
      x: nx * 100,
      y: ny * 100,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[530px] mx-auto select-none pt-7 pb-4"
      aria-hidden="true"
      role="region"
      aria-label="Interactive demo showing automated brand claim review and Evidence Passport verification"
    >
      {/* Floating Tag 1: Top Left */}
      <motion.div
        className="hidden md:flex absolute -top-1 left-2 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-[#EDEAE2] bg-[#16203A]/90 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none"
        animate={
          isReduced
            ? {}
            : {
                transform: [
                  'translate3d(0, 0px, 0)',
                  'translate3d(0, -6px, 0)',
                  'translate3d(0, 0px, 0)',
                ],
              }
        }
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F6B]" />
        <span>Verified against approved sources</span>
      </motion.div>

      {/* Floating Tag 2: Top Right */}
      <motion.div
        className="hidden md:flex absolute -top-2 right-4 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-[#EDEAE2] bg-[#16203A]/90 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none"
        animate={
          isReduced
            ? {}
            : {
                transform: [
                  'translate3d(0, 0px, 0)',
                  'translate3d(0, 6px, 0)',
                  'translate3d(0, 0px, 0)',
                ],
              }
        }
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D9922B]" />
        <span>Human decision required</span>
      </motion.div>

      {/* Floating Tag 3: Bottom Left */}
      <motion.div
        className="hidden md:flex absolute bottom-5 -left-4 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-[#EDEAE2] bg-[#16203A]/90 backdrop-blur-md border border-white/10 shadow-lg pointer-events-none"
        animate={
          isReduced
            ? {}
            : {
                transform: [
                  'translate3d(0, 0px, 0)',
                  'translate3d(0, -5px, 0)',
                  'translate3d(0, 0px, 0)',
                ],
              }
        }
        transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#3B4BC8]" />
        <span>Every claim cited</span>
      </motion.div>

      {/* 3D Tilt Wrapper */}
      <div
        style={{
          perspective: 1000,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* Main Dark Navy Glass Demo Card with Fixed Height */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-white/[0.12] transition-transform duration-200 ease-out will-change-transform"
          style={{
            height: 'clamp(380px, 46vh, 440px)',
            background: 'linear-gradient(145deg, #12192E 0%, #1A2447 100%)',
            boxShadow: '0 20px 50px -12px rgba(18,25,46,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 40px rgba(59,75,200,0.18)',
            transform: isReduced
              ? 'none'
              : `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          }}
        >
          {/* Glare Highlight overlay */}
          {!isReduced && (
            <div
              className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.12) 0%, transparent 80%)`,
              }}
            />
          )}

          {/* Top Edge Specular Reflection */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* Chrome / Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-black/20 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/80" />
              </div>
              <span className="font-mono text-[11px] font-semibold text-[#8EA8F5] tracking-tight ml-2">
                Review #1042
              </span>
            </div>

            {/* Avatar Stack + Live Pulse */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5 items-center">
                <span className="w-5 h-5 rounded-full bg-[#3B4BC8] border border-[#12192E] text-[9px] font-bold text-white flex items-center justify-center">
                  DN
                </span>
                <span className="w-5 h-5 rounded-full bg-[#3F8F6B] border border-[#12192E] text-[9px] font-bold text-white flex items-center justify-center">
                  AI
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#A8B4D4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F6B] animate-pulse" />
                <span>Live Studio</span>
              </div>
            </div>
          </div>

          {/* Card Body - Completely Fixed Container */}
          <div className="relative p-5 sm:p-6 h-[calc(100%-48px)] overflow-hidden">
            {/* Sentence Headline Area */}
            <div className="relative min-h-[64px] mb-4">
              {/* Scanning beam animation */}
              <div className="relative overflow-hidden py-1">
                {step <= 2 ? (
                  <p className="font-serif text-[17px] sm:text-[18.5px] leading-snug text-white font-medium">
                    NexTech Nova delivers{' '}
                    <span className="relative inline-block font-semibold">
                      <span className="text-[#FCD34D]">all-day battery life.</span>
                      {/* Wavy Underline */}
                      <svg
                        className="absolute -bottom-1 left-0 w-full h-2 text-[#F59E0B]"
                        viewBox="0 0 100 8"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0 4 Q 12.5 0, 25 4 T 50 4 T 75 4 T 100 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </span>
                  </p>
                ) : (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="font-serif text-[17px] sm:text-[18.5px] leading-snug text-white font-medium"
                  >
                    NexTech Nova delivers{' '}
                    <span className="text-[#34D399] font-semibold bg-[#3F8F6B]/20 px-1 rounded border border-[#3F8F6B]/40">
                      up to 18 hours of mixed-use battery life*
                    </span>
                  </motion.p>
                )}

                {/* Laser / Scanner Line during initial steps */}
                {step === 0 && !isReduced && (
                  <motion.div
                    className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[#8EA8F5]/30 to-transparent pointer-events-none"
                    initial={{ x: -100 }}
                    animate={{ x: 450 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>

              {/* Status Chip */}
              <div className="mt-2.5 flex items-center gap-2">
                {step === 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-[#D9922B]/20 text-[#FBBF24] border border-[#D9922B]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-ping" />
                    Needs evidence
                  </span>
                )}
                {(step === 1 || step === 2) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-[#D4553F]/20 text-[#F87171] border border-[#D4553F]/40">
                    <AlertTriangle className="w-3 h-3" />
                    Conflict · 62% Match
                  </span>
                )}
                {step >= 3 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-[#3F8F6B]/25 text-[#34D399] border border-[#3F8F6B]/40">
                    <CheckCircle2 className="w-3 h-3" />
                    Approved
                  </span>
                )}
              </div>
            </div>

            {/* STACKED ABSOLUTE STAGES: Zero height reflow */}
            <div className="relative w-full h-[180px]">
              {/* STAGE 1 & 2: Citation Card + Resolution Controls */}
              <div
                className="absolute inset-0 transition-all duration-400 ease-out"
                style={{
                  opacity: step === 1 || step === 2 ? 1 : 0,
                  transform:
                    step === 1 || step === 2
                      ? 'translate3d(0, 0, 0)'
                      : step < 1
                      ? 'translate3d(0, 16px, 0)'
                      : 'translate3d(0, -16px, 0)',
                  pointerEvents: step === 1 || step === 2 ? 'auto' : 'none',
                  visibility: step === 1 || step === 2 ? 'visible' : 'hidden',
                }}
              >
                {/* Citation box */}
                <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md mb-2.5">
                  <div className="flex items-center justify-between text-xs text-[#A8B4D4] mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#34D399]" />
                      <span className="font-semibold text-white">Approved Ground Truth</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#8EA8F5]">p.4 §3.2</span>
                  </div>
                  <p className="text-xs text-[#EDEAE2] font-mono leading-relaxed bg-black/30 p-2 rounded-lg border border-white/5">
                    &ldquo;Up to 18 hrs mixed use audio/video playback&rdquo;
                  </p>

                  {/* Similarity Progress Bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] font-mono text-[#A8B4D4] mb-1">
                      <span>Claim compatibility</span>
                      <span className="text-[#F87171] font-bold">62% (Threshold 85%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D9922B] to-[#D4553F] rounded-full transition-all duration-700"
                        style={{ width: step >= 1 ? '62%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Resolution Buttons (Step 2 active) */}
                <div className="relative flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                      step === 2
                        ? 'bg-[#3B4BC8] text-white border-[#8EA8F5] shadow-md shadow-[#3B4BC8]/40 scale-[1.02]'
                        : 'bg-white/5 text-[#A8B4D4] border-white/10'
                    }`}
                  >
                    Rewrite to match
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A8B4D4] bg-white/5 border border-white/10"
                  >
                    Add evidence
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A8B4D4] bg-white/5 border border-white/10"
                  >
                    Escalate
                  </button>

                  {/* Animated Virtual Cursor clicking Rewrite */}
                  {step === 2 && !isReduced && (
                    <motion.div
                      className="absolute left-16 top-6 text-white pointer-events-none drop-shadow-md z-30"
                      initial={{ x: 80, y: 30, opacity: 0 }}
                      animate={{ x: 20, y: -4, opacity: 1 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <MousePointer2 className="w-5 h-5 fill-white text-[#12192E]" />
                      <motion.span
                        className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-[#8EA8F5]/40"
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* STAGE 3: Confetti burst + Resolution Applied */}
              <div
                className="absolute inset-0 flex flex-col justify-center transition-all duration-400 ease-out"
                style={{
                  opacity: step === 3 ? 1 : 0,
                  transform:
                    step === 3
                      ? 'translate3d(0, 0, 0)'
                      : step < 3
                      ? 'translate3d(0, 16px, 0)'
                      : 'translate3d(0, -16px, 0)',
                  pointerEvents: step === 3 ? 'auto' : 'none',
                  visibility: step === 3 ? 'visible' : 'hidden',
                }}
              >
                <div className="p-4 rounded-xl bg-[#3F8F6B]/15 border border-[#3F8F6B]/30 backdrop-blur-md text-center relative overflow-hidden">
                  <Sparkles className="w-6 h-6 text-[#34D399] mx-auto mb-1.5 animate-pulse" />
                  <p className="text-sm font-semibold text-white">Automated Correction Staged</p>
                  <p className="text-xs text-[#A8B4D4] mt-0.5">
                    Claim resolved with approved citation link. Ready for passport sealing.
                  </p>

                  {/* 12 Confetti-lite particles burst */}
                  {step === 3 && !isReduced && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full"
                          style={{
                            background: i % 2 === 0 ? '#34D399' : '#8EA8F5',
                            left: '50%',
                            top: '50%',
                          }}
                          initial={{ scale: 0, x: 0, y: 0 }}
                          animate={{
                            scale: [0, 1, 0.4],
                            x: (i % 2 === 0 ? 1 : -1) * (20 + (i * 12)),
                            y: ((i % 3) - 1) * 35,
                            opacity: [1, 1, 0],
                          }}
                          transition={{ duration: 0.65, ease: 'easeOut' }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* STAGE 4: Evidence Passport Stamped Ticket */}
              <div
                className="absolute inset-0 transition-all duration-400 ease-out"
                style={{
                  opacity: step === 4 ? 1 : 0,
                  transform:
                    step === 4
                      ? 'translate3d(0, 0, 0) rotate(-1.5deg)'
                      : 'translate3d(0, 24px, 0) scale(0.96)',
                  pointerEvents: step === 4 ? 'auto' : 'none',
                  visibility: step === 4 ? 'visible' : 'hidden',
                }}
              >
                <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#1E2540] to-[#12192E] border-2 border-[#3F8F6B]/50 shadow-2xl relative overflow-hidden">
                  {/* Perforated edge on right */}
                  <div className="absolute right-12 top-0 bottom-0 w-px border-r-2 border-dashed border-white/20" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-4 h-4 text-[#34D399]" />
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#34D399]">
                          Evidence Passport Issued
                        </span>
                      </div>
                      <p className="font-mono text-xs font-semibold text-white">
                        BVP-2026-0001 · SHA256-VLD
                      </p>
                      <p className="text-[11px] text-[#A8B4D4] mt-0.5">
                        Human signed off: Dipto Nath (Lead Reviewer)
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center pl-4 pr-1">
                      <QrCode className="w-9 h-9 text-white/80" />
                      <span className="text-[9px] font-mono text-[#8EA8F5] mt-1">VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Dot Interactive Progress Bar */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleDotClick(i)}
            aria-label={`Jump to demo step ${i + 1}`}
            className="group p-1 focus:outline-none"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                step === i
                  ? 'w-6 h-1.5 bg-[#3B4BC8] shadow-sm shadow-[#3B4BC8]/50'
                  : 'w-1.5 h-1.5 bg-[#16203A]/25 group-hover:bg-[#16203A]/50'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
