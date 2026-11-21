'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  ClipboardList,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  Edit3,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';
import { formatDateTime, getStatusLabel } from '@/lib/utils';

interface ConsistencyCheckJob {
  id: string;
  submission_id: string;
  language: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  findings?: ConsistencyFinding[];
}

interface ConsistencyEvidence {
  localized_claim: string;
  back_translation: string;
  approved_fact_text: string;
  approved_fact_id: string;
  source_document: string;
  source_locator: string;
  fact_set_version: string;
  values?: {
    localized: { value: number; unit: string };
    approved: { value: number; unit: string };
  };
}

interface ConsistencyFinding {
  id: string;
  finding_type: string;
  severity: string;
  title: string;
  localized_claim: string;
  back_translation: string;
  approved_fact: string;
  approved_fact_id: string;
  evidence: ConsistencyEvidence;
  confidence: number;
  status: string;
  created_at: string;
}

interface ConsistencyCheckSubmission {
  id: string;
  language: string;
  raw_text: string;
  fact_set_id: string;
  status: string;
  created_at: string;
}

const FINDING_TYPE_LABELS: Record<string, string> = {
  NUMERIC_MISMATCH: 'Numeric Mismatch',
  UNIT_MISMATCH: 'Unit Mismatch',
  DATE_MISMATCH: 'Date Mismatch',
  PRODUCT_NAME_MISMATCH: 'Product Name Mismatch',
  VERSION_MISMATCH: 'Version Mismatch',
  TERMINOLOGY_MISMATCH: 'Terminology Mismatch',
  UNSUPPORTED_CLAIM: 'Unsupported Claim',
  UNVERIFIED_CLAIM: 'Unverified Claim',
  OCR_UNAVAILABLE: 'OCR Unavailable',
};

