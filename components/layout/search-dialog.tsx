'use client';

import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, FileText, BookOpen, Shield, Sparkles, ExternalLink,
  ArrowRight, X, Clock, CornerDownLeft, Plus, CheckCircle, SlidersHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSubmissionReference } from '@/lib/utils';

export interface SearchResultItem {
  id: string;
  category: 'submission' | 'fact' | 'guideline' | 'navigation';
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'success' | 'danger' | 'warning' | 'outline' | 'low' | 'medium' | 'high';
}

// In-memory module-level cache for search items
let searchCache: {
  submissions: any[];
  guidelines: any[];
  facts: any[];
  timestamp: number;
} | null = null;
const CACHE_TTL_MS = 60000; // 60 seconds

const STATIC_NAV_ITEMS: SearchResultItem[] = [
  {
    id: 'nav-new-review',
    category: 'navigation',
    title: 'Submit Content for Brand Verification',
    subtitle: 'Upload copy or paste a draft to run multi-stage evidence checks',
    href: '/reviews/new',
    badge: 'Action',
    badgeVariant: 'outline',
  },
  {
    id: 'nav-reviews',
    category: 'navigation',
    title: 'Content Reviews & Submissions Desk',
    subtitle: 'Review drafts, examine findings, and approve with passports',
    href: '/reviews',
    badge: 'Page',
    badgeVariant: 'outline',
  },
  {
    id: 'nav-knowledge',
    category: 'navigation',
    title: 'Approved Facts & Knowledge Registry',
    subtitle: 'Manage verified specifications, ratings, and source documents',
    href: '/knowledge',
    badge: 'Page',
    badgeVariant: 'outline',
  },
  {
    id: 'nav-guidelines',
    category: 'navigation',
    title: 'Brand Guidelines & Tone Rules',
    subtitle: 'Manage terminology standards, prohibited terms, and claims rules',
    href: '/guidelines',
    badge: 'Page',
    badgeVariant: 'outline',
  },
  {
    id: 'nav-passports',
    category: 'navigation',
    title: 'Evidence Passports',
    subtitle: 'Audit-ready cryptographic proof records for approved content',
    href: '/passports',
    badge: 'Page',
    badgeVariant: 'outline',
  },
  {
    id: 'nav-insights',
    category: 'navigation',
    title: 'Governance Insights & Trend Analytics',
    subtitle: 'Monitor brand drift, recurrent violations, and AI rule suggestions',
    href: '/insights',
    badge: 'Page',
    badgeVariant: 'outline',
  },
  {
    id: 'nav-settings',
    category: 'navigation',
    title: 'Workspace Settings',
    subtitle: 'Manage workspace configuration, team members, and AI models',
    href: '/settings',
    badge: 'Page',
    badgeVariant: 'outline',
  },
];

