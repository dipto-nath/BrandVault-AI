import { Link } from '@/components/layout/link';
import { Button } from '@/components/ui/button';
import { Copy, ShieldCheck, Scroll } from 'lucide-react';

export default function EntryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border bg-surface sticky top-0 z-20">
        <div className="container flex items-center justify-between h-[var(--header-height)] px-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-bold tracking-tight text-ink-dark">BrandVault AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/(dashboard)" className="btn btn-outline">Explore the Platform</Link>
            <Link href="/demo" className="btn btn-primary">Open Demo Workspace</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 container relative py-24 px-0">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              The Evidence-First Brand Governance Platform
            </span>
            <h1 className="mb-6">Every brand claim deserves evidence.</h1>
            <p className="text-ink-secondary leading-relaxed mb-10 max-w-lg">
              Verify content against approved brand knowledge, explain every issue and keep every publishing decision accountable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/demo" className="btn btn-primary">
                <ShieldCheck className="w-4 h-4 mr-2" /> Open Demo Workspace
              </Link>
              <Link href="/(dashboard)" className="btn btn-outline">Explore the Platform</Link>
            </div>

            <div className="mt-12 p-6 border border-border rounded-lg bg-surface">
              <h3 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Copy className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-ink-dark">Submit content</div>
                    <div className="text-sm text-ink-secondary">Paste a draft, select its type and channel, then submit for analysis.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scroll className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-ink-dark">AI analysis</div>
                    <div className="text-sm text-ink-secondary">Claims are extracted, checked against approved evidence, and classified as Supported, Contradicted or Unverified.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-ink-dark">Human review</div>
                    <div className="text-sm text-ink-secondary">A reviewer approves, rejects or requests changes. Every decision is recorded in an auditable Brand Evidence Passport.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="card p-8 border border-border">
              <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-4">Demo workspace: NexaTech</div>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-md bg-surface-subtle text-sm">
                  <div className="font-medium text-ink-dark mb-1">Approved facts (5)</div>
                  <div className="text-ink-secondary">Battery life (24h), weight (185g), materials, waterproofing, launch date.</div>
                </div>
                <div className="p-4 border border-border rounded-md bg-surface-subtle text-sm">
                  <div className="font-medium text-ink-dark mb-1">Brand guidelines (5)</div>
                  <div className="text-ink-secondary">Tone, superlatives, terminology, specification claims, waterproof claims.</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border text-xs text-ink-secondary">
                All sample data is fictional demo content for evaluation purposes.
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-surface py-8">
        <div className="container flex items-center justify-between px-0">
          <p className="text-xs text-ink-secondary">BrandVault AI — Evidence-First Brand Governance</p>
          <p className="text-xs text-ink-secondary">AI provider: {process.env.GEMINI_API_KEY ? 'Google Gemini' : 'None (deterministic checks only)'}</p>
        </div>
      </footer>
    </div>
  );
}
