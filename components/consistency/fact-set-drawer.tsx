'use client';

import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, BookOpen, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoredFactSet, StoredFact } from '@/lib/ai/consistency-store';

interface FactSetDrawerProps {
  factSet: StoredFactSet | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFact?: (factSetId: string, statement: string) => void;
}

export function FactSetDrawer({
  factSet,
  isOpen,
  onClose,
  onAddFact,
}: FactSetDrawerProps) {
  const isReduced = useReducedMotion();
  const [newFactInput, setNewFactInput] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !factSet) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactInput.trim() || !onAddFact) return;
    onAddFact(factSet.id, newFactInput.trim());
    setNewFactInput('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-labelledby="fact-drawer-title">
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
        className="relative z-10 w-full max-w-xl bg-sheet h-full border-l border-line shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-paper/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-line text-ink-2">
              v{factSet.version}
            </span>
            <span className="text-xs text-ink-3">
              Updated {new Date(factSet.updated_at || factSet.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-sand/60 transition-colors focus-ring"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 border-b border-line bg-sheet shrink-0">
          <h2 id="fact-drawer-title" className="font-serif text-2xl font-bold text-ink tracking-tight">
            {factSet.name}
          </h2>
          <p className="text-xs text-ink-2 mt-1">
            {factSet.facts.length} approved ground-truth assertions governing consistency checks.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-sheet">
          <div className="space-y-2.5">
            {factSet.facts.map((fact, idx) => (
              <div
                key={fact.id || idx}
                className="p-3.5 rounded-xl border border-line bg-paper/60 text-xs space-y-1.5 hover:border-line/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-brand">
                    {fact.id}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-ink-3">
                    {fact.category}
                  </span>
                </div>
                <p className="font-serif text-[14px] text-ink italic leading-relaxed">
                  "{fact.statement}"
                </p>
                <div className="text-[11px] text-ink-3 pt-1 border-t border-line/40 flex items-center justify-between">
                  <span>Source: {fact.sourceDoc}</span>
                  <span>{fact.sourceLocator}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Add Fact */}
          {isAdding ? (
            <form onSubmit={handleAdd} className="p-3.5 rounded-xl border border-brand/40 bg-surface shadow-xs space-y-3">
              <label className="text-xs font-semibold text-ink block">
                Add Approved Statement
              </label>
              <textarea
                value={newFactInput}
                onChange={(e) => setNewFactInput(e.target.value)}
                placeholder="e.g. NexTech Nova is certified for 18 hours mixed battery endurance."
                rows={3}
                autoFocus
                className="w-full p-2.5 rounded-lg border border-line text-xs font-serif italic text-ink bg-sheet focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFactInput.trim()}
                  className="h-7 text-xs bg-ink text-sheet"
                >
                  Save Fact
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 border border-dashed border-line hover:border-brand rounded-xl text-xs text-ink-2 hover:text-brand transition-colors flex items-center justify-center gap-1.5 bg-paper/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add approved fact to this set</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
