'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileUp, Upload, Plus, Search, Filter, ChevronDown, ChevronRight,
  ChevronUp, X, ShieldCheck, Database, FileText, Box,
  ArrowRight, Sparkles, CheckCircle2, AlertCircle,
  Package, Trash2, Eye, ExternalLink, Calendar,
  Check, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import type { ApprovedFact, SourceDocument } from '@/types/database';

export interface ProductItem {
  id: string;
  name: string;
  category?: string;
  model_or_version?: string;
  facts_count?: number;
}

export interface FactCandidate {
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

export interface KnowledgeManagerClientProps {
  initialFacts: ApprovedFact[];
  initialDocuments: SourceDocument[];
  initialProducts: ProductItem[];
  showWelcome: boolean;
}

const CATEGORIES = [
  'Consumer Tech & Hardware',
  'B2B SaaS & Enterprise Software',
  'Health & Wellness',
  'E-commerce & Retail',
  'Fintech & Financial Services',
  'Media & Creative Agency',
  'Other',
];

export function KnowledgeManagerClient({
  initialFacts,
  initialDocuments,
  initialProducts,
  showWelcome,
}: KnowledgeManagerClientProps) {
  const router = useRouter();
  const [facts, setFacts] = useState<ApprovedFact[]>(initialFacts);
  const [documents, setDocuments] = useState<SourceDocument[]>(initialDocuments);
  const [candidates, setCandidates] = useState<FactCandidate[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'facts' | 'documents' | 'candidates'>('facts');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Welcome modal
  const [showWelcomeModal, setShowWelcomeModal] = useState(showWelcome);

  // Add Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodVersion, setProdVersion] = useState('');
  const [prodDescription, setProdDescription] = useState('');
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
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Load latest data on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) setProducts(json.data);
      })
      .catch(() => {});

    fetch('/api/knowledge/candidates')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json)) setCandidates(json);
      })
      .catch(() => {});
  }, []);

  const handleWelcomeDismiss = () => {
    setShowWelcomeModal(false);
    router.replace('/knowledge');
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
          description: prodDescription.trim() || undefined,
          status: 'ACTIVE',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to create product');
      }

      const newProduct = json.data || json;
      setProducts((prev) => [newProduct, ...prev]);
      setSelectedProductId(newProduct.id);
      setProductModalOpen(false);
      setProdName('');
      setProdCategory('');
      setProdVersion('');
      setProdDescription('');
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

    const generatedCode = factCode.trim() || `FACT-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await fetch('/api/knowledge/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: factProductId || undefined,
          fact_code: generatedCode,
          title: title.trim(),
          fact_text: factText.trim(),
          entity_name: entityName.trim() || undefined,
          source_name: sourceName.trim(),
          source_reference: sourceReference.trim() || undefined,
          source_excerpt: sourceExcerpt.trim() || undefined,
          verification_status: 'APPROVED',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to create fact');
      }

      const newFact = json.data || json;
      setFacts((prev) => [newFact, ...prev]);
      setFactModalOpen(false);
      setFactProductId('');
      setFactCode('');
      setTitle('');
      setFactText('');
      setEntityName('');
      setSourceName('');
      setSourceReference('');
      setSourceExcerpt('');
      router.refresh();
    } catch (err: any) {
      setFactError(err.message || 'Error creating fact.');
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

      const { product, facts: newFacts } = json.data;
      setUploadSuccess(`Extracted product "${product.name}" with ${newFacts.length} verified facts.`);
      setSelectedFile(null);

      // Refresh data
      const [productsRes, docsRes, factsRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()).catch(() => null),
        fetch('/api/knowledge/documents').then((r) => r.json()).catch(() => null),
        fetch('/api/knowledge/facts').then((r) => r.json()).catch(() => null),
      ]);

      if (productsRes?.data) setProducts(productsRes.data);
      if (docsRes?.data) setDocuments(docsRes.data);
      if (factsRes?.data) setFacts(factsRes.data);

      setSelectedProductId(product.id);
      router.refresh();
    } catch (err: any) {
      setUploadError(err.message || 'Error processing document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteFact = async (factId: string) => {
    setActionLoadingId(factId);
    try {
      const res = await fetch(`/api/knowledge/facts/${factId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete fact');
      setFacts((prev) => prev.filter((f) => f.id !== factId));
      router.refresh();
    } catch (err: any) {
      console.error('Failed to delete fact:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to resolve product name
  const getProductName = (productId?: string | null) => {
    if (!productId) return 'General Specification';
    const p = products.find((pr) => pr.id === productId);
    return p?.name || 'Unknown Product';
  };

  // Filtered facts
  const filteredFacts = useMemo(() => {
    return facts.filter((fact) => {
      // Product filter
      if (selectedProductId && fact.product_id !== selectedProductId) {
        const prod = products.find((p) => p.id === selectedProductId);
        const matchesEntity = prod && fact.entity_name && prod.name.toLowerCase().includes(fact.entity_name.toLowerCase());
        if (!matchesEntity) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          fact.title.toLowerCase().includes(q) ||
          fact.fact_text.toLowerCase().includes(q) ||
          (fact.fact_code || '').toLowerCase().includes(q) ||
          (fact.entity_name || '').toLowerCase().includes(q) ||
          (fact.source_name || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [facts, selectedProductId, searchQuery, products]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((doc) =>
      doc.filename.toLowerCase().includes(q) ||
      doc.source_name.toLowerCase().includes(q)
    );
  }, [documents, searchQuery]);

  // Counts
  const totalFacts = facts.length;
  const totalProducts = products.length;
  const totalDocuments = documents.length;
  const pendingCandidates = candidates.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand ring-4 ring-brand/20" />
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Approved Ground Truth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
            Approved Knowledge Base
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Single source of truth for verified product specifications, claims, and ingested source documentation used for compliance verification.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="btn-primary text-xs flex items-center gap-2 shadow-sm shadow-brand/20"
          >
            <FileUp className="w-4 h-4 text-white" />
            <span>Upload Specification</span>
          </Button>
          <Button
            onClick={() => setProductModalOpen(true)}
            variant="outline"
            className="text-xs flex items-center gap-1.5 bg-surface hover:bg-surface-hover"
          >
            <Plus className="w-3.5 h-3.5 text-brand" />
            <span>Add Product</span>
          </Button>
          <Button
            onClick={() => setFactModalOpen(true)}
            variant="outline"
            className="text-xs flex items-center gap-1.5 bg-surface hover:bg-surface-hover"
          >
            <Plus className="w-3.5 h-3.5 text-brand" />
            <span>Add Fact</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Products</span>
            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-jakarta text-ink-dark">{totalProducts}</span>
            <span className="text-xs text-ink-tertiary">registered</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Verified Facts</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-jakarta text-ink-dark">{totalFacts}</span>
            <span className="text-xs text-emerald-600 font-medium">approved</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Source Docs</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-jakarta text-ink-dark">{totalDocuments}</span>
            <span className="text-xs text-ink-tertiary">indexed</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Review Queue</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-jakarta text-ink-dark">{pendingCandidates}</span>
            <span className="text-xs text-ink-tertiary">candidates</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Product Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedProductId(null)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 ${
              selectedProductId === null
                ? 'bg-brand text-white shadow-sm shadow-brand/20'
                : 'bg-surface border border-border text-ink-secondary hover:text-ink-dark hover:bg-surface-hover'
            }`}
          >
            <span>All Products</span>
            <span className="text-[11px] opacity-80">({totalFacts})</span>
          </button>
          {products.map((prod) => {
            const isSelected = selectedProductId === prod.id;
            const factCount = facts.filter((f) => f.product_id === prod.id).length;
            return (
              <button
                key={prod.id}
                onClick={() => setSelectedProductId(prod.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand text-white font-semibold shadow-sm shadow-brand/20'
                    : 'bg-surface border border-border text-ink-secondary hover:text-ink-dark hover:bg-surface-hover'
                }`}
              >
                <Package className="w-3.5 h-3.5 opacity-70" />
                <span>{prod.name}</span>
                <span className="text-[11px] opacity-75">({factCount})</span>
              </button>
            );
          })}
        </div>

        {/* View Selection & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-subtle/80 border border-border rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('facts')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'facts'
                  ? 'bg-surface text-ink-dark shadow-xs font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Verified Facts ({filteredFacts.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'documents'
                  ? 'bg-surface text-ink-dark shadow-xs font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Source Documents ({filteredDocuments.length})
            </button>
            {candidates.length > 0 && (
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'candidates'
                    ? 'bg-surface text-ink-dark shadow-xs font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <span>Candidates</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingCandidates}
                </span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search facts by code, title, text, or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink text-xs p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'facts' && (
        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr className="bg-surface-subtle/80 border-b border-border">
                  <Th className="w-36 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Fact Code
                  </Th>
                  <Th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Specification & Evidence
                  </Th>
                  <Th className="w-44 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary hidden md:table-cell">
                    Product
                  </Th>
                  <Th className="w-48 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary hidden lg:table-cell">
                    Source Reference
                  </Th>
                  <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Status
                  </Th>
                  <Th className="w-20 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredFacts.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="py-16 text-center text-ink-secondary">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center text-ink-tertiary">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="max-w-sm">
                          <p className="font-semibold text-ink-dark text-base">
                            {searchQuery ? 'No specifications match your search' : 'No verified specifications yet'}
                          </p>
                          <p className="text-xs text-ink-secondary mt-1">
                            {searchQuery
                              ? 'Try adjusting your search terms or clearing the filter.'
                              : 'Upload a product specification PDF to automatically create verified ground truth facts.'}
                          </p>
                        </div>
                        {!searchQuery && (
                          <Button
                            onClick={() => setUploadModalOpen(true)}
                            className="btn-primary text-xs mt-2 flex items-center gap-2"
                          >
                            <FileUp className="w-4 h-4" />
                            <span>Upload Specification PDF</span>
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ) : (
                  filteredFacts.map((fact) => {
                    const isExpanded = expandedId === fact.id;
                    const productName = getProductName(fact.product_id);
                    const isLoading = actionLoadingId === fact.id;

                    return (
                      <React.Fragment key={fact.id}>
                        <Tr
                          onClick={() => setExpandedId(isExpanded ? null : fact.id)}
                          className={`cursor-pointer hover:bg-surface-hover/70 border-b border-border/60 transition-colors ${
                            isExpanded ? 'bg-surface-subtle/50' : ''
                          }`}
                        >
                          {/* Fact Code */}
                          <Td className="py-3 px-4 font-mono text-xs font-bold text-ink-dark">
                            <span className="bg-surface-subtle border border-border px-2 py-0.5 rounded font-mono text-[11px] text-ink-dark inline-flex items-center gap-1">
                              {fact.fact_code}
                            </span>
                          </Td>

                          {/* Specification & Evidence */}
                          <Td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink-dark text-sm tracking-tight">
                                {fact.title}
                              </span>
                              {fact.entity_name && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border text-ink-tertiary">
                                  {fact.entity_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2 leading-relaxed">
                              {fact.fact_text}
                            </p>
                          </Td>

                          {/* Product */}
                          <Td className="py-3 px-4 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary bg-surface-subtle border border-border/70 px-2 py-1 rounded-md font-medium max-w-xs truncate">
                              <Package className="w-3.5 h-3.5 text-brand shrink-0" />
                              <span className="truncate">{productName}</span>
                            </span>
                          </Td>

                          {/* Source Reference */}
                          <Td className="py-3 px-4 hidden lg:table-cell">
                            <div className="text-xs text-ink-secondary truncate max-w-[200px]" title={fact.source_name}>
                              <span className="font-medium text-ink-dark block truncate">{fact.source_name}</span>
                              {fact.source_reference && (
                                <span className="text-[11px] text-ink-tertiary block truncate">
                                  {fact.source_reference}
                                </span>
                              )}
                            </div>
                          </Td>

                          {/* Status */}
                          <Td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{fact.verification_status || 'APPROVED'}</span>
                            </span>
                          </Td>

                          {/* Actions */}
                          <Td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : fact.id)}
                                className="p-1 rounded-md hover:bg-surface-subtle text-ink-secondary transition-colors"
                                title={isExpanded ? 'Collapse' : 'Expand details'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteFact(fact.id)}
                                disabled={isLoading}
                                className="p-1 rounded-md hover:bg-red-50 text-ink-tertiary hover:text-red-600 transition-colors"
                                title="Delete Fact"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </Td>
                        </Tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <Tr className="bg-surface-subtle/40 border-b border-border/80">
                            <Td colSpan={6} className="py-4 px-6">
                              <div className="space-y-3.5 text-xs">
                                <div>
                                  <span className="font-semibold text-ink-secondary uppercase tracking-wider text-[10px] block mb-1">
                                    Full Approved Specification Text
                                  </span>
                                  <p className="text-ink-dark text-sm leading-relaxed bg-surface border border-border rounded-lg p-3">
                                    {fact.fact_text}
                                  </p>
                                </div>

                                {fact.source_excerpt && (
                                  <div>
                                    <span className="font-semibold text-ink-secondary uppercase tracking-wider text-[10px] block mb-1">
                                      Verbatim Source Excerpt (Provenance)
                                    </span>
                                    <blockquote className="border-l-2 border-brand pl-3.5 py-1 text-ink-secondary italic bg-surface-subtle/60 rounded-r-lg font-serif">
                                      &ldquo;{fact.source_excerpt}&rdquo;
                                    </blockquote>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60 text-ink-secondary">
                                  <div>
                                    <span className="text-ink-tertiary block text-[10px] uppercase font-bold">Source Document</span>
                                    <span className="font-medium text-ink-dark">{fact.source_name}</span>
                                  </div>
                                  <div>
                                    <span className="text-ink-tertiary block text-[10px] uppercase font-bold">Effective Since</span>
                                    <span className="font-medium text-ink-dark">
                                      {fact.effective_from ? new Date(fact.effective_from).toLocaleDateString() : 'Active immediately'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-ink-tertiary block text-[10px] uppercase font-bold">Linked Product</span>
                                    <span className="font-medium text-ink-dark">{productName}</span>
                                  </div>
                                </div>
                              </div>
                            </Td>
                          </Tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Source Documents Tab */}
      {activeTab === 'documents' && (
        <Card className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <Thead>
                <Tr className="bg-surface-subtle/80 border-b border-border">
                  <Th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Document Name</Th>
                  <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">File Size</Th>
                  <Th className="w-40 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Uploaded Date</Th>
                  <Th className="w-32 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary">Status</Th>
                  <Th className="w-28 py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-ink-secondary text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDocuments.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} className="py-12 text-center text-ink-secondary">
                      No source documents uploaded yet.
                    </Td>
                  </Tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <Tr key={doc.id} className="hover:bg-surface-hover/60 border-b border-border/60">
                      <Td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-ink-dark text-sm block truncate">{doc.filename}</span>
                            <span className="text-[11px] text-ink-tertiary block">{doc.source_name}</span>
                          </div>
                        </div>
                      </Td>
                      <Td className="py-3.5 px-4 text-xs text-ink-secondary">
                        {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : '—'}
                      </Td>
                      <Td className="py-3.5 px-4 text-xs text-ink-secondary">
                        {formatDateTime(doc.uploaded_at)}
                      </Td>
                      <Td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          <span>{doc.document_status}</span>
                        </span>
                      </Td>
                      <Td className="py-3.5 px-4 text-right">
                        <span className="text-xs text-ink-tertiary">Indexed</span>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Upload Specification Modal */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-base text-ink-dark">Upload Specification</h3>
                    <p className="text-xs text-ink-secondary">Auto-extract product details and verified facts</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setSelectedFile(null);
                    setUploadError(null);
                    setUploadSuccess(null);
                  }}
                  className="p-1 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4 pt-4">
                {uploadError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                    Select Specification File (.PDF)
                  </label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-brand transition-colors bg-surface-subtle/50">
                    <input
                      type="file"
                      id="spec-file-input"
                      accept=".pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f && f.size > 15 * 1024 * 1024) {
                          setUploadError('File exceeds 15MB limit.');
                          setSelectedFile(null);
                          return;
                        }
                        setUploadError(null);
                        setSelectedFile(f);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="spec-file-input" className="cursor-pointer block">
                      <div className="w-12 h-12 mx-auto rounded-full bg-brand/10 flex items-center justify-center text-brand mb-2">
                        <Upload className="w-5 h-5" />
                      </div>
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-bold text-ink-dark">{selectedFile.name}</p>
                          <p className="text-xs text-ink-tertiary mt-0.5">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready to parse
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-ink-dark">Click to browse or drag PDF here</p>
                          <p className="text-[11px] text-ink-tertiary mt-0.5">Product datasheets, spec sheets, PRDs (up to 15MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setSelectedFile(null);
                      setUploadError(null);
                      setUploadSuccess(null);
                    }}
                    className="text-xs"
                    disabled={uploadingDoc}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedFile || uploadingDoc}
                    className="btn-primary text-xs flex items-center gap-2"
                  >
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Parsing & Extracting Specifications…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Extract & Create Ground Truth</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-jakarta font-bold text-base text-ink-dark">Add New Product</h3>
                <button
                  onClick={() => setProductModalOpen(false)}
                  className="p-1 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {productError && (
                <div className="my-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {productError}
                </div>
              )}

              <form onSubmit={handleCreateProduct} className="space-y-3.5 pt-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Product Name *
                  </label>
                  <Input
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Acme Phone X"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2 text-ink"
                  >
                    <option value="">Select industry category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Model or Version
                  </label>
                  <Input
                    value={prodVersion}
                    onChange={(e) => setProdVersion(e.target.value)}
                    placeholder="e.g. Generation 3 / Pro Max"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    rows={2}
                    placeholder="Short summary of product purpose and target market..."
                    className="w-full text-xs rounded-lg border border-border bg-surface p-2.5 text-ink placeholder:text-ink-tertiary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProductModalOpen(false)}
                    className="text-xs"
                    disabled={submittingProd}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingProd || !prodName.trim()}
                    className="btn-primary text-xs"
                  >
                    {submittingProd ? 'Saving…' : 'Create Product'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Fact Modal */}
      <AnimatePresence>
        {factModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-jakarta font-bold text-base text-ink-dark">Add Approved Fact</h3>
                <button
                  onClick={() => setFactModalOpen(false)}
                  className="p-1 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-subtle transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {factError && (
                <div className="my-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {factError}
                </div>
              )}

              <form onSubmit={handleCreateFact} className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Target Product
                    </label>
                    <select
                      value={factProductId}
                      onChange={(e) => setFactProductId(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2 text-ink"
                    >
                      <option value="">General Specification</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Fact Code (Optional)
                    </label>
                    <Input
                      value={factCode}
                      onChange={(e) => setFactCode(e.target.value)}
                      placeholder="e.g. BATT-001 or auto"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Specification Title *
                    </label>
                    <Input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Battery Life"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Entity Name
                    </label>
                    <Input
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder="e.g. MacBook Air M5"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Full Specification / Fact Text *
                  </label>
                  <textarea
                    required
                    value={factText}
                    onChange={(e) => setFactText(e.target.value)}
                    rows={3}
                    placeholder="e.g. Offers up to 18 hours of video playback or 15 hours of wireless web browsing."
                    className="w-full text-xs rounded-lg border border-border bg-surface p-2.5 text-ink"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Source Document Name *
                    </label>
                    <Input
                      required
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. Product Specification v3"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Source Reference
                    </label>
                    <Input
                      value={sourceReference}
                      onChange={(e) => setSourceReference(e.target.value)}
                      placeholder="e.g. Section 4.2, Page 12"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Verbatim Source Excerpt
                  </label>
                  <textarea
                    value={sourceExcerpt}
                    onChange={(e) => setSourceExcerpt(e.target.value)}
                    rows={2}
                    placeholder="Exact quote from the source specification..."
                    className="w-full text-xs rounded-lg border border-border bg-surface p-2.5 text-ink italic font-serif"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFactModalOpen(false)}
                    className="text-xs"
                    disabled={submittingFact}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingFact || !title.trim() || !factText.trim() || !sourceName.trim()}
                    className="btn-primary text-xs"
                  >
                    {submittingFact ? 'Saving…' : 'Save Approved Fact'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
