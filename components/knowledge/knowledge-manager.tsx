'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, Upload, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  X, ShieldCheck, Database, FileUp, Sparkles, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import type { ApprovedFact, SourceDocument } from '@/types/database';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add Fact Modal State
  const [factModalOpen, setFactModalOpen] = useState(false);
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

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFact(true);
    setFactError(null);

    try {
      const res = await fetch('/api/knowledge/facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fact_code: factCode.trim(),
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

      setFacts((prev) => [json.data, ...prev]);
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
      const res = await fetch('/api/knowledge/documents', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || json.error || 'Failed to upload document');
      }

      setUploadSuccess(`Document "${selectedFile.name}" processed and text extracted successfully.`);
      setSelectedFile(null);
      // Fetch updated docs
      const docsRes = await fetch('/api/knowledge/documents');
      const docsJson = await docsRes.json();
      if (docsJson.data) {
        setDocuments(docsJson.data);
      }
      router.refresh();
    } catch (err: any) {
      setUploadError(err.message || 'Error processing document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-dark">Approved Brand Knowledge Base</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Authoritative source material and verified specifications used by BrandVault AI.
          </p>
        </div>
        <Button onClick={() => setFactModalOpen(true)} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Approved Fact</span>
        </Button>
      </div>

      {/* Facts Table Card */}
      <Card className="bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark">
                Verified Facts & Specifications ({facts.length})
              </CardTitle>
            </div>
            <span className="text-xs text-ink-secondary">
              Authoritative Ground Truth
            </span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th className="w-32">Fact Code</Th>
                <Th>Title & Verified Fact</Th>
                <Th className="w-40">Entity</Th>
                <Th className="w-48">Source Document</Th>
                <Th className="w-28">Status</Th>
                <Th className="w-20 text-right">Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {facts.length === 0 ? (
                <Tr>
                  <Td className="py-8 text-center text-sm text-ink-secondary">
                    No approved facts found. Add your first fact to begin evidence verification.
                  </Td>
                </Tr>
              ) : (
                facts.map((fact) => {
                  const isExpanded = expandedId === fact.id;
                  return (
                    <Tr key={fact.id} className="hover:bg-surface-subtle/40">
                      <Td className="font-mono text-xs font-bold text-ink-dark">
                        {fact.fact_code}
                      </Td>
                      <Td>
                        <div className="font-semibold text-ink-dark text-sm mb-0.5">
                          {fact.title}
                        </div>
                        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                          {fact.fact_text}
                        </p>
                        {isExpanded && (
                          <div className="mt-3 p-3 rounded-md bg-surface-subtle border border-border space-y-1.5 text-xs">
                            {fact.source_reference && (
                              <div>
                                <span className="font-semibold text-ink-secondary">Citation: </span>
                                <span className="font-mono text-ink-dark">{fact.source_reference}</span>
                              </div>
                            )}
                            {fact.source_excerpt && (
                              <div>
                                <span className="font-semibold text-ink-secondary">Source Excerpt: </span>
                                <span className="text-ink-dark">&ldquo;{fact.source_excerpt}&rdquo;</span>
                              </div>
                            )}
                            {fact.effective_from && (
                              <div>
                                <span className="font-semibold text-ink-secondary">Effective Date: </span>
                                <span className="text-ink-dark">{fact.effective_from}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Td>
                      <Td className="text-xs font-medium text-ink-secondary">
                        {fact.entity_name || 'NexaTech Nova'}
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

      {/* Document Ingestion & Extraction Layer */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document Upload Box */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-surface border border-border">
            <div className="flex items-center gap-2 mb-3">
              <FileUp className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-ink-dark">
                Source Document Ingestion
              </h3>
            </div>
            <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
              Upload PDF, DOCX or TXT files. Content is extracted server-side as untrusted input and held for human verification.
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
                <label className="label">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="input text-xs w-full file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-surface-subtle file:text-ink-dark hover:file:bg-border"
                />
              </div>

              <Button
                type="submit"
                disabled={!selectedFile || uploadingDoc}
                className="btn-primary w-full text-xs"
              >
                {uploadingDoc ? 'Extracting Text Safely…' : 'Ingest Document'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Uploaded Documents List */}
        <div className="lg:col-span-2">
          <Card className="bg-surface border border-border">
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
                        <span>{formatDateTime(doc.uploaded_at)}</span>
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

      {/* Add Fact Modal */}
      {factModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/40 backdrop-blur-sm">
          <div className="bg-surface rounded-lg border border-border shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
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
                    placeholder="e.g. NexaTech Nova"
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
                  placeholder="e.g. NexaTech Nova supports 30W fast charging via USB-C PD 3.0."
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
                  onClick={() => setFactModalOpen(false)}
                  disabled={submittingFact}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingFact || !factCode || !title || !factText || !sourceName}
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
