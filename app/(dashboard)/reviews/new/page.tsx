'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { FileText, Play, RotateCw } from 'lucide-react';

const EXAMPLE_CONTENT = 'Meet the NexaTech Nova! Enjoy an incredible 48 hours of battery life, weighing just 185 grams. This completely waterproof device features an AI robot buddy and is the world\'s best smartphone for everyone. Get yours today!';
const COMPLIANT_CONTENT = 'The NexaTech Nova offers up to 24 hours of battery life under specified test conditions and weighs 185 grams. The chassis uses recycled aluminium. The smart assistant helps you set reminders. Launch is scheduled for 15 December 2026.';
const UNVERIFIED_CONTENT = 'NexaTech Nova features a revolutionary new processor that delivers industry-leading performance and all-day battery life. Discover the future of mobile technology today.';

const CONTENT_TYPES = ['Social media post', 'Advertisement', 'Product description', 'Website copy', 'Email campaign', 'Press release', 'Other'];
const CHANNELS = ['Website', 'Instagram', 'LinkedIn', 'Email', 'Advertising', 'Other'];

export default function StudioPage() {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Product description');
  const [channel, setChannel] = useState('Website');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleLoadExample = () => {
    setTitle('NexaTech Nova launch announcement');
    setContentType('Advertisement');
    setChannel('Instagram');
    setContent(EXAMPLE_CONTENT);
  };

  const handleLoadCompliant = () => {
    setTitle('NexaTech Nova product description');
    setContentType('Product description');
    setChannel('Website');
    setContent(COMPLIANT_CONTENT);
  };

  const handleLoadUnverified = () => {
    setTitle('NexaTech Nova teaser');
    setContentType('Social media post');
    setChannel('Instagram');
    setContent(UNVERIFIED_CONTENT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content_type: contentType, channel, original_content: content }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Submission failed');
      setSubmittedId(json.data.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  if (submittedId) {
    return (
      <div className="space-y-6">
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center mx-auto mb-4">✓</div>
          <h2 className="text-xl font-bold text-ink-dark">Content submitted</h2>
          <p className="text-ink-secondary mt-2">Your content has been saved and is ready for analysis.</p>
          <Link href={`/(dashboard)/reviews/${submittedId}`}>
            <Button className="mt-6">View analysis</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/(dashboard)/reviews" className="text-ink-secondary hover:text-ink-dark">← Back to reviews</Link>
        <span className="text-xs text-ink-secondary">/</span>
        <h2 className="text-xl font-bold text-ink-dark">Content Review Studio</h2>
      </div>
      <p className="text-ink-secondary mb-6">Draft content, select its type and channel, then submit for brand analysis.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="label">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NexaTech Nova launch announcement" />
          </div>
          <div>
            <label className="label">Content type</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="input w-full">
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="input w-full">
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="label">Content</label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleLoadExample} disabled={loading}>
              <FileText className="w-3 h-3 mr-2" /> Load example content
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleLoadCompliant} disabled={loading}>Compliant example</Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleLoadUnverified} disabled={loading}>Unverified example</Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Paste your content here…"
            disabled={loading}
          />
          <div className="text-right text-xs text-ink-secondary">{content.length} characters</div>
        </div>

        {error && (
          <div className="rounded-lg bg-critical-soft p-4 border border-critical/30">
            <p className="text-sm text-critical">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !title || !content}>
          {loading ? <RotateCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Submit for analysis
        </Button>
      </form>
    </div>
  );
}
