'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, Upload, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  X, ShieldCheck, Database, FileUp, Sparkles, Clock, Check, Trash2, Box, Eye,
  ShieldAlert, RefreshCw, ExternalLink, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import type { ApprovedFact, SourceDocument } from '@/types/database';

interface ProductItem {
  id: string;
  name: string;
  category?: string;
  model_or_version?: string;
  facts_count?: number;
}

interface FactCandidate {
  id: string;
  product_id?: string;
  entity: string;
  attribute: string;
  value_text?: string;
  value_numeric?: number;
  unit?: string;
  qualifier?: string;
  source_page?: number;
  excerpt?: string;
  confidence: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED';
  created_at: string;
}

interface KnowledgeManagerProps {
  facts: ApprovedFact[];
  documents: SourceDocument[];
}

export function KnowledgeManager({
  facts: initialFacts,
  documents: initialDocuments,
}: KnowledgeManagerProps) {
  const router = useRouter();
  const [facts, setFacts] = useState(initialFacts);
  const [documents, setDocuments] = useState(initialDocuments);
  const [candidates, setCandidates] = useState<FactCandidate[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'facts' | 'candidates'>('facts');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Add Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodVersion, setProdVersion] = useState('');
  const [submittingProd, setSubmittingProd] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Add Fact Modal State
  const [factModalOpen, setFactModalOpen] = useState(false);
  const [factProductId, setFactProductId] = useState<string>('');
  const [factCode, setFactCode] = useState('');
  const [title, setTitle] = useState('');
  const [factText, setFactText] = useState('');
  const [entityName, setEntityName] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [sourceExcerpt, setSourceExcerpt] = useState('');
  const [submittingFact, setSubmittingFact] = useState(false);
  const [factError, setFactError] = useState<string | null>(null);

  // Document Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Filtered data
  const filteredFacts = selectedProductId
    ? facts.filter((f) => f.product_id === selectedProductId)
    : facts;
  const filteredCandidates = selectedProductId
    ? candidates.filter((c) => c.product_id === selectedProductId)
    : candidates;

  // Fetch products and candidates on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    fetch('/api/knowledge/candidates')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCandidates(data);
      })
      .catch(() => {});
  }, []);

  const handleApproveCandidate = async (candidateId: string) => {
    setActionLoadingId(candidateId);
    try {
      const res = await fetch(`/api/knowledge/candidates/${candidateId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        const newFact = await res.json();
        setFacts((prev) => [newFact, ...prev]);
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    setActionLoadingId(candidateId);
    try {
      const res = await fetch(`/api/knowledge/candidates/${candidateId}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProd(true);
    setProductError(null);

    if (!prodName.trim()) {
      setProductError('Product name is required');
      setSubmittingProd(false);
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName.trim(),
          category: prodCategory.trim() || undefined,
          model_or_version: prodVersion.trim() || undefined,
          status: 'ACTIVE',
          description: '',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to create product');
      }

      const newProduct = json.data || json;
      setProducts((prev) => [newProduct, ...prev]);
      setProductModalOpen(false);
      setProdName('');
      setProdCategory('');
      setProdVersion('');
      router.refresh();
    } catch (err: any) {
      setProductError(err.message || 'Error creating product.');
    } finally {
      setSubmittingProd(false);
    }
  };

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFact(true);
    setFactError(null);

    // Auto-generate fact code if not provided
    const code = factCode.trim() || `FACT-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await fetch('/api/knowledge/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: factProductId || undefined,
          fact_code: code,
          title: title.trim(),
          fact_text: factText.trim(),
          entity_name: entityName.trim() || undefined,
          source_name: sourceName.trim(),
          source_reference: sourceReference.trim() || undefined,
          source_excerpt: sourceExcerpt.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to save fact');
      }

      setFacts((prev) => [json.data || json, ...prev]);
      setFactModalOpen(false);
      setFactCode('');
      setTitle('');
      setFactText('');
      setEntityName('');
      setSourceName('');
      setSourceReference('');
      setSourceExcerpt('');
      router.refresh();
    } catch (err: any) {
      setFactError(err.message || 'Error creating approved fact.');
    } finally {
      setSubmittingFact(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadingDoc(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/knowledge/extract-product', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to process document');
      }

      const { product, facts } = json.data;
      setUploadSuccess(`Successfully created product "${product.name}" with ${facts.length} verified facts from "${selectedFile.name}".`);
      setSelectedFile(null);

      // Refresh products, documents & facts
      const productsRes = await fetch('/api/products');
      const productsJson = await productsRes.json();
      if (productsJson.data) setProducts(productsJson.data);

      const docsRes = await fetch('/api/knowledge/documents');
      const docsJson = await docsRes.json();
      if (docsJson.data) setDocuments(docsJson.data);

      const factsRes = await fetch('/api/knowledge/facts');
      const factsJson = await factsRes.json();
      if (factsJson.data) setFacts(factsJson.data);

      router.refresh();

      setTimeout(() => {
        setProductModalOpen(false);
        setUploadSuccess(null);
      }, 2500);
    } catch (err: any) {
      setUploadError(err.message || 'Error processing document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Feature 3: Interactive Acceptance Demo State
  const [simulatingChange, setSimulatingChange] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    message: string;
    affectedId?: string;
    type: 'fact' | 'expiry';
  } | null>(null);

  const handleSimulateBatteryChange = async () => {
    setSimulatingChange(true);
    setSimulationResult(null);
    try {
      const batteryFact = facts.find((f) => f.fact_code === 'FACT-001' || f.title.toLowerCase().includes('battery')) || facts[0];
      if (!batteryFact) throw new Error('Battery fact not found');

      const is14h = batteryFact.fact_text.includes('14 hours');
      const newText = is14h
        ? 'NexaTech Nova offers up to 12 hours of battery life under specified test conditions.'
        : 'NexaTech Nova offers up to 14 hours of battery life under specified test conditions.';

      const res = await fetch(`/api/knowledge/facts/${batteryFact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: batteryFact.title,
          fact_text: newText,
          source_name: batteryFact.source_name,
          verification_status: 'APPROVED',
          notes: is14h ? 'Benchmark reset to 12h' : 'Test update: Lab re-certified to 14 hours',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed updating fact');

      // Refresh facts
      const factsRes = await fetch('/api/knowledge/facts');
      const factsJson = await factsRes.json();
      if (factsJson.data) setFacts(factsJson.data);

      setSimulationResult({
        message: `Approved fact "${batteryFact.title}" updated: ${is14h ? '14h → 12h' : '12h → 14h'}. Dependent approved posts citing it have been automatically transitioned to "Needs re-review", old passport marked stale, and review task created with before/after diff!`,
        affectedId: '00000000-0000-0000-0003-000000000001',
        type: 'fact',
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error simulating fact update');
    } finally {
      setSimulatingChange(false);
    }
  };

  const handleSimulateExpirySweep = async () => {
    setSimulatingChange(true);
    setSimulationResult(null);
    try {
      const res = await fetch('/api/source-expiry/sweep?simulate=true', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed running sweep');

      // Refresh facts
      const factsRes = await fetch('/api/knowledge/facts');
      const factsJson = await factsRes.json();
      if (factsJson.data) setFacts(factsJson.data);

      setSimulationResult({
        message: json.message || 'Scheduled source expiry sweep completed. Dependent items escalated to "Outdated" without manual submission.',
        affectedId: '00000000-0000-0000-0003-000000000001',
        type: 'expiry',
      });
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error running expiry sweep');
    } finally {
      setSimulatingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Ground Truth Repository
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            Approved Brand Knowledge Base
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Authoritative source material, verified hardware specifications, and certified product claims used by BrandVault AI for evidence-backed verification.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setProductModalOpen(true)}
            variant="outline"
            className="text-xs flex items-center gap-1.5"
          >
            <Box className="w-3.5 h-3.5 text-accent" />
            <span>New Product</span>
          </Button>
          <Button
            onClick={() => setFactModalOpen(true)}
            className="btn-primary text-xs flex items-center gap-2 shadow-sm shadow-accent/20"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Approved Fact</span>
          </Button>
        </div>
      </div>

      {/* Round 3 • Feature 3: Source-change Alerts & Automatic Re-verification Demo Bar */}
      <div className="rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-r from-[#F0F3FF] via-[#FFFDF8] to-[#FFF9F2] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-brand text-white shadow-2xs">
                Round 3 • Feature 3
              </span>
              <span className="text-xs font-semibold text-ink-dark">
                Source-Change Alerts & Automatic Re-verification
              </span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed max-w-2xl">
              "Approval is only true for as long as the facts behind it are." Edit an approved specification or sweep for expired evidence to see live dependency invalidation, stale passport markings, and before/after diff tasks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={handleSimulateBatteryChange}
              disabled={simulatingChange}
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-surface hover:bg-surface-2 border-brand/30 text-brand flex items-center gap-2 shadow-2xs"
              title="Toggle FACT-001 battery spec between 12h and 14h to test automatic invalidation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${simulatingChange ? 'animate-spin' : ''}`} />
              <span>Simulate Battery Fact Change (12h ↔ 14h)</span>
            </Button>

            <Button
              onClick={handleSimulateExpirySweep}
              disabled={simulatingChange}
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-surface hover:bg-surface-2 border-amber-400 text-amber-900 flex items-center gap-2 shadow-2xs"
              title="Run scheduled sweep to detect expired validity intervals and escalate dependent posts to Outdated"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Run Source Expiry Sweep</span>
            </Button>
          </div>
        </div>

        {/* Live Simulation Feedback Banner */}
        {simulationResult && (
          <div className="mt-3.5 pt-3 border-t border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white/90 p-3 rounded-xl border border-black/5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="font-medium text-ink-dark">{simulationResult.message}</p>
                <span className="text-[11px] text-ink-muted">
                  Audit event logged • Passport status updated • Reviewer task queued
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {simulationResult.affectedId && (
                <Link
                  href={`/reviews/${simulationResult.affectedId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-white hover:bg-ink/90 font-semibold text-xs shadow-2xs transition-colors"
                >
                  <span>View Affected Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
              <Link
                href="/reviews?status=NEEDS_RE_REVIEW"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line text-ink hover:bg-surface-2 font-medium text-xs transition-colors"
              >
                <span>Filter Reviews</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Product Selector Filter Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface border border-border overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider pl-1">
            Product:
          </span>
          <button
            onClick={() => setSelectedProductId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedProductId === null
                ? 'bg-accent text-white shadow-xs'
                : 'bg-surface-subtle text-ink-secondary hover:text-ink-dark border border-border/80'
            }`}
          >
            All Products ({facts.length})
          </button>
          {products.map((prod) => {
            const isSelected = selectedProductId === prod.id;
            return (
              <button
                key={prod.id}
                onClick={() => setSelectedProductId(prod.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-surface-subtle text-ink-secondary hover:text-ink-dark border border-border/80'
                }`}
              >
                <span>{prod.name}</span>
                {prod.category && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-sand/60 text-ink-muted'}`}>
                    {prod.category}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('facts')}
          className={`pb-3 px-3 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'facts'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink-dark'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Verified Ground Truth ({filteredFacts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-3 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'candidates'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink-dark'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Extracted Candidates Queue ({filteredCandidates.length})</span>
          {filteredCandidates.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-evidence-unverified animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Verified Ground Truth */}
      {activeTab === 'facts' && (
        <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="p-4 bg-surface-subtle/50 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <CardTitle className="text-base font-bold text-ink-dark font-jakarta tracking-tight">
                  Verified Facts & Specifications ({filteredFacts.length})
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider bg-accent-soft/60 px-2 py-0.5 rounded border border-accent/20">
                Authoritative Ground Truth
              </span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr className="bg-surface-subtle/80 border-b border-border">
                  <Th className="w-36 py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Fact Code</Th>
                  <Th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Title & Verified Fact</Th>
                  <Th className="w-40 py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Entity</Th>
                  <Th className="w-48 py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Source Document</Th>
                  <Th className="w-28 py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Status</Th>
                  <Th className="w-20 py-3 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredFacts.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="py-12 text-center text-sm text-ink-secondary">
                      No approved facts found for this product filter. Ingest documents or add facts to begin evidence verification.
                    </Td>
                  </Tr>
                ) : (
                  filteredFacts.map((fact) => {
                    const isExpanded = expandedId === fact.id;
                    return (
                      <Tr key={fact.id} className="hover:bg-surface-hover/60 border-b border-border-soft transition-colors">
                        <Td className="py-3 px-4 font-mono text-xs font-bold text-ink-dark">
                          <span className="bg-surface-subtle px-2 py-1 rounded border border-border">
                            {fact.fact_code}
                          </span>
                        </Td>
                        <Td className="py-3 px-4">
                          <div className="font-bold text-ink-dark text-sm mb-1 tracking-tight">
                            {fact.title}
                          </div>
                          <p className="text-xs text-ink-secondary leading-relaxed">
                            {fact.fact_text}
                          </p>
                          {isExpanded && (
                            <div className="mt-3 p-3.5 rounded-lg bg-surface-subtle border border-border space-y-2 text-xs">
                              {fact.source_reference && (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider">Citation:</span>
                                  <span className="font-mono text-ink-dark font-medium">{fact.source_reference}</span>
                                </div>
                              )}
                              {fact.source_excerpt && (
                                <div className="p-2.5 rounded bg-surface border border-border/80">
                                  <span className="font-bold text-accent uppercase text-[10px] tracking-wider block mb-1">Source Excerpt</span>
                                  <span className="text-ink-dark italic font-serif">&ldquo;{fact.source_excerpt}&rdquo;</span>
                                </div>
                              )}
                              {fact.effective_from && (
                                <div className="flex items-center gap-2 text-ink-muted">
                                  <span className="font-medium text-[11px]">Effective Date:</span>
                                  <span className="text-ink-secondary font-medium">{fact.effective_from}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </Td>
                        <Td className="py-3 px-4 text-xs font-medium text-ink-secondary">
                          <span className="bg-surface-subtle px-2 py-0.5 rounded text-[11px] font-semibold text-ink-dark border border-border">
                            {fact.entity_name || 'NexTech Nova'}
                          </span>
                        </Td>
                        <Td className="text-xs text-ink-secondary">
                          <span className="font-medium text-ink-dark block truncate">
                            {fact.source_name}
                          </span>
                          {fact.source_reference && (
                            <span className="text-[11px] text-ink-secondary truncate block">
                              {fact.source_reference}
                            </span>
                          )}
                        </Td>
                        <Td>
                          <Badge variant={fact.verification_status === 'APPROVED' ? 'low' : 'neutral'}>
                            {fact.verification_status}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : fact.id)}
                            className="h-7 px-2 text-xs"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tab 2: Candidate Review Queue */}
      {activeTab === 'candidates' && (
        <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="p-4 bg-surface-subtle/50 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <CardTitle className="text-base font-bold text-ink-dark font-jakarta tracking-tight">
                  Extracted Specification Candidates ({filteredCandidates.length})
                </CardTitle>
              </div>
              <span className="text-xs text-ink-secondary">
                Candidates extracted from documents require human approval before becoming ground truth.
              </span>
            </div>
          </CardHeader>
          <div className="p-4">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-12 text-sm text-ink-secondary">
                <ShieldCheck className="w-10 h-10 text-evidence-supported mx-auto mb-2 opacity-80" />
                <p className="font-medium text-ink-dark">All extracted candidates have been reviewed</p>
                <p className="text-xs text-ink-muted mt-1">Upload additional specification sheets below to extract new ground truth candidates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-4 rounded-xl border border-border bg-surface-subtle/60 hover:bg-surface-subtle transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">
                          {cand.entity} &middot; {cand.attribute}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-evidence-supported/15 text-evidence-supported font-mono text-[10px] font-semibold">
                          {Math.round(cand.confidence * 100)}% confidence
                        </span>
                        {cand.source_page && (
                          <span className="text-[10px] text-ink-muted font-mono">
                            Page {cand.source_page}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-ink-dark">
                        {cand.value_text || cand.value_numeric}
                        {cand.unit && ` ${cand.unit}`}
                        {cand.qualifier && <span className="text-xs text-ink-secondary font-normal ml-1.5">({cand.qualifier})</span>}
                      </div>
                      {cand.excerpt && (
                        <p className="text-xs text-ink-secondary italic font-serif bg-surface px-3 py-1.5 rounded-lg border border-border/60">
                          &ldquo;{cand.excerpt}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === cand.id}
                        onClick={() => handleRejectCandidate(cand.id)}
                        className="text-xs text-critical hover:bg-critical-soft"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span>Dismiss</span>
                      </Button>
                      <Button
                        size="sm"
                        disabled={actionLoadingId === cand.id}
                        onClick={() => handleApproveCandidate(cand.id)}
                        className="btn-primary text-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve as Fact</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Document Ingestion & Extraction Layer */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document Upload Box */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-surface border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <FileUp className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-ink-dark">
                Source Document Ingestion
              </h3>
            </div>
            <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
              Upload PDF, DOCX or TXT files. Specifications are parsed and queued as candidates for human verification.
            </p>

            {uploadSuccess && (
              <div className="mb-4 p-3 rounded-md bg-success-soft text-success text-xs font-medium">
                {uploadSuccess}
              </div>
            )}

            {uploadError && (
              <div className="mb-4 p-3 rounded-md bg-critical-soft text-critical text-xs font-medium">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="label">Select Specification File (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 10 * 1024 * 1024) {
                      setUploadError('File exceeds 10MB limit. Please choose a smaller file.');
                      setSelectedFile(null);
                      return;
                    }
                    setUploadError(null);
                    setSelectedFile(file);
                  }}
                  className="input text-xs w-full file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface-subtle file:text-ink-dark hover:file:bg-border"
                />
                <p className="text-xs text-ink-secondary mt-1">
                  Upload a product specification PDF. The system will automatically extract the product details and create verified facts.
                </p>
              </div>

              <Button
                type="submit"
                disabled={!selectedFile || uploadingDoc}
                className="btn-primary w-full text-xs"
              >
                {uploadingDoc ? 'Extracting Specifications…' : 'Ingest & Extract Facts'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2">
          <Card className="bg-surface border border-border rounded-xl">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-ink-dark">
                  Ingested Source Documents ({documents.length})
                </CardTitle>
                <span className="text-xs text-ink-secondary">Extraction Registry</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-secondary">
                  No uploaded documents. Upload specification sheets or manuals to build evidence.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-surface-subtle/30 text-xs">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="font-semibold text-ink-dark text-sm truncate">
                          {doc.filename}
                        </div>
                        <Badge variant={doc.document_status === 'APPROVED' ? 'low' : doc.document_status === 'FAILED' ? 'high' : 'medium'}>
                          {doc.document_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-ink-secondary mb-2">
                        <span>{doc.mime_type}</span>
                        <span>•</span>
                        <span>{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'Text'}</span>
                        <span>•</span>
                        <span suppressHydrationWarning>{formatDateTime(doc.uploaded_at)}</span>
                      </div>
                      {doc.extracted_text && (
                        <div className="p-2.5 rounded bg-surface-subtle font-mono text-[11px] text-ink line-clamp-3 leading-relaxed border border-border/60">
                          {doc.extracted_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-ink-dark">Register New Product</h3>
                <p className="text-xs text-ink-secondary">Assign specs and review content by product line.</p>
              </div>
              <button onClick={() => setProductModalOpen(false)} className="p-1 rounded text-ink-secondary hover:text-ink-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            {productError && (
                <div className="mb-4 p-3 rounded-md bg-critical-soft text-critical text-xs">
                  {productError}
                </div>
              )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="label">Product Name</label>
                <input
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. NexaTech Nova Ultra"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Category / Line</label>
                <input
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  placeholder="e.g. Smartphones, Audio, Wearables"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Model or Version</label>
                <input
                  value={prodVersion}
                  onChange={(e) => setProdVersion(e.target.value)}
                  placeholder="e.g. v2.1 or 2026 Edition"
                  className="input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setProductModalOpen(false);
                    setProdName('');
                    setProdCategory('');
                    setProdVersion('');
                    setProductError(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingProd || !prodName.trim()} className="btn-primary text-xs">
                  {submittingProd ? 'Creating…' : 'Register Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fact Modal */}
      {factModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-ink-dark">Add Approved Fact</h3>
                <p className="text-xs text-ink-secondary">Register authoritative ground truth for evidence verification.</p>
              </div>
              <button
                onClick={() => setFactModalOpen(false)}
                className="p-1 rounded text-ink-secondary hover:text-ink-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {factError && (
              <div className="mb-4 p-3 rounded-md bg-critical-soft text-critical text-xs">
                {factError}
              </div>
            )}

            <form onSubmit={handleCreateFact} className="space-y-4">
              <div>
                <label className="label">Associated Product (Optional)</label>
                <select
                  value={factProductId}
                  onChange={(e) => setFactProductId(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="">General Company Specification</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Fact Code</label>
                  <input
                    required
                    value={factCode}
                    onChange={(e) => setFactCode(e.target.value)}
                    placeholder="e.g. FACT-006"
                    className="input w-full text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="label">Entity / Product Name</label>
                  <input
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="e.g. NexTech Nova"
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label">Fact Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fast Charging Specification"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="label">Authoritative Fact Statement</label>
                <textarea
                  required
                  value={factText}
                  onChange={(e) => setFactText(e.target.value)}
                  rows={3}
                  placeholder="e.g. NexTech Nova supports 30W fast charging via USB-C PD 3.0."
                  className="textarea w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Source Document Name</label>
                  <input
                    required
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g. Nova Hardware Specification"
                    className="input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="label">Source Reference / Section</label>
                  <input
                    value={sourceReference}
                    onChange={(e) => setSourceReference(e.target.value)}
                    placeholder="e.g. Section 4.5, Power"
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="label">Source Excerpt (Optional)</label>
                <textarea
                  value={sourceExcerpt}
                  onChange={(e) => setSourceExcerpt(e.target.value)}
                  rows={2}
                  placeholder="Exact quotation from source document..."
                  className="textarea w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFactModalOpen(false);
                    setFactProductId('');
                    setFactCode('');
                    setTitle('');
                    setFactText('');
                    setEntityName('');
                    setSourceName('');
                    setSourceReference('');
                    setSourceExcerpt('');
                    setFactError(null);
                  }}
                  disabled={submittingFact}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingFact || !title || !factText || !sourceName}
                  className="btn-primary text-xs"
                >
                  {submittingFact ? 'Saving Fact…' : 'Save Approved Fact'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