export function SearchDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Dynamic search data cached from API
  const [submissions, setSubmissions] = useState<any[]>(() => searchCache?.submissions || []);
  const [guidelines, setGuidelines] = useState<any[]>(() => searchCache?.guidelines || []);
  const [facts, setFacts] = useState<any[]>(() => searchCache?.facts || []);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      if (!searchCache || now - searchCache.timestamp > CACHE_TTL_MS) {
        setLoading(true);
        Promise.all([
          fetch('/api/submissions').then(res => res.ok ? res.json() : []).catch(() => []),
          fetch('/api/guidelines').then(res => res.ok ? res.json() : []).catch(() => []),
          fetch('/api/knowledge/facts').then(res => res.ok ? res.json() : []).catch(() => []),
        ]).then(([subs, gds, fts]) => {
          const s = Array.isArray(subs) ? subs : [];
          const g = Array.isArray(gds) ? gds : [];
          const f = Array.isArray(fts) ? fts : [];
          searchCache = { submissions: s, guidelines: g, facts: f, timestamp: Date.now() };
          setSubmissions(s);
          setGuidelines(g);
          setFacts(f);
          setLoading(false);
        }).catch(() => {
          setLoading(false);
        });
      } else {
        setSubmissions(searchCache.submissions);
        setGuidelines(searchCache.guidelines);
        setFacts(searchCache.facts);
      }

      // Focus input on open
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Compute matched results
  const results = useMemo<SearchResultItem[]>(() => {
    const q = deferredQuery.trim().toLowerCase();

    if (!q) {
      // Empty query: Show quick navigation shortcuts
      return STATIC_NAV_ITEMS;
    }

    const matched: SearchResultItem[] = [];

    // 1. Search Submissions
    submissions.forEach(sub => {
      const ref = getSubmissionReference(sub).toLowerCase();
      const title = (sub.title || '').toLowerCase();
      const channel = (sub.channel || '').toLowerCase();

      if (title.includes(q) || ref.includes(q) || channel.includes(q)) {
        matched.push({
          id: `sub-${sub.id}`,
          category: 'submission',
          title: sub.title || 'Untitled submission',
          subtitle: `${getSubmissionReference(sub)} • ${sub.channel || 'General'} • Status: ${sub.status}`,
          href: `/reviews/${sub.id}`,
          badge: 'Submission',
          badgeVariant: sub.status === 'APPROVED' ? 'success' : sub.status === 'REJECTED' ? 'danger' : 'outline',
        });
      }
    });

    // 2. Search Facts
    facts.forEach(fact => {
      const code = (fact.fact_code || '').toLowerCase();
      const title = (fact.title || '').toLowerCase();
      const text = (fact.fact_text || '').toLowerCase();
      const src = (fact.source_name || '').toLowerCase();

      if (code.includes(q) || title.includes(q) || text.includes(q) || src.includes(q)) {
        matched.push({
          id: `fact-${fact.id}`,
          category: 'fact',
          title: `${fact.fact_code}: ${fact.title}`,
          subtitle: fact.fact_text || fact.source_name,
          href: '/knowledge',
          badge: 'Approved Fact',
          badgeVariant: 'low',
        });
      }
    });

    // 3. Search Guidelines
    guidelines.forEach(guide => {
      const code = (guide.rule_code || '').toLowerCase();
      const title = (guide.title || '').toLowerCase();
      const desc = (guide.description || '').toLowerCase();
      const cat = (guide.category || '').toLowerCase();

      if (code.includes(q) || title.includes(q) || desc.includes(q) || cat.includes(q)) {
        matched.push({
          id: `guide-${guide.id}`,
          category: 'guideline',
          title: `${guide.rule_code}: ${guide.title}`,
          subtitle: guide.description || `Category: ${guide.category}`,
          href: '/guidelines',
          badge: 'Brand Rule',
          badgeVariant: 'medium',
        });
      }
    });

    // 4. Search Static Nav
    STATIC_NAV_ITEMS.forEach(item => {
      if (item.title.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q))) {
        matched.push(item);
      }
    });

    return matched.slice(0, 12);
  }, [deferredQuery, submissions, facts, guidelines]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [deferredQuery]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        onClose();
        router.push(target.href);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/40 backdrop-blur-xs animate-in fade-in-50 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-line flex items-center gap-3 bg-surface">
          <Search className="w-5 h-5 text-brand shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            aria-controls="search-results-list"
            aria-activedescendant={results[selectedIndex] ? results[selectedIndex].id : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search facts, rules, submissions, or jump to page..."
            className="w-full text-sm bg-transparent text-ink placeholder:text-ink-3 focus:outline-none font-medium"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-surface-2 border border-line text-[10px] font-mono font-semibold text-ink-3">
              ESC to close
            </span>
          )}
        </div>

        {/* Results List */}
        <div
          id="search-results-list"
          role="listbox"
          aria-label="Search suggestions"
          className="max-h-[420px] overflow-y-auto p-2 divide-y divide-line/30"
        >
          {loading && results.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary-ink">
              Loading searchable knowledge...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary-ink">
              <Search className="w-7 h-7 mx-auto mb-2 text-ink-3/60" />
              <p className="font-semibold text-ink">No matches found for "{query}"</p>
              <p className="text-[11px] mt-1 text-ink-3">Try searching by keyword like "battery", "waterproof", or "rule".</p>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  id={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onClose();
                    router.push(item.href);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 px-3.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-surface-2 text-ink' : 'hover:bg-surface-2/60 text-secondary-ink'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 text-ink-3">
                      {item.category === 'submission' && <FileText className="w-4 h-4 text-brand" />}
                      {item.category === 'fact' && <CheckCircle className="w-4 h-4 text-evidence-supported" />}
                      {item.category === 'guideline' && <BookOpen className="w-4 h-4 text-accent-terracotta" />}
                      {item.category === 'navigation' && <ArrowRight className="w-4 h-4 text-ink-3" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs truncate ${isSelected ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant={item.badgeVariant as any} className="text-[10px] py-0 px-1.5 font-medium shrink-0">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-secondary-ink truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-brand shrink-0 hidden sm:block" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-surface-2/50 border-t border-line flex items-center justify-between text-[11px] text-secondary-ink">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-[10px] font-semibold text-ink">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-[10px] font-semibold text-ink">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line font-mono text-[10px] font-semibold text-ink">↵</kbd>
              to select
            </span>
          </div>
          <span className="text-[10px] text-ink-3">BrandVault AI Global Search</span>
        </div>
      </div>
    </div>
  );
}
