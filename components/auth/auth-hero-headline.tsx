'use client';

import { motion } from 'framer-motion';

const WORDS_BEFORE = ['Every', 'claim,'];
const WORDS_AFTER = ['before', 'it', 'goes', 'live.'];

export function AuthHeroHeadline() {
  return (
    <div className="relative z-10 max-w-[540px]">
      {/* Eyebrow pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3F8F6B]/12 border border-[#3F8F6B]/25 mb-4 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-[#3F8F6B] animate-pulse" />
        <span className="text-[12.5px] font-semibold text-[#16203A] tracking-tight">
          Evidence-first brand governance
        </span>
      </div>

      {/* Main Title with word-by-word mask reveal */}
      <h1 className="font-serif text-[38px] sm:text-[46px] lg:text-[50px] font-bold text-[#16203A] leading-[1.08] tracking-tight mb-3">
        <span className="inline-block overflow-hidden mr-2 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            Every
          </motion.span>
        </span>
        <span className="inline-block overflow-hidden mr-2 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            claim,
          </motion.span>
        </span>

        {/* Word: "checked" with self-drawing SVG underline and soft highlighter wash */}
        <span className="relative inline-block mr-2 overflow-visible">
          {/* Soft highlighter wash behind */}
          <motion.span
            className="absolute inset-x-0 bottom-1 h-3 bg-[#E8E9FC] -z-10 rounded-sm"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />

          <span className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block text-[#3B4BC8]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.19, ease: [0.16, 1, 0.3, 1] }}
            >
              checked
            </motion.span>
          </span>

          {/* SVG Hand-drawn underline */}
          <svg
            className="absolute -bottom-2 left-0 w-full h-3 overflow-visible text-[#3B4BC8] pointer-events-none"
            viewBox="0 0 140 12"
            fill="none"
          >
            <motion.path
              d="M3 8 C 30 13, 70 2, 137 6"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        </span>

        {WORDS_AFTER.map((word, i) => (
          <span key={word} className="inline-block overflow-hidden mr-2 align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h1>

      <p className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#5B6477] max-w-[480px]">
        Verify claims against approved sources, explain every finding with traceable citations, and keep a person in charge.
      </p>
    </div>
  );
}
