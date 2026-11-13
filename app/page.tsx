import Link from 'next/link';
import {
  ShieldCheck, ArrowRight, CheckCircle2, Scale, Sparkles, BookOpen,
  Database, Shield, History, Cpu
} from 'lucide-react';

export default function EntryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base text-ink">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[var(--header-height)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-base font-bold tracking-tight text-ink-dark">BrandVault AI</span>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded uppercase tracking-wider">
              Hackathon Round 2
            </span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/overview"
              className="btn btn-outline text-xs px-3.5 py-2 font-semibold"
            >
              Explore Platform
            </Link>
            <Link
              href="/demo"
              className="btn btn-primary text-xs px-4 py-2 font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Open Demo Workspace</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-semibold border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>The Evidence-First Brand Governance Platform</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] font-medium leading-[1.15] text-ink-dark tracking-tight">
              Every brand claim deserves evidence.
            </h1>

            <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl">
              Verify content against approved brand knowledge, explain every issue using traceable sources, and keep every publishing decision accountable.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/demo"
                className="btn btn-primary text-sm px-5 py-3 font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open NexaTech Demo Workspace</span>
              </Link>
              <Link
                href="/overview"
                className="btn btn-outline text-sm px-5 py-3 font-semibold flex items-center justify-center gap-2"
              >
                <span>Explore Governance Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Core Verification Contract */}
            <div className="pt-6 border-t border-border grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold text-success uppercase text-[10px] tracking-wider block mb-0.5">
                  Supported
                </span>
                <span className="text-ink-secondary">
                  Approved evidence directly confirms the statement.
                </span>
              </div>
              <div>
                <span className="font-bold text-critical uppercase text-[10px] tracking-wider block mb-0.5">
                  Contradicted
                </span>
                <span className="text-ink-secondary">
                  Official specifications explicitly conflict with claim.
                </span>
              </div>
              <div>
                <span className="font-bold text-warning uppercase text-[10px] tracking-wider block mb-0.5">
                  Unverified
                </span>
                <span className="text-ink-secondary">
                  Insufficient evidence. Missing proof is never assumed false.
                </span>
              </div>
            </div>
          </div>

          {/* Right Product UI Architecture Card */}
          <div className="lg:col-span-5">
            <div className="card p-6 sm:p-7 bg-surface border border-border shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-dark">
                    NexaTech Demo Context
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-ink-secondary">
                  Pre-Configured
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg border border-border bg-surface-subtle">
                  <div className="flex items-center gap-2 font-bold text-ink-dark mb-1">
                    <Database className="w-4 h-4 text-accent" />
                    <span>5 Approved Facts & Specs</span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed">
                    24h battery life, 185g weight, recycled aluminium chassis, unrated waterproofing, Dec 2026 launch.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-surface-subtle">
                  <div className="flex items-center gap-2 font-bold text-ink-dark mb-1">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span>5 Active Brand Policies</span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed">
                    Clear tone, no unsupported superlatives, &ldquo;smart assistant&rdquo; preferred, spec checks, waterproof warnings.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-surface-subtle">
                  <div className="flex items-center gap-2 font-bold text-ink-dark mb-1">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Brand Evidence Passport</span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed">
                    Every review generates an immutable, printable compliance passport containing traceable evidence and human sign-off.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/demo"
                  className="btn btn-accent w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2"
                >
                  <span>Launch Live Evaluation Flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Connected Modules Overview */}
        <div className="mt-20 pt-12 border-t border-border">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-secondary block mb-1">
              End-to-End Governance Architecture
            </span>
            <h2 className="text-2xl font-bold text-ink-dark">
              Six Connected Brand Governance Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModuleCard
              icon={<Database className="w-4 h-4 text-accent" />}
              step="01"
              title="Brand Knowledge Base"
              desc="Authoritative repository of verified facts, product specs, and ingested source documents."
            />
            <ModuleCard
              icon={<Cpu className="w-4 h-4 text-accent" />}
              step="02"
              title="Brand Intelligence Engine"
              desc="Staged pipeline extracting atomic claims, retrieving citations, and testing against brand policy."
            />
            <ModuleCard
              icon={<Scale className="w-4 h-4 text-accent" />}
              step="03"
              title="Content Review Studio"
              desc="Review workspace with one-click test sample loaders, live character metrics, and channel targeting."
            />
            <ModuleCard
              icon={<CheckCircle2 className="w-4 h-4 text-accent" />}
              step="04"
              title="Human Review Gate"
              desc="Human decision-making for Approve, Reject, or Request Changes. AI never self-publishes."
            />
            <ModuleCard
              icon={<ShieldCheck className="w-4 h-4 text-accent" />}
              step="05"
              title="Brand Evidence Passport"
              desc="Cryptographically traceable audit certificates preserving claims, citations, versions and sign-off."
            />
            <ModuleCard
              icon={<History className="w-4 h-4 text-accent" />}
              step="06"
              title="Guideline Intelligence Loop"
              desc="Tracks reviewer overrides and feedback to suggest continuous, administrator-gated policy updates."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-xs text-ink-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-semibold text-ink-dark">BrandVault AI</span>
            <span>• The Evidence-First Brand Governance Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Inkloom AI Hackathon Round 2</span>
            <span>•</span>
            <span>Server-side AI: Google Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ModuleCard({
  icon,
  step,
  title,
  desc,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-5 rounded-lg border border-border bg-surface text-xs space-y-2 hover:border-accent/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="w-7 h-7 rounded-md bg-accent-soft flex items-center justify-center">
          {icon}
        </div>
        <span className="font-mono font-bold text-ink-secondary text-[11px]">{step}</span>
      </div>
      <h3 className="font-bold text-sm text-ink-dark pt-1">{title}</h3>
      <p className="text-ink-secondary leading-relaxed">{desc}</p>
    </div>
  );
}
