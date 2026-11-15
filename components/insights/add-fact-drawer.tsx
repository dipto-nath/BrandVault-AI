'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { KnowledgeGap } from '@/lib/services/insights';

export function AddFactDrawer({
  gap,
  isOpen,
  onClose,
  onSuccess,
}: {
  gap: KnowledgeGap | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [factText, setFactText] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [entityName, setEntityName] = useState('NexaTech Nova');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gap) {
      setTitle(`Substantiation for "${gap.claimText.slice(0, 30)}..."`);
      setFactText(gap.claimText);
      setSourceName('Official Product Specification or Lab Report');
      setError(null);
    }
  }, [gap]);

  if (!isOpen || !gap) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !factText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/knowledge/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          fact_text: factText.trim(),
          entity_name: entityName.trim() || null,
          source_name: sourceName.trim() || 'Internal Engineering Specification',
          source_reference: sourceName.trim() || 'Internal Reference',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || data.error || 'Failed to create approved fact');
      }

      onSuccess(`Approved fact added: "${title}"`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save approved fact.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink-dark/40 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-surface border-l border-sand-dark/50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-sand-dark/40 bg-surface-subtle/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-ink-dark flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand" />
                  Add Approved Fact
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Resolve knowledge gap by certifying an official ground-truth specification.
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
              {error && (
                <div className="p-3 rounded-xl border border-evidence-contradicted/30 bg-evidence-contradicted/10 text-evidence-contradicted flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-ink-dark">Fact Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-dark/50 bg-cream/30 text-ink-dark text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Charging speed rating"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink-dark">Approved Fact / Specification Text *</label>
                <textarea
                  required
                  rows={4}
                  value={factText}
                  onChange={(e) => setFactText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-dark/50 bg-cream/30 text-ink-dark text-xs focus:outline-none focus:ring-1 focus:ring-brand font-serif"
                  placeholder="Official, precise statement against which claims will be verified..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink-dark">Source Document or Registry Name *</label>
                <input
                  type="text"
                  required
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-dark/50 bg-cream/30 text-ink-dark text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Nova Hardware Specification v2.1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-ink-dark">Target Entity / Product</label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-dark/50 bg-cream/30 text-ink-dark text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. NexTech Nova"
                />
              </div>

              <div className="p-3 bg-sand/30 rounded-xl border border-sand-dark/30 text-[11px] text-ink-secondary space-y-1">
                <div className="font-semibold text-ink-dark">Knowledge Loop Integration</div>
                <p>
                  Once approved, subsequent submissions containing this assertion will automatically be validated as <strong className="text-evidence-supported">SUPPORTED</strong>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-sand-dark/40 bg-surface-subtle/80 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || !title.trim() || !factText.trim()}
                className="text-xs bg-brand text-white"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Add & Verify Fact
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
