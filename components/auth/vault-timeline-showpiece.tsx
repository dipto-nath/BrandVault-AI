'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  ShieldCheck,
  Check,
  Sparkles,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface VaultTimelineShowpieceProps {
  currentFormStep: number; // 1 or 2
  hasUploadedFiles?: boolean;
}

const VAULT_STEPS = [
  {
    id: 1,
    title: 'Upload sources',
    desc: 'Approved spec sheets, knowledge docs, and claims.',
    icon: Upload,
    badge: 'Ground Truth',
  },
  {
    id: 2,
    title: 'Submit content',
    desc: 'Campaign drafts, social copy, and ad creatives.',
    icon: FileText,
    badge: 'Automated Gate',
  },
  {
    id: 3,
    title: 'Get passports',
    desc: 'Cryptographic audit stamps with verified citations.',
    icon: ShieldCheck,
    badge: 'Tamper Evident',
  },
];

export function VaultTimelineShowpiece({
  currentFormStep = 1,
  hasUploadedFiles = false,
}: VaultTimelineShowpieceProps) {
  const [activeStep, setActiveStep] = useState(currentFormStep);
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Sync with currentFormStep or cycle gently if idle
  useEffect(() => {
    setActiveStep(currentFormStep);
  }, [currentFormStep]);

  return (
    <div
      className="relative w-full max-w-[530px] mx-auto select-none pt-7 pb-4"
      aria-hidden="true"
      role="region"
      aria-label="Overview of setting up BrandVault AI in three simple steps"
    >
      {/* Main Dark Navy Glass Demo Card */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border border-white/[0.12] transition-transform duration-200 ease-out shadow-2xl"
        style={{
          height: 'clamp(380px, 46vh, 440px)',
          background: 'linear-gradient(145deg, #12192E 0%, #1A2447 100%)',
          boxShadow: '0 20px 50px -12px rgba(18,25,46,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 40px rgba(59,75,200,0.18)',
        }}
      >
        {/* Specular top highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Chrome header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-black/20 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/80" />
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#8EA8F5] tracking-tight ml-2">
              Setup Flow
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#A8B4D4]">
            <Lock className="w-3 h-3 text-[#34D399]" />
            <span>Isolated Workspace</span>
          </div>
        </div>

        {/* Content Body: Vertical Timeline */}
        <div className="p-6 relative h-[calc(100%-48px)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Your vault in 3 steps</span>
                <Sparkles className="w-4 h-4 text-[#8EA8F5]" />
              </h3>
              <span className="text-[11px] font-mono text-[#8EA8F5] px-2 py-0.5 rounded bg-[#3B4BC8]/20 border border-[#3B4BC8]/30">
                Step {currentFormStep} of 2
              </span>
            </div>

            {/* Vertical Timeline container */}
            <div className="relative pl-8 space-y-6">
              {/* Glowing vertical connector line */}
              <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-white/10">
                <div
                  className="w-full bg-gradient-to-b from-[#3B4BC8] to-[#3F8F6B] transition-all duration-700 rounded-full"
                  style={{
                    height: currentFormStep === 1 ? '35%' : currentFormStep === 2 ? '70%' : '100%',
                    boxShadow: '0 0 8px rgba(59,75,200,0.6)',
                  }}
                />
              </div>

              {VAULT_STEPS.map((s, idx) => {
                const stepNum = s.id;
                const isCompleted = stepNum < currentFormStep || (stepNum === 1 && hasUploadedFiles);
                const isActive = stepNum === currentFormStep;

                return (
                  <div key={s.id} className="relative flex items-start gap-4">
                    {/* Node Icon */}
                    <div
                      className={`absolute -left-8 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                        isCompleted
                          ? 'bg-[#3F8F6B] text-white shadow-md shadow-[#3F8F6B]/30'
                          : isActive
                          ? 'bg-[#3B4BC8] text-white ring-4 ring-[#3B4BC8]/30 shadow-md shadow-[#3B4BC8]/50 animate-pulse'
                          : 'bg-[#1E2540] text-[#A8B4D4] border border-white/10'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      ) : (
                        <s.icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      )}
                    </div>

                    {/* Step description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold tracking-tight ${isActive || isCompleted ? 'text-white' : 'text-[#A8B4D4]'}`}>
                          {s.title}
                        </span>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#8EA8F5] border border-white/5">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#A8B4D4] mt-0.5 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom helper card */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <FileCheck2 className="w-5 h-5 text-[#34D399] shrink-0" />
            <p className="text-[11.5px] text-[#EDEAE2]/80 leading-normal">
              Documents are processed locally with vector chunking and strict tenant isolation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
