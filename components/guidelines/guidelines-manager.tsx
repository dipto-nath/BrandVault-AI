'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Plus, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  X, Sparkles, Filter, Check, EyeOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import type { BrandGuideline, GuidelineCategory, Severity } from '@/types/database';

interface GuidelinesManagerProps {
  guidelines: BrandGuideline[];
}

const CATEGORIES: GuidelineCategory[] = [
  'TONE',
  'TERMINOLOGY',
  'CLAIMS',
  'FORMATTING',
  'LEGAL',
  'POSITIONING',
  'OTHER',
];

export function GuidelinesManager({ guidelines: initialGuidelines }: GuidelinesManagerProps) {
  const router = useRouter();
  const [guidelines, setGuidelines] = useState(initialGuidelines);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New guideline modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleCode, setRuleCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GuidelineCategory>('TONE');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [goodExample, setGoodExample] = useState('');
  const [badExample, setBadExample] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredGuidelines = guidelines.filter((g) => {
    if (selectedCategory !== 'ALL' && g.category !== selectedCategory) return false;
    return true;
  });

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const examples: { good?: string[]; bad?: string[] } = {};
    if (goodExample.trim()) examples.good = [goodExample.trim()];
    if (badExample.trim()) examples.bad = [badExample.trim()];

    try {
      const res = await fetch('/api/guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_code: ruleCode.trim(),
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          examples,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to create guideline');
      }

      setGuidelines((prev) => [...prev, json.data]);
      setModalOpen(false);
      setRuleCode('');
      setTitle('');
      setDescription('');
      setGoodExample('');
      setBadExample('');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating guideline.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`/api/guidelines/${id}/deactivate`, {
        method: 'POST',
      });
      if (res.ok) {
        setGuidelines((prev) =>
          prev.map((g) => (g.id === id ? { ...g, active: false } : g))
        );
        router.refresh();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Enforcement Policies
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            Brand Guidelines Directory
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Active governance rules governing tone of voice, banned terminology, factual accuracy claims, and legal disclaimers.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="btn-primary text-xs flex items-center gap-2 shadow-sm shadow-accent/20">
          <Plus className="w-4 h-4 text-white" />
          <span>Add Brand Guideline</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 ${
            selectedCategory === 'ALL'
              ? 'bg-accent text-white shadow-sm shadow-accent/20'
              : 'bg-surface border border-border text-ink-secondary hover:text-ink-dark hover:bg-surface-hover'
          }`}
        >
          All Policies ({guidelines.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = guidelines.filter((g) => g.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 ${
                selectedCategory === cat
                  ? 'bg-accent text-white font-semibold shadow-sm shadow-accent/20'
                  : 'bg-surface border border-border text-ink-secondary hover:text-ink-dark hover:bg-surface-hover'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Guidelines Table Card */}
      <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr className="bg-surface-subtle/80 border-b border-border">
                <Th className="w-40 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Rule Code</Th>
                <Th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Guideline Title & Description</Th>
                <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Category</Th>
                <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Severity</Th>
                <Th className="w-24 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Version</Th>
                <Th className="w-24 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Status</Th>
                <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredGuidelines.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="py-12 text-center text-sm text-ink-secondary">
                    No guidelines found in this category.
                  </Td>
                </Tr>
              ) : (
                filteredGuidelines.map((g) => {
                  const isExpanded = expandedId === g.id;
                  return (
                    <Tr key={g.id} className="hover:bg-surface-hover/60 border-b border-border-soft transition-colors">
                      <Td className="py-3 px-4 font-mono text-xs font-bold text-ink-dark">
                        <span className="bg-surface-subtle px-2 py-1 rounded border border-border">
                          {g.rule_code}
                        </span>
                      </Td>
                      <Td className="py-3 px-4">
                        <div className="font-bold text-ink-dark text-sm mb-1 tracking-tight">
                          {g.title}
                        </div>
                        <p className="text-xs text-ink-secondary leading-relaxed">
                          {g.description}
                        </p>
                        {isExpanded && g.examples && (
                          <div className="mt-3 p-3.5 rounded-lg bg-surface-subtle border border-border space-y-2.5 text-xs">
                            {g.examples.good && g.examples.good.length > 0 && (
                              <div className="p-2.5 rounded-md bg-success-soft/50 border border-success/20">
                                <span className="font-bold text-success uppercase text-[10px] tracking-wider block mb-1">
                                  ✓ Approved Formulations
                                </span>
                                <span className="text-ink-dark font-medium italic">
                                  &ldquo;{g.examples.good[0]}&rdquo;
                                </span>
                              </div>
                            )}
                            {g.examples.bad && g.examples.bad.length > 0 && (
                              <div className="p-2.5 rounded-md bg-critical-soft/50 border border-critical/20">
                                <span className="font-bold text-critical uppercase text-[10px] tracking-wider block mb-1">
                                  ✗ Prohibited / Flagged Wording
                                </span>
                                <span className="text-ink-dark font-medium italic">
                                  &ldquo;{g.examples.bad[0]}&rdquo;
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Td>
                      <Td className="py-3 px-4 text-xs font-semibold text-ink-secondary">
                        <span className="bg-surface-subtle px-2 py-0.5 rounded text-[11px] font-semibold text-ink-secondary border border-border">
                          {g.category}
                        </span>
                      </Td>
                      <Td className="py-3 px-4">
                        <Badge variant={g.severity === 'HIGH' ? 'high' : g.severity === 'MEDIUM' ? 'medium' : 'low'}>
                          {g.severity}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-ink-secondary font-mono">
                        v{g.version || 1}
                      </Td>
                      <Td>
                        <Badge variant={g.active ? 'low' : 'neutral'}>
                          {g.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : g.id)}
                            className="h-7 px-2 text-xs"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                          {g.active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(g.id)}
                              className="h-7 px-2 text-xs text-ink-secondary hover:text-critical"
                              title="Deactivate rule"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </div>
      </Card>

      {/* New Guideline Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm">
          <div className="bg-surface rounded-lg border border-border shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-ink-dark">Add New Brand Guideline</h3>
                <p className="text-xs text-ink-secondary">Create an authoritative policy for pre-publication review.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-ink-secondary hover:text-ink-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-md bg-critical-soft text-critical text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateGuideline} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Rule Code</label>
                  <input
                    required
                    value={ruleCode}
                    onChange={(e) => setRuleCode(e.target.value)}
                    placeholder="e.g. RULE-TONE-003"
                    className="input w-full text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="input w-full text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Avoid unverified performance benchmarks"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Rule Description & Rationale</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the exact requirements and constraints for content creators..."
                  className="textarea w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as Severity[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`py-2 text-xs font-semibold rounded-md border text-center transition-all ${
                        severity === s
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-border text-ink-secondary hover:bg-surface-subtle'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Approved Good Example (Optional)</label>
                <input
                  value={goodExample}
                  onChange={(e) => setGoodExample(e.target.value)}
                  placeholder="e.g. Independent lab tests verified 24-hour endurance."
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Prohibited Bad Example (Optional)</label>
                <input
                  value={badExample}
                  onChange={(e) => setBadExample(e.target.value)}
                  placeholder="e.g. Crushes all competitors with infinite battery life!"
                  className="input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !ruleCode || !title || !description}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Creating Rule…' : 'Save Guideline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

