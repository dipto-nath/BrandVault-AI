'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Clock, Shield, ExternalLink, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TimelineEvent } from '@/lib/services/insights';

export function AuditLogDrawer({
  isOpen,
  onClose,
  events,
}: {
  isOpen: boolean;
  onClose: () => void;
  events: TimelineEvent[];
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(events.length / pageSize) || 1;

  if (!isOpen) return null;

  const currentEvents = events.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink-dark/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-surface border-l border-sand-dark/50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-sand-dark/40 bg-surface-subtle/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-ink-dark flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand" />
                Immutable Governance Audit Log
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Cryptographically tracked record of reviewer overrides, approvals, and rule changes.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-dark hover:bg-sand/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
            {events.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-xs">No audit events logged yet.</div>
            ) : (
              <div className="relative border-l-2 border-sand-dark/40 ml-3 space-y-5 pl-5">
                {currentEvents.map((ev) => (
                  <div key={ev.id} className="relative group">
                    <span className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-surface bg-brand" />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-ink-dark text-xs">{ev.title}</span>
                      <span className="text-[10px] text-ink-muted font-mono">{ev.timestamp}</span>
                    </div>
                    <p className="text-ink-secondary mt-0.5 text-xs">{ev.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-ink-muted">
                      <span>By: <strong className="text-ink-dark">{ev.actor}</strong></span>
                      {ev.badge && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                          {ev.badge}
                        </Badge>
                      )}
                      {ev.link && (
                        <Link href={ev.link} className="text-brand hover:underline flex items-center gap-0.5 ml-auto">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Pagination */}
          <div className="p-4 sm:p-5 border-t border-sand-dark/40 bg-surface-subtle/80 flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, events.length)} of {events.length} events
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs px-2 gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 text-xs px-2 gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
