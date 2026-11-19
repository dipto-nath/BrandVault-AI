'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Plus, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  X, Sparkles, Filter, Check, EyeOff, BookOpen, ArrowRight, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import type { BrandGuideline, GuidelineCategory, Severity } from '@/types/database';

interface GuidelinesManagerProps {
  guidelines: BrandGuideline[];
}

interface GuidelineTemplate {
  id: string;
  industry: string;
  rule_code: string;
  title: string;
  description: string;
  category: GuidelineCategory;
  severity: Severity;
  examples?: { good?: string[]; bad?: string[] };
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

  // Template Library State
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<GuidelineTemplate[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [cloningId, setCloningId] = useState<string | null>(null);

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

  useEffect(() => {
    fetch('/api/guidelines/templates')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  const filteredGuidelines = guidelines.filter((g) => {
    if (selectedCategory !== 'ALL' && g.category !== selectedCategory) return false;
    return true;
  });

  const filteredTemplates = templates.filter((t) => {
    if (selectedIndustry === 'ALL') return true;
    return t.industry === selectedIndustry;
  });

  const handleCloneTemplate = async (templateId: string) => {
    setCloningId(templateId);
    try {
      const res = await fetch('/api/guidelines/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_ids: [templateId] }),
      });
      if (res.ok) {
        const clonedList = await res.json();
        if (Array.isArray(clonedList) && clonedList.length > 0) {
          setGuidelines((prev) => [...prev, ...clonedList]);
        }
      }
    } finally {
      setCloningId(null);
    }
  };

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

      setGuidelines((prev) => [...prev, json.data || json]);
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
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setTemplateModalOpen(true)}
            variant="outline"
            className="text-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <span>Browse Starter Rules</span>
          </Button>
          <Button onClick={() => setModalOpen(true)} className="btn-primary text-xs flex items-center gap-2 shadow-sm shadow-accent/20">
            <Plus className="w-4 h-4 text-white" />
            <span>Add Brand Guideline</span>
          </Button>
        </div>
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
        {CATEGORIES.filter((cat) => guidelines.some((g) => g.category === cat)).map((cat) => {
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
                    No guidelines found for this category. Click &ldquo;Browse Starter Rules&rdquo; to adopt pre-built policies.
                  </Td>
                </Tr>
              ) : (
                filteredGuidelines.map((guideline) => {
                  const isExpanded = expandedId === guideline.id;
                  const hasExamples =
                    (guideline.examples?.good && guideline.examples.good.length > 0) ||
                    (guideline.examples?.bad && guideline.examples.bad.length > 0);

                  return (
                    <Tr key={guideline.id} className="hover:bg-surface-hover/60 border-b border-border-soft transition-colors">
                      <Td className="py-3.5 px-4 font-mono text-xs font-bold text-ink-dark">
                        <span className="bg-surface-subtle px-2 py-1 rounded border border-border">
                          {guideline.rule_code}
                        </span>
                      </Td>
                      <Td className="py-3.5 px-4">
                        <div className="font-bold text-ink-dark text-sm mb-1 tracking-tight">
                          {guideline.title}
                        </div>
                        <p className="text-xs text-ink-secondary leading-relaxed max-w-xl">
                          {guideline.description}
                        </p>
                        {isExpanded && hasExamples && (
                          <div className="mt-3 p-3.5 rounded-lg bg-surface-subtle border border-border space-y-2.5 text-xs">
                            {guideline.examples?.good && guideline.examples.good.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-success-soft text-success shrink-0 mt-0.5">
                                  GOOD
                                </span>
                                <span className="text-ink-dark italic font-serif">
                                  &ldquo;{guideline.examples.good[0]}&rdquo;
                                </span>
                              </div>
                            )}
                            {guideline.examples?.bad && guideline.examples.bad.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-critical-soft text-critical shrink-0 mt-0.5">
                                  AVOID
                                </span>
                                <span className="text-ink-dark italic font-serif">
                                  &ldquo;{guideline.examples.bad[0]}&rdquo;
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Td>
                      <Td className="py-3.5 px-4">
                        <span className="bg-surface-subtle px-2 py-0.5 rounded text-[11px] font-semibold text-ink-dark border border-border">
                          {guideline.category}
                        </span>
                      </Td>
                      <Td className="py-3.5 px-4">
                        <Badge variant={guideline.severity === 'HIGH' ? 'high' : guideline.severity === 'MEDIUM' ? 'medium' : 'low'}>
                          {guideline.severity}
                        </Badge>
                      </Td>
                      <Td className="py-3.5 px-4 text-xs font-mono text-ink-secondary">
                        v{guideline.version}
                      </Td>
                      <Td className="py-3.5 px-4">
                        <Badge variant={guideline.active ? 'low' : 'neutral'}>
                          {guideline.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasExamples && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedId(isExpanded ? null : guideline.id)}
                              className="h-7 px-2 text-xs"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                          {guideline.active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(guideline.id)}
                              className="h-7 px-2 text-xs text-ink-muted hover:text-critical"
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

      {/* Starter Template Library Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-ink-dark flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span>Starter Guideline Templates</span>
                </h3>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Select and clone pre-validated industry rules directly into your governance vault.
                </p>
              </div>
              <button onClick={() => setTemplateModalOpen(false)} className="p-1 rounded text-ink-secondary hover:text-ink-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Industry Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 text-xs border-b border-border/60">
              {['ALL', 'Consumer Tech & Hardware', 'B2B SaaS & Enterprise Software', 'Health & Wellness', 'E-commerce & Retail'].map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedIndustry === ind
                      ? 'bg-accent text-white font-semibold'
                      : 'bg-surface-subtle border border-border text-ink-secondary hover:text-ink-dark'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>

            {/* Templates List */}
            <div className="space-y-3">
              {filteredTemplates.map((tpl) => {
                const isAlreadyAdded = guidelines.some((g) => g.rule_code === tpl.rule_code);
                return (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl border border-border bg-surface-subtle/50 hover:bg-surface-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-accent bg-surface px-1.5 py-0.5 rounded border border-border">
                          {tpl.rule_code}
                        </span>
                        <span className="text-xs font-bold text-ink-dark">{tpl.title}</span>
                        <Badge variant={tpl.severity === 'HIGH' ? 'high' : 'medium'}>{tpl.severity}</Badge>
                      </div>
                      <p className="text-xs text-ink-secondary leading-relaxed">{tpl.description}</p>
                      <div className="text-[10px] text-ink-muted">Industry: {tpl.industry}</div>
                    </div>
                    <div>
                      {isAlreadyAdded ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success font-medium px-2.5 py-1 rounded-lg bg-success-soft">
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={cloningId === tpl.id}
                          onClick={() => handleCloneTemplate(tpl.id)}
                          className="btn-primary text-xs flex items-center gap-1.5"
                        >
                          {cloningId === tpl.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          <span>Add to Vault</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* New Guideline Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-ink-dark">Add Brand Guideline</h3>
                <p className="text-xs text-ink-secondary">Define an enforceable policy for content reviews.</p>
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
                    onChange={(e) => setCategory(e.target.value as GuidelineCategory)}
                    className="input w-full text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Guideline Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Avoid Empty Buzzwords and Jargon"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Policy Rule Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Explain the brand requirement and why it matters..."
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
