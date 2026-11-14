import { storage } from '@/lib/db/adaptor';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelative } from '@/lib/utils';
import { Shield, ArrowRight, FileCheck2, AlertTriangle } from 'lucide-react';

export default async function PassportsPage() {
  const ws = await storage.getDemoWorkspace();
  const submissions = ws ? await storage.listSubmissions(ws.id) : [];

  const total = submissions.length;
  const certified = submissions.filter(s => s.status === 'APPROVED').length;
  const underReview = submissions.filter(s => s.status === 'NEEDS_REVIEW' || s.status === 'CHANGES_REQUESTED').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <span className="eyebrow">Cryptographic Audit Trail</span>
        <h1>Brand Evidence Passports</h1>
        <p className="description">
          Immutable, traceable verification records preserving citations, factual claim states, and human sign-off signatures for publishing accountability.
        </p>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Passports Generated"
          value={total}
          icon={<FileCheck2 className="w-5 h-5 text-white" />}
          iconBg="bg-brand"
          description="Total evidence passports"
        />
        <StatCard
          title="Certified Compliant"
          value={certified}
          icon={<Shield className="w-5 h-5 text-white" />}
          iconBg="bg-supported"
          description="Approved & verified"
        />
        <StatCard
          title="Pending Audit"
          value={underReview}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          iconBg="bg-unverified"
          description="Awaiting review"
        />
        <StatCard
          title="Tamper Protection"
          value="100% SHA-256"
          icon={<Shield className="w-5 h-5 text-white" />}
          iconBg="bg-brand"
          description="Cryptographically secured"
        />
      </div>

      {/* Passports Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink font-serif">All Passports</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.length === 0 ? (
            <EmptyState
              title="No Passports Generated Yet"
              description="Passports are automatically minted when content is reviewed and approved. Submit content for review to get started."
              action={<Link href="/reviews/new"><Button className="btn-primary">Submit for Review</Button></Link>}
              icon={<FileCheck2 className="w-6 h-6" />}
            />
          ) : (
            submissions.map((s) => (
              <PassportCard key={s.id} submission={s} />
            ))
          )}
        </div>
      </section>

      {/* AI Disclosure */}
      <div className="ai-disclosure no-print">
        <Shield className="ai-disclosure-icon" />
        <span>AI-assisted findings · Humans decide</span>
      </div>
    </div>
  );
}

function PassportCard({ submission }: { submission: any }) {
  const passportId = `BVP-${submission.id.slice(0, 8).toUpperCase()}`;
  const statusVariant = submission.status === 'APPROVED' ? 'passport-card-approved' :
    submission.status === 'REJECTED' ? 'passport-card-rejected' : 'passport-card-pending';
  const statusBadge = submission.status === 'APPROVED' ? 'APPROVED' :
    submission.status === 'REJECTED' ? 'REJECTED' : 'NEEDS REVIEW';
  const statusColor = submission.status === 'APPROVED' ? 'bg-supported' :
    submission.status === 'REJECTED' ? 'bg-contradicted' : 'bg-unverified';

  return (
    <Link href={`/passports/${submission.id}`} className={`passport-card ${statusVariant} hover:shadow-lg transition-all duration-200 group`}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{statusBadge}</span>
        </div>
        <h3 className="text-lg font-bold text-ink font-serif mb-1">{submission.title}</h3>
        <p className="text-sm text-ink-2 mb-4">{submission.content_type} · {submission.channel} · {submission.risk_level || 'LOW'} risk</p>
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <span className="text-xs font-mono text-ink-3">{passportId}</span>
          <div className="stamp stamp-approved">
            <div className="stamp-circle" />
            <div className="stamp-text">{statusBadge}</div>
          </div>
        </div>
        <p className="font-handwritten text-[12px] text-ink-3 italic mt-3 text-center">
          "Every claim here can be checked."
        </p>
      </div>
    </Link>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
}) {
  return (
    <div className="card p-5 relative overflow-hidden flex flex-col justify-between min-h-[128px] bg-surface border border-line rounded-2xl shadow-sm hover:shadow-lg hover:border-line transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-card-label">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-description">{description}</div>
      </div>
    </div>
  );
}

function statusToVariant(status: string): 'low' | 'medium' | 'high' | 'neutral' {
  switch (status) {
    case 'APPROVED': return 'low';
    case 'REJECTED': return 'high';
    case 'NEEDS_REVIEW':
    case 'CHANGES_REQUESTED': return 'medium';
    default: return 'neutral';
  }
}
