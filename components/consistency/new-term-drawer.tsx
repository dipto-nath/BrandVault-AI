'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewTermDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (en: string, hi: string, bn: string, cat: string) => Promise<void>;
}

export function NewTermDrawer({
  isOpen,
  onClose,
  onCreate,
}: NewTermDrawerProps) {
  const [termEn, setTermEn] = useState('');
  const [termHi, setTermHi] = useState('');
  const [termBn, setTermBn] = useState('');
  const [category, setCategory] = useState('Hardware Specs');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termEn.trim() || !termHi.trim() || !termBn.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onCreate(termEn.trim(), termHi.trim(), termBn.trim(), category);
      setTermEn('');
      setTermHi('');
      setTermBn('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to add glossary term');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true" aria-labelledby="new-term-title">
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
        className="relative z-10 w-full max-w-md bg-sheet h-full border-l border-line shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-paper/60 shrink-0">
          <span className="text-xs uppercase tracking-wider font-semibold text-ink-3">
            Add Protected Translation
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
          <h2 id="new-term-title" className="font-serif text-2xl font-bold text-ink tracking-tight">
            New Term
          </h2>
          <p className="text-xs text-ink-2 mt-1">
            Standardize official brand terminology across English, Hindi, and Bengali communications.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-sheet flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                English Term
              </label>
              <input
                type="text"
                required
                value={termEn}
                onChange={(e) => setTermEn(e.target.value)}
                placeholder="e.g. battery life"
                className="w-full px-3 py-2 rounded-lg border border-line text-sm bg-surface text-ink focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Hindi Term (हिन्दी)
              </label>
              <input
                type="text"
                required
                lang="hi"
                value={termHi}
                onChange={(e) => setTermHi(e.target.value)}
                placeholder="उदा. बैटरी लाइफ"
                className="w-full px-3 py-2 rounded-lg border border-line text-base font-indic-hi bg-surface text-ink focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Bengali Term (বাংলা)
              </label>
              <input
                type="text"
                required
                lang="bn"
                value={termBn}
                onChange={(e) => setTermBn(e.target.value)}
                placeholder="যেমন: ব্যাটারি লাইফ"
                className="w-full px-3 py-2 rounded-lg border border-line text-base font-indic-bn bg-surface text-ink focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-line text-sm bg-surface text-ink focus:ring-2 focus:ring-indigo focus:border-indigo focus:outline-none"
              >
                <option value="Hardware Specs">Hardware Specs</option>
                <option value="Usage Conditions">Usage Conditions</option>
                <option value="Legal & Policy">Legal & Policy</option>
                <option value="AI Features">AI Features</option>
                <option value="Marketing">Marketing</option>
                <option value="Durability">Durability</option>
              </select>
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
              disabled={submitting || !termEn.trim() || !termHi.trim() || !termBn.trim()}
              className="bg-ink hover:bg-ink/90 text-sheet active:scale-98"
            >
              {submitting ? 'Saving…' : 'Save Term'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
