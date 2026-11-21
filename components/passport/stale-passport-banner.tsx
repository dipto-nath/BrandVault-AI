'use client';

import React from 'react';
import { AlertOctagon, History, FileWarning, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StalePassportBannerProps {
  submissionId: string;
  staleReason?: string | null;
  dependencyName?: string | null;
  beforeValue?: string | null;
  afterValue?: string | null;
  status?: string;
  staleAt?: string | null;
}

export function StalePassportBanner({
  submissionId,
  staleReason,
  dependencyName,
  beforeValue,
  afterValue,
  status,
  staleAt,
}: StalePassportBannerProps) {
  const isOutdated = status === 'OUTDATED';

  return (
    <div
      className={cn(
        'mb-6 rounded-2xl border-2 p-5 sm:p-6 shadow-sm relative overflow-hidden',
        isOutdated
          ? 'bg-[#FFF5F5] border-proof-red text-ink'
          : 'bg-[#FFFBF0] border-amber-500 text-ink'
      )}
      role="alert"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5',
              isOutdated ? 'bg-proof-red text-white' : 'bg-amber-600 text-white'
            )}
          >
            <AlertOctagon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={cn(
                  'text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full',
                  isOutdated ? 'bg-red-200 text-proof-red' : 'bg-amber-200 text-amber-950'
                )}
              >
                {isOutdated ? 'OUTDATED APPROVAL' : 'STALE APPROVAL — NEEDS RE-REVIEW'}
              </span>
              {staleAt && (
                <span className="text-xs text-ink-3">
                  Invalidated on {new Date(staleAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h3 className="font-serif text-lg font-bold text-ink">
              {isOutdated
                ? 'Underlying Evidence Has Expired'
                : 'Underlying Approved Fact Has Changed'}
            </h3>

            <p className="text-sm text-ink-2 mt-1 leading-relaxed max-w-3xl">
              {staleReason ||
                'This approval was granted based on an earlier version of the approved evidence. The underlying specifications have since been modified, so this passport is no longer guaranteed current.'}
            </p>

            {(beforeValue || afterValue) && (
              <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs bg-white/90 p-3 rounded-xl border border-black/5">
                {beforeValue && (
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-ink-3 uppercase block">Prior Fact (At Approval):</span>
                    <span className="line-through text-proof-red font-medium">{beforeValue}</span>
                  </div>
                )}
                <ArrowRight className="w-4 h-4 text-ink-3 shrink-0 hidden sm:block" />
                {afterValue && (
                  <div className="flex-1">
                    <span className="font-mono text-[10px] text-ink-3 uppercase block">Current Active Spec:</span>
                    <span className="text-emerald-700 font-semibold">{afterValue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0 self-end md:self-auto">
          <Link
            href={`/reviews/${submissionId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-ink text-white hover:bg-ink/90 shadow-xs transition-colors"
          >
            Open in Review Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
