'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, Play, RotateCw, ArrowLeft, CheckCircle2, AlertTriangle,
  Sparkles, Check, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

const EXAMPLE_CONTRADICTED =
  "Meet the NexTech Nova! Enjoy an incredible 48 hours of battery life, weighing just 185 grams. This completely waterproof device features an AI robot buddy and is the world's best smartphone for everyone. Get yours today!";

const EXAMPLE_COMPLIANT =
  "Introducing the NexTech Nova. The device offers up to 12 hours of battery life under specified test conditions and weighs 185 grams. Crafted from recycled aluminium, it features a built-in smart assistant for hands-free convenience. Scheduled for launch on 15 December 2026.";

const EXAMPLE_UNVERIFIED =
  "NexTech Nova introduces an experimental quantum-enhanced display matrix and ultra-conductive cooling architecture. Experience next-generation mobile processing built for heavy computational workloads.";

const CONTENT_TYPES = [
  'Social media post',
  'Advertisement',
  'Product description',
  'Website copy',
  'Email campaign',
  'Press release',
  'Other',
];

const CHANNELS = [
  'Website',
  'Instagram',
  'LinkedIn',
  'Email',
  'Advertising',
  'Other',
];

export default function StudioPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Product description');
  const [channel, setChannel] = useState('Website');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadContradicted = () => {
    setTitle('NexTech Nova — Promotional Launch Announcement');
    setContentType('Advertisement');
    setChannel('Instagram');
    setContent(EXAMPLE_CONTRADICTED);
  };

  const handleLoadCompliant = () => {
    setTitle('NexTech Nova — Official Product Overview');
    setContentType('Product description');
    setChannel('Website');
    setContent(EXAMPLE_COMPLIANT);
  };

  const handleLoadUnverified = () => {
    setTitle('NexTech Nova — Future Tech Preview');
    setContentType('Press release');
    setChannel('Website');
    setContent(EXAMPLE_UNVERIFIED);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Create submission
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content_type: contentType,
          channel,
          original_content: content.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || 'Submission failed');
      }

      const submissionId = json.data.id;

      // 2. Automatically trigger analysis
      try {
        await fetch(`/api/submissions/${submissionId}/analyze`, {
          method: 'POST',
        });
      } catch {
        // Even if immediate analysis encounters partial issues, navigate to review page where user can re-run
      }

      router.push(`/reviews/${submissionId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit content. Your text has been preserved.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/reviews"
            className="text-xs font-semibold text-ink-secondary hover:text-ink-dark flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Content Reviews</span>
          </Link>
          <span className="text-xs text-ink-secondary">/</span>
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Studio
          </span>
        </div>
        <h1 className="text-2xl font-bold text-ink-dark">Content Review Studio</h1>
        <p className="text-xs text-ink-secondary mt-0.5">
          Submit draft copy to verify claims against approved specifications, test terminology, and detect tone violations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-critical-soft border border-critical/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-critical shrink-0 mt-0.5" />
          <div className="text-sm text-critical">{error}</div>
        </div>
      )}

      {/* Main Submission Form */}
      <Card className="p-6 sm:p-7 bg-surface border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Submission Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NexTech Nova Launch Campaign"
                disabled={loading}
                className="input w-full text-sm font-medium"
              />
            </div>
            <div>
              <label className="label">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                disabled={loading}
                className="input w-full text-xs font-medium"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Publishing Channel</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  disabled={loading}
                  className={`py-2 px-2.5 rounded-md border text-center font-medium transition-all ${
                    channel === c
                      ? 'border-accent bg-accent-soft text-accent font-semibold'
                      : 'border-border text-ink-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Demo Content Loaders */}
          <div className="p-3.5 rounded-lg bg-surface-subtle border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" /> Hackathon Benchmark Examples
              </span>
              <span className="text-[11px] text-ink-secondary">Click to populate</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadContradicted}
                disabled={loading}
                className="text-xs bg-surface"
              >
                1. Flagged Benchmark Sample (Contradicted + Superlatives)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadCompliant}
                disabled={loading}
                className="text-xs bg-surface"
              >
                2. Fully Compliant Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadUnverified}
                disabled={loading}
                className="text-xs bg-surface"
              >
                3. Plausible but Unverified Claims
              </Button>
            </div>
          </div>

          {/* Content Body Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Content Draft for Governance Review</label>
              <span className="text-xs text-ink-secondary font-mono tnums">
                {content.length} characters • {content.trim() ? content.trim().split(/\s+/).length : 0} words
              </span>
            </div>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={9}
              placeholder="Paste or write promotional copy, specifications, or email text to test against approved facts..."
              disabled={loading}
              className="textarea w-full text-sm leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-ink-secondary">
              Original content is permanently preserved upon submission.
            </div>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Submitting & Analyzing Evidence…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Submit for Brand Verification</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
