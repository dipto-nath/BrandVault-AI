'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewFactSetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, facts: string[]) => Promise<void>;
}

export function NewFactSetDrawer({
  isOpen,
  onClose,
  onCreate,
}: NewFactSetDrawerProps) {
  const [name, setName] = useState('');
  const [factsRaw, setFactsRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Split lines into non-empty facts
  const lines = factsRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const uniqueCount = new Set(lines.map(l => l.toLowerCase())).size;
  const hasDuplicates = lines.length > uniqueCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || lines.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await onCreate(name.trim(), lines);
      setName('');
      setFactsRaw('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create fact set');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-labelledby="new-factset-title">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#16203A]/30 backdrop-blur-xs"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-sheet h-full border-l border-line shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-paper/60 shrink-0">
          <span className="text-xs uppercase tracking-wider font-semibold text-ink-3">
            Author Fact Set
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-sand/60 transition-colors focus-ring"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 border-b border-line bg-sheet shrink-0">
          <h2 id="new-factset-title" className="font-serif text-2xl font-bold text-ink tracking-tight">
            New Fact Set
          </h2>
          <p className="text-xs text-ink-2 mt-1">
            Author approved English statements that consistency checks will strictly verify against.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-sheet flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Fact Set Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NexTech Nova - Product specs"
                className="w-full px-3 py-2 rounded-lg border border-line text-sm bg-surface text-ink focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink">
                  Approved Facts (one per line)
                </label>
                <span className="text-[11px] font-mono text-ink-3">
                  {lines.length} statement{lines.length === 1 ? '' : 's'}
                </span>
              </div>
              <textarea
                required
                rows={10}
                value={factsRaw}
                onChange={(e) => setFactsRaw(e.target.value)}
                placeholder="NexTech Nova offers up to 18 hours of mixed-use battery life.&#10;The device features IP68 water and dust resistance up to 1.5 meters.&#10;The product warranty is 2 years covering manufacturing defects."
                className="w-full p-3 rounded-lg border border-line text-xs font-serif italic text-ink bg-surface focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none leading-relaxed"
              />
              {hasDuplicates && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning: Duplicate statements detected. Each fact should be distinct.</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-proof-red">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-line"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || lines.length === 0}
              className="bg-ink hover:bg-ink/90 text-sheet active:scale-98"
            >
              {submitting ? 'Creating…' : 'Create Fact Set'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
