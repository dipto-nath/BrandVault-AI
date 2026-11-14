import { storage } from '@/lib/db/adaptor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Cpu, Database, Users, Lock, KeyRound, Server, Shield
} from 'lucide-react';

export default async function SettingsPage() {
  const ws = await storage.getDemoWorkspace();
  const configuredModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const members = ws ? await storage.listMembers(ws.id) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-border/60">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-accent ring-4 ring-accent/20" />
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            Workspace Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-ink-dark tracking-tight">
          Workspace Governance & Engine Settings
        </h1>
        <p className="text-sm text-ink-secondary mt-1 max-w-2xl leading-relaxed">
          Configure AI provider disclosure, workspace ground truth isolation parameters, and governance team roles.
        </p>
      </div>

      {/* AI Provider Disclosure (Mandatory Spec Requirement) */}
      <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 bg-surface-subtle/50 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark font-jakarta tracking-tight">
                AI Provider Disclosure & Engine Parameters
              </CardTitle>
            </div>
            <Badge variant="low">Active & Isolated</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-subtle border border-border">
            <div>
              <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider block mb-1">
                Configured Provider
              </span>
              <span className="text-sm font-bold text-ink-dark font-jakarta">Google Gemini API</span>
              <span className="text-xs text-ink-secondary block mt-1">
                Secure server-side abstraction (@google/generative-ai)
              </span>
            </div>
            <div>
              <span className="font-bold text-ink-secondary uppercase text-[10px] tracking-wider block mb-1">
                Primary Model
              </span>
              <span className="text-sm font-bold text-ink-dark font-mono">{configuredModel}</span>
              <span className="text-xs text-ink-secondary block mt-1">
                Deterministic rule verification before LLM judgment
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-accent/30 bg-accent-soft/30 text-xs text-ink leading-relaxed">
            <span className="font-bold text-accent block mb-1 uppercase tracking-wide text-[10px]">Security & Privacy Architecture Guarantee:</span>
            The AI model is accessed exclusively from server-side route handlers. API keys and service-role credentials are strictly stored in server environment variables and never exposed to the client. Uploaded document texts and submitted content are parsed as untrusted data under strict isolated sandbox rules.
          </div>
        </CardContent>
      </Card>

      {/* Workspace Details */}
      <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 bg-surface-subtle/50 border-b border-border">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-accent" />
            <CardTitle className="text-base font-bold text-ink-dark font-jakarta tracking-tight">
              Workspace Profile & Ground Truth Isolation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-ink-secondary font-semibold text-[11px] uppercase tracking-wider block mb-1">Workspace Name</span>
              <span className="font-bold text-ink-dark text-sm font-jakarta">{ws?.name || 'NexTech'}</span>
            </div>
            <div>
              <span className="text-ink-secondary font-semibold text-[11px] uppercase tracking-wider block mb-1">Namespace Slug</span>
              <span className="font-mono text-ink-dark text-sm bg-surface-subtle px-2 py-0.5 rounded border border-border">{ws?.slug || 'nextech'}</span>
            </div>
            <div>
              <span className="text-ink-secondary font-semibold text-[11px] uppercase tracking-wider block mb-1">Demo Isolation</span>
              <Badge variant="low">Active</Badge>
            </div>
          </div>
          <p className="text-ink-secondary leading-relaxed pt-3 border-t border-border-soft">
            {ws?.description || 'Fictional Indian consumer technology company — demo workspace for BrandVault AI.'}
          </p>
        </CardContent>
      </Card>

      {/* Role-Based Governance Access */}
      <Card className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 bg-surface-subtle/50 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark font-jakarta tracking-tight">
                Governance Roles & Publishing Permissions
              </CardTitle>
            </div>
            <span className="text-xs font-semibold text-accent uppercase tracking-wider bg-accent-soft/60 px-2 py-0.5 rounded border border-accent/20">Human-in-the-Loop</span>
          </div>
        </CardHeader>
        <CardContent className="p-5 text-xs">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm font-jakarta">Reviewer Role (Current Demo User)</div>
                <div className="text-ink-secondary mt-1 leading-relaxed">
                  Authority to approve, reject, or request content revisions; records official cryptographically signed audit decisions.
                </div>
              </div>
              <Badge variant="low">Active</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm font-jakarta">Administrator Role</div>
                <div className="text-ink-secondary mt-1 leading-relaxed">
                  Full control over brand guidelines, approved facts, document ingestion, and guideline loop proposals.
                </div>
              </div>
              <Badge variant="neutral">Admin</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm font-jakarta">Manager Role</div>
                <div className="text-ink-secondary mt-1 leading-relaxed">
                  Supervises brand compliance streams, oversees review pipelines, and audits overall governance health.
                </div>
              </div>
              <Badge variant="neutral">Manager</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm font-jakarta">Creator Role</div>
                <div className="text-ink-secondary mt-1 leading-relaxed">
                  Can draft and submit content to the Content Review Studio; cannot self-approve publishing.
                </div>
              </div>
              <Badge variant="neutral">Creator</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm font-jakarta">Agency Role</div>
                <div className="text-ink-secondary mt-1 leading-relaxed">
                  External partners submitting campaign assets against published brand guidelines and verified facts.
                </div>
              </div>
              <Badge variant="neutral">Agency</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