const FINDING_TYPE_COLORS: Record<string, string> = {
  NUMERIC_MISMATCH: 'bg-red-100 text-red-800 border-red-200',
  UNIT_MISMATCH: 'bg-orange-100 text-orange-800 border-orange-200',
  DATE_MISMATCH: 'bg-red-100 text-red-800 border-red-200',
  PRODUCT_NAME_MISMATCH: 'bg-red-100 text-red-800 border-red-200',
  VERSION_MISMATCH: 'bg-red-100 text-red-800 border-red-200',
  TERMINOLOGY_MISMATCH: 'bg-orange-100 text-orange-800 border-orange-200',
  UNSUPPORTED_CLAIM: 'bg-amber-100 text-amber-800 border-amber-200',
  UNVERIFIED_CLAIM: 'bg-amber-100 text-amber-800 border-amber-200',
  OCR_UNAVAILABLE: 'bg-gray-100 text-gray-800 border-gray-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800 animate-pulse',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  OPEN: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  FALSE_POSITIVE: 'bg-gray-100 text-gray-800',
  NEEDS_CONTEXT: 'bg-amber-100 text-amber-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

const LANGUAGE_LABELS: Record<string, string> = {
  hi: 'Hindi',
  bn: 'Bengali',
  en: 'English',
};

function ConsistencyChecksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<ConsistencyCheckJob[]>([]);
  const [submissions, setSubmissions] = useState<ConsistencyCheckSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'submit' | 'fact-sets' | 'glossary'>('jobs');
  const [factSets, setFactSets] = useState<any[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<ConsistencyCheckJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);

  // Submit form state
  const [submitLanguage, setSubmitLanguage] = useState<'hi' | 'bn' | 'en'>('bn');
  const [submitFactSetId, setSubmitFactSetId] = useState('');
  const [submitText, setSubmitText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/v1/consistency-checks');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/v1/consistency-checks/fact-sets');
      if (response.ok) {
        const data = await response.json();
        setFactSets(data);
      }
    } catch (error) {
      console.error('Failed to fetch fact sets:', error);
    }
  };

  const fetchGlossary = async () => {
    try {
      const response = await fetch('/api/v1/consistency-checks/glossary');
      if (response.ok) {
        const data = await response.json();
        setGlossaryTerms(data);
      }
    } catch (error) {
      console.error('Failed to fetch glossary:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchSubmissions();
    fetchGlossary();
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/v1/consistency-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: submitLanguage,
          fact_set_id: submitFactSetId,
          text: submitText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit');
      }

      const data = await response.json();
      setSubmitText('');
      router.refresh();
      router.push(`/consistency-checks?job=${data.job_id}`);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewJob = (job: ConsistencyCheckJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  const handleCloseDetail = () => {
    setShowJobDetail(false);
    setSelectedJob(null);
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await fetch(`/api/v1/consistency-checks/${jobId}/retry`, { method: 'POST' });
      router.refresh();
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await fetch(`/api/v1/consistency-checks/${jobId}`, { method: 'DELETE' });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleDecision = async (findingId: string, decision: string) => {
    try {
      await fetch(`/api/v1/consistency-checks/findings/${findingId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to record decision:', error);
    }
  };

  const getFindingTypeIcon = (type: string) => {
    switch (type) {
      case 'NUMERIC_MISMATCH':
      case 'UNIT_MISMATCH':
      case 'DATE_MISMATCH':
      case 'PRODUCT_NAME_MISMATCH':
      case 'VERSION_MISMATCH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'TERMINOLOGY_MISMATCH':
        return <AlertCircle className="w-4 h-4" />;
      case 'UNSUPPORTED_CLAIM':
      case 'UNVERIFIED_CLAIM':
        return <XCircle className="w-4 h-4" />;
      case 'OCR_UNAVAILABLE':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (showJobDetail && selectedJob) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-line">
            <h2 className="text-lg font-bold text-ink">Job Details</h2>
            <Button variant="ghost" size="sm" onClick={handleCloseDetail}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <Badge className={STATUS_COLORS[selectedJob.status] || 'bg-gray-100 text-gray-800'}>
                  {selectedJob.status}
                </Badge>
                <Badge className="bg-purple-100 text-purple-800">
                  {LANGUAGE_LABELS[selectedJob.language] || selectedJob.language}
                </Badge>
              </div>
              <div className="text-sm text-ink-3">
                Created: {formatDateTime(selectedJob.created_at)}
                {selectedJob.completed_at && <span className="ml-4">Completed: {formatDateTime(selectedJob.completed_at)}</span>}
              </div>
            </div>

            {selectedJob.findings && selectedJob.findings.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ink">Findings ({selectedJob.findings.length})</h3>
                {selectedJob.findings.map((finding) => (
                  <Card key={finding.id} className="border-line">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getFindingTypeIcon(finding.finding_type)}
                            <span className="font-semibold text-ink">{FINDING_TYPE_LABELS[finding.finding_type] || finding.finding_type}</span>
                            <Badge className={SEVERITY_COLORS[finding.severity] || 'bg-gray-100 text-gray-800'}>
                              {finding.severity}
                            </Badge>
                            <Badge className={STATUS_COLORS[finding.status] || 'bg-gray-100 text-gray-800'}>
                              {finding.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-ink-3">
                            Confidence: {(finding.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {finding.status === 'OPEN' && (
                            <>                              <Button size="sm" variant="outline" onClick={() => handleDecision(finding.id, 'CONFIRMED')}>                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Confirm
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDecision(finding.id, 'FALSE_POSITIVE')}>                                <X className="w-3.5 h-3.5 mr-1.5" /> False Positive
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDecision(finding.id, 'NEEDS_CONTEXT')}>                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Needs Context
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-1 block">Localized Claim</label>
                          <p className="text-sm text-ink bg-surface p-3 rounded-lg border border-line">{finding.localized_claim}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-1 block">Back Translation</label>
                          <p className="text-sm text-ink bg-surface p-3 rounded-lg border border-line">{finding.back_translation}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-1 block">Approved Fact</label>
                          <p className="text-sm text-ink bg-surface p-3 rounded-lg border border-line">{finding.approved_fact}</p>
                        </div>
                      </div>

                      {finding.evidence.values && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <label className="text-xs font-medium text-amber-800 uppercase tracking-wider mb-2 block">Value Comparison</label>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-800 font-medium">Localized:</span>
                              <span className="font-mono text-amber-900">
                                {finding.evidence.values.localized?.value} {finding.evidence.values.localized?.unit}
                              </span>
                            </div>
                            <div className="text-amber-600">vs</div>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-800 font-medium">Approved:</span>
                              <span className="font-mono text-amber-900">
                                {finding.evidence.values.approved?.value} {finding.evidence.values.approved?.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-line">
                        <div className="text-xs text-ink-3">
                          Source: {finding.evidence?.source_document || 'Unknown'} | {finding.evidence?.source_locator || 'N/A'}
                        </div>
                        <div className="text-xs text-ink-3">
                          Fact Set: {finding.evidence?.fact_set_version || 'N/A'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-line">
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 text-ink-2 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink mb-2">No findings detected</h3>
                  <p className="text-ink-3">The content appears consistent with approved facts.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Consistency Checks</h1>
          <p className="text-ink-3 mt-1">Check Hindi and Bengali content against approved English facts</p>
        </div>
        <Button onClick={() => setActiveTab('submit')}>          <Sparkles className="w-4 h-4 mr-2" />
          New Check
        </Button>
      </div>

      <div className="flex gap-2 border-b border-line mb-6">
        {(['jobs', 'submit', 'fact-sets', 'glossary'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            className="px-4 py-2 text-sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </Button>
        ))}
      </div>

      {activeTab === 'jobs' && (
        <Card className="border-line">
          <CardHeader>
            <CardTitle className="text-lg">Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-ink-3">
                No consistency checks yet. <Button variant="ghost" onClick={() => setActiveTab('submit')} className="ml-1">Create your first check</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Language</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="hover:bg-surface/50 cursor-pointer" onClick={() => handleViewJob(job)}>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {LANGUAGE_LABELS[job.language] || job.language}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-800'}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(job.created_at)}</TableCell>
                        <TableCell>{job.completed_at ? formatDateTime(job.completed_at) : '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewJob(job); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {job.status === 'FAILED' && (
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRetryJob(job.id); }}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }} className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'submit' && (
        <Card className="border-line max-w-3xl">
          <CardHeader>
            <CardTitle className="text-lg">New Consistency Check</CardTitle>
            <p className="text-ink-3 text-sm mt-1">Submit Hindi or Bengali content for consistency verification against approved facts</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Language</label>
                  <Select value={submitLanguage} onValueChange={(value: string) => setSubmitLanguage(value as 'hi' | 'bn' | 'en')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bn">Bengali (bn)</SelectItem>
                      <SelectItem value="hi">Hindi (hi)</SelectItem>
                      <SelectItem value="en">English (en)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Approved Fact Set</label>
                  <Select value={submitFactSetId} onValueChange={setSubmitFactSetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fact set" />
                    </SelectTrigger>
                    <SelectContent>
                      {factSets.map((fs) => (
                        <SelectItem key={fs.id} value={fs.id}>
                          {fs.version} ({fs.status})
                        </SelectItem>
                      ))}
                      {factSets.length === 0 && (
                        <SelectItem value="" disabled>
                          No fact sets available. Create one first.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Content to Check</label>
                <textarea
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none resize-y"
                  placeholder="Paste your Hindi or Bengali content here..."
                  maxLength={20000}
                />
                <p className="text-xs text-ink-3 mt-1">{submitText.length}/20000 characters</p>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting || !submitFactSetId || !submitText.trim()}>
                  {submitting ? (
                    <>                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>                      <Sparkles className="w-4 h-4 mr-2" />
                      Check Consistency
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveTab('jobs')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'fact-sets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Approved Fact Sets</h2>
            <Button onClick={() => { /* TODO: open create fact set modal */ }}>            <Sparkles className="w-4 h-4 mr-2" /> New Fact Set
            </Button>
          </div>
          <Card className="border-line">            <CardContent className="p-0">
              {factSets.length === 0 ? (
                <div className="text-center py-8 text-ink-3">
                  No fact sets yet. Create one to start checking consistency.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factSets.map((fs) => (
                      <TableRow key={fs.id}>
                        <TableCell><code className="text-sm">{fs.version}</code></TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800">{fs.status}</Badge></TableCell>
                        <TableCell>{fs.brand_id || '—'}</TableCell>
                        <TableCell>{fs.product_id || '—'}</TableCell>
                        <TableCell>{formatDateTime(fs.created_at)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'glossary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Approved Glossary Terms</h2>
            <Button onClick={() => { /* TODO: open create glossary modal */ }}>            <Sparkles className="w-4 h-4 mr-2" /> New Term
            </Button>
          </div>
          <Card className="border-line">            <CardContent className="p-0">
              {glossaryTerms.length === 0 ? (
                <div className="text-center py-8 text-ink-3">
                  No glossary terms yet. Add approved translations for key terms.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>English</TableHead>
                      <TableHead>Hindi</TableHead>
                      <TableHead>Bengali</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Protected</TableHead>
                      <TableHead>Valid</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {glossaryTerms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell><code className="text-sm">{term.term_en}</code></TableCell>
                        <TableCell>{term.term_hi}</TableCell>
                        <TableCell>{term.term_bn}</TableCell>
                        <TableCell>{term.category}</TableCell>
                        <TableCell>{term.protected ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <Badge className="bg-gray-100 text-gray-800">No</Badge>}</TableCell>
                        <TableCell>{term.valid_from ? formatDateTime(term.valid_from).split(',')[0] : '—'} → {term.valid_to ? formatDateTime(term.valid_to).split(',')[0] : '∞'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-red-500">Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ConsistencyChecksPage;
