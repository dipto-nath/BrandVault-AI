'use client';

import React from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChangeDiffProps {
  dependencyType?: string;
  dependencyName: string;
  beforeValue: string;
  afterValue: string;
  reason?: string | null;
  status: 'NEEDS_RE_REVIEW' | 'OUTDATED' | string;
  className?: string;
  onAcknowledge?: () => void;
}

export function ChangeDiff({
  dependencyType = 'FACT',
  dependencyName,
  beforeValue,
  afterValue,
  reason,
  status,
  className,
  onAcknowledge,
}: ChangeDiffProps) {
  const isOutdated = status === 'OUTDATED';

  return (
    <div
      className={cn(
        'rounded-xl border p-4 sm:p-5 transition-all shadow-xs',
        isOutdated
          ? 'bg-red-50/70 border-proof-red/40 text-ink'
          : 'bg-amber-50/80 border-amber-300 text-ink',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs',
              isOutdated ? 'bg-proof-red text-white' : 'bg-amber-600 text-white'
            )}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-black/5 text-ink-2">
                {dependencyType} DEPENDENCY CHANGE
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  isOutdated
                    ? 'bg-red-100 text-proof-red border border-proof-red/20'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                )}
              >
                {isOutdated ? 'Outdated Evidence' : 'Needs Re-Review'}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-ink mt-0.5">
              {isOutdated
                ? `Evidence source expired: ${dependencyName}`
                : `Approved ${dependencyType.toLowerCase()} changed: ${dependencyName}`}
            </h4>
          </div>
        </div>

        {onAcknowledge && (
          <button
            type="button"
            onClick={onAcknowledge}
            className="self-start sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-line text-ink hover:bg-surface-2 shadow-2xs transition-colors"
          >
            Acknowledge change
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5">
        <div className="bg-white/80 rounded-lg p-3 border border-black/5">
          <span className="text-[11px] font-mono text-ink-3 uppercase block mb-1">
            Prior Approval Basis (Before)
          </span>
          <p className="text-xs font-medium text-ink-2 line-through decoration-proof-red/60 bg-red-50/50 p-2 rounded border border-red-100">
            {beforeValue}
          </p>
        </div>

        <div className="bg-white/80 rounded-lg p-3 border border-black/5">
          <span className="text-[11px] font-mono text-ink-3 uppercase block mb-1">
            Active Current Specification (After)
          </span>
          <p className="text-xs font-medium text-ink bg-emerald-50/60 p-2 rounded border border-emerald-200">
            {afterValue}
          </p>
        </div>
      </div>

      {reason && (
        <p className="text-xs text-ink-2 mt-3 pt-2.5 border-t border-black/5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-ink-3 shrink-0" />
          <span>Change context: <strong className="text-ink font-medium">{reason}</strong></span>
        </p>
      )}
    </div>
  );
}
