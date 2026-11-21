'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneFrame } from './scene-frame';

interface ProofSheetRegisterProps {
  currentFormStep: number; // 1 or 2
  hasUploadedFiles?: boolean;
  isRegistered?: boolean;
}

const WORKFLOW_ROWS = [
  {
    num: '1',
    title: 'Upload sources',
    desc: 'Approved spec sheets, guidelines, and verified claims.',
  },
  {
    num: '2',
    title: 'Submit content',
    desc: 'Campaign drafts, ad copy, and packaging text.',
  },
  {
    num: '3',
    title: 'Get an Evidence Passport',
    desc: 'Tamper-evident review stamp with traceable citations.',
  },
];

export function ProofSheetRegister({
  currentFormStep = 1,
  hasUploadedFiles = false,
  isRegistered = false,
}: ProofSheetRegisterProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full max-w-[480px] mx-auto select-none pt-4 pb-2" aria-hidden="true">
      {/* Behind Sheets (Pile of past reviews) */}
      <div
        className="absolute inset-0 rounded-[6px] border border-[#E4DCCB] bg-[#FBF9F4] pointer-events-none transition-transform"
        style={{
          height: 'clamp(360px, 46vh, 440px)',
          transform: 'rotate(-2.2deg) translate3d(-6px, 4px, 0)',
          boxShadow: '0 8px 24px rgba(22, 32, 58, 0.04)',
        }}
      />
      <div
        className="absolute inset-0 rounded-[6px] border border-[#E4DCCB] bg-[#FFFDF8] pointer-events-none transition-transform"
        style={{
          height: 'clamp(360px, 46vh, 440px)',
          transform: 'rotate(1.4deg) translate3d(4px, 2px, 0)',
          boxShadow: '0 8px 24px rgba(22, 32, 58, 0.04)',
        }}
      />

      {/* Main Proof Sheet with Shared SceneFrame */}
      <SceneFrame
        onHoverChange={setIsHovered}
        ariaLabel="Proof sheet showing the 3-stage vault setup workflow"
      >
        <div
          className="relative w-full rounded-[6px] border border-[#E4DCCB] bg-[#FFFDF8] p-6 sm:p-7 flex flex-col justify-between overflow-hidden"
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
          <div>
            <div className="border-b border-[#E4DCCB] pb-3 mb-4 flex items-center justify-between text-[11.5px] font-sans text-[#5B6477]">
              <span className="tracking-tight font-medium">Setting up your vault — Workspace workflow</span>
              <span className="font-mono text-[10px] text-[#5B6477]/70">3 STAGES</span>
            </div>

            {/* 2. Editorial 3-Row Workflow */}
            <div className="divide-y divide-[#E4DCCB]/70">
              {WORKFLOW_ROWS.map((row, idx) => {
                const rowNum = idx + 1;
                const isCompleted =
                  (rowNum === 1 && (currentFormStep > 1 || hasUploadedFiles)) ||
                  (rowNum === 2 && isRegistered);
                const isActive = rowNum === currentFormStep && !isCompleted;

                return (
                  <div key={row.num} className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3.5">
                    {/* Editorial Large Serif Numeral */}
                    <div className="w-8 shrink-0 flex items-center justify-center pt-0.5">
                      {isCompleted ? (
                        <svg className="w-5 h-5 text-[#3F8F6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <div className="relative">
                          <span
                            className={`font-serif text-[26px] leading-none font-bold transition-colors ${
                              isActive ? 'text-[#3B4BC8]' : 'text-[#16203A]/40'
                            }`}
                          >
                            {row.num}
                          </span>
                          {isActive && (
                            <motion.span
                              className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#3B4BC8]"
                              layoutId="active-underline"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title and Plain Description */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-[14px] font-semibold tracking-tight transition-colors ${
                          isActive || isCompleted ? 'text-[#16203A]' : 'text-[#5B6477]'
                        }`}
                      >
                        {row.title}
                      </h4>
                      <p className="text-[12px] text-[#5B6477] mt-0.5 leading-relaxed">
                        {row.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stamped Outcome or Empty Stamp Outline */}
          <div className="pt-3 border-t border-[#E4DCCB] flex items-center justify-between text-xs text-[#5B6477] font-sans">
            <span className="font-serif italic text-[12px] text-[#5B6477]">
              Every claim checked before publication
            </span>

            {/* Stamp outline or stamped seal */}
            {isRegistered ? (
              <motion.div
                className="border-[2px] border-[#3F8F6B] rounded-[4px] px-2.5 py-1 text-center font-bold text-[#3F8F6B] uppercase font-mono text-[10px] tracking-widest rotate-[-5deg]"
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                VAULT CREATED
              </motion.div>
            ) : (
              <div className="border border-dashed border-[#E4DCCB] text-[#5B6477]/40 px-2 py-0.5 rounded-[4px] font-mono text-[10px] tracking-wider">
                BVP-····-····
              </div>
            )}
          </div>
        </div>
      </SceneFrame>
    </div>
  );
}
