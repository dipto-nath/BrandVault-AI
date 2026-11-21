'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsistencyEmptyStateProps {
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onLoadSamples?: () => void;
  isLoadingSamples?: boolean;
  showSampleButton?: boolean;
}

export function ConsistencyEmptyState({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  onLoadSamples,
  isLoadingSamples = false,
  showSampleButton = true,
}: ConsistencyEmptyStateProps) {
  const isReduced = useReducedMotion();

  return (
    <div className="proof-card py-16 px-6 text-center max-w-xl mx-auto my-8 flex flex-col items-center">
      {/* Hand-crafted Ink Line SVG Illustration: Two paper sheets joined by dashed thread */}
      <div className="relative w-44 h-32 mb-6 select-none" aria-hidden="true">
        <svg
          viewBox="0 0 176 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Left Sheet: Indic Draft (Devanagari / Bengali glyph lines) */}
          <g transform="translate(18, 16) rotate(-4 32 44)">
            {/* Paper backing */}
            <rect
              x="0"
              y="0"
              width="64"
              height="88"
              rx="4"
              fill="#FFFDF8"
              stroke="#E4DCCB"
              strokeWidth="1.5"
            />
            {/* Ruled lines */}
            <line x1="8" y1="20" x2="56" y2="20" stroke="#EADFC9" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="8" y1="36" x2="56" y2="36" stroke="#EADFC9" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="8" y1="52" x2="56" y2="52" stroke="#EADFC9" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="8" y1="68" x2="44" y2="68" stroke="#EADFC9" strokeWidth="1" strokeDasharray="2 2" />

            {/* Simulated Indic Shirorekha & conjunct strokes */}
            <motion.path
              d="M 12 18 Q 24 16 38 18 M 16 18 L 16 26 M 28 18 Q 32 24 28 28"
              stroke="#16203A"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <motion.path
              d="M 12 34 Q 30 32 48 34 M 20 34 L 20 42 M 36 34 Q 42 40 38 44"
              stroke="#16203A"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
            />
            <motion.path
              d="M 12 50 Q 28 48 44 50 M 24 50 L 24 58"
              stroke="#16203A"
              strokeWidth="1.4"
              strokeLinecap="round"
              initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
            <text x="44" y="27" fill="#7A8099" fontSize="8" fontFamily="'Noto Sans Devanagari', sans-serif">हि</text>
            <text x="44" y="58" fill="#7A8099" fontSize="8" fontFamily="'Noto Sans Bengali', sans-serif">বাং</text>
          </g>

          {/* Right Sheet: Approved English Specification with verification marks */}
          <g transform="translate(94, 20) rotate(3 32 44)">
            {/* Paper backing */}
            <rect
              x="0"
              y="0"
              width="64"
              height="88"
              rx="4"
              fill="#FFFDF8"
              stroke="#E4DCCB"
              strokeWidth="1.5"
            />
            {/* Header rule */}
            <line x1="8" y1="18" x2="40" y2="18" stroke="#16203A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="34" x2="56" y2="34" stroke="#EADFC9" strokeWidth="1" />
            <line x1="8" y1="50" x2="56" y2="50" stroke="#EADFC9" strokeWidth="1" />
            <line x1="8" y1="66" x2="50" y2="66" stroke="#EADFC9" strokeWidth="1" />

            {/* Check marks ✓ */}
            <motion.path
              d="M 12 32 L 15 35 L 22 28"
              stroke="#3F8F6B"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            />
            <motion.path
              d="M 12 48 L 15 51 L 22 44"
              stroke="#3F8F6B"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            />

            {/* Text cue */}
            <line x1="26" y1="31" x2="52" y2="31" stroke="#16203A" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="26" y1="47" x2="48" y2="47" stroke="#16203A" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="12" y1="64" x2="44" y2="64" stroke="#7A8099" strokeWidth="1" strokeDasharray="3 2" />
          </g>

          {/* Joining Dashed Thread between the two sheets */}
          <motion.path
            d="M 66 54 C 82 40, 96 44, 110 56"
            stroke="#3B4BC8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
            fill="none"
            initial={isReduced ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
          />

          {/* Needle / Pin anchor on the bridge */}
          <circle cx="88" cy="46" r="2.5" fill="#3B4BC8" />
        </svg>
      </div>

      <h3 className="font-serif text-[20px] font-semibold text-ink tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-[14px] text-ink-2 max-w-md mx-auto leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {primaryActionLabel && onPrimaryAction && (
          <Button
            onClick={onPrimaryAction}
            className="bg-ink hover:bg-ink/90 text-sheet font-medium px-4 py-2 text-sm rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {primaryActionLabel}
          </Button>
        )}

        {showSampleButton && onLoadSamples && (
          <Button
            variant="outline"
            onClick={onLoadSamples}
            disabled={isLoadingSamples}
            className="border-line bg-sheet hover:bg-sand/40 text-ink text-sm rounded-lg px-4 py-2 transition-all duration-150 active:scale-[0.98]"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 text-ink-3 ${isLoadingSamples ? 'animate-spin' : ''}`} />
            {isLoadingSamples ? 'Loading…' : 'Load sample data'}
          </Button>
        )}
      </div>
    </div>
  );
}
