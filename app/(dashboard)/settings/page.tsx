import { storage } from '@/lib/db/adaptor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Cpu, Database, Users, Lock, KeyRound, Server, Shield
} from 'lucide-react';

export default async function SettingsPage() {
  const ws = await storage.getDemoWorkspace();
  const members = ws ? await storage.listMembers(ws.id) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-ink-dark">Workspace Governance & Engine Settings</h2>
        <p className="text-sm text-ink-secondary mt-0.5">
          Configure AI provider disclosure, workspace ground truth isolation, and governance roles.
        </p>
      </div>

      {/* AI Provider Disclosure (Mandatory Spec Requirement) */}
      <Card className="bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark">
                AI Provider Disclosure & Engine Parameters
              </CardTitle>
            </div>
            <Badge variant="low">Active & Isolated</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg bg-surface-subtle border border-border">
            <div>
              <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-1">
                Configured Provider
              </span>
              <span className="text-sm font-bold text-ink-dark">Google Gemini API</span>
              <span className="text-[11px] text-ink-secondary block mt-0.5">
                Secure server-side abstraction (@google/generative-ai)
              </span>
            </div>
            <div>
              <span className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider block mb-1">
                Primary Model
              </span>
              <span className="text-sm font-bold text-ink-dark">gemini-1.5-flash / gemini-2.0</span>
              <span className="text-[11px] text-ink-secondary block mt-0.5">
                Deterministic rule verification before LLM judgment
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-accent/20 bg-accent-soft/20 text-xs text-ink leading-relaxed">
            <span className="font-bold text-accent block mb-1">Security & Privacy Architecture:</span>
            The AI model is accessed exclusively from server-side route handlers. API keys and service-role credentials are strictly stored in server environment variables and never exposed to the frontend. Uploaded document texts and submitted content are parsed as untrusted data.
          </div>
        </CardContent>
      </Card>

      {/* Workspace Details */}
      <Card className="bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-accent" />
            <CardTitle className="text-base font-bold text-ink-dark">
              Workspace Profile & Ground Truth Isolation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-ink-secondary font-semibold block mb-0.5">Workspace Name</span>
              <span className="font-bold text-ink-dark text-sm">{ws?.name || 'NexaTech'}</span>
            </div>
            <div>
              <span className="text-ink-secondary font-semibold block mb-0.5">Namespace Slug</span>
              <span className="font-mono text-ink-dark text-sm">{ws?.slug || 'nexatech'}</span>
            </div>
            <div>
              <span className="text-ink-secondary font-semibold block mb-0.5">Demo Isolation</span>
              <Badge variant="low">Enabled</Badge>
            </div>
          </div>
          <p className="text-ink-secondary leading-relaxed pt-2 border-t border-border/60">
            {ws?.description || 'Fictional Indian consumer technology company — demo workspace for BrandVault AI.'}
          </p>
        </CardContent>
      </Card>

      {/* Role-Based Governance Access */}
      <Card className="bg-surface border border-border">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <CardTitle className="text-base font-bold text-ink-dark">
                Governance Roles & Publishing Permissions
              </CardTitle>
            </div>
            <span className="text-xs text-ink-secondary">Human-in-the-Loop</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm">Reviewer Role (Current Demo User)</div>
                <div className="text-ink-secondary mt-0.5">
                  Authority to approve, reject, or request content revisions; records official audit decisions.
                </div>
              </div>
              <Badge variant="low">Active</Badge>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm">Administrator Role</div>
                <div className="text-ink-secondary mt-0.5">
                  Full control over brand guidelines, approved facts, document ingestion, and guideline loop proposals.
                </div>
              </div>
              <Badge variant="neutral">Admin</Badge>
            </div>

            <div className="p-3 rounded-lg border border-border bg-surface-subtle flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink-dark text-sm">Creator Role</div>
                <div className="text-ink-secondary mt-0.5">
                  Can draft and submit content to the Content Review Studio; cannot self-approve publishing.
                </div>
              </div>
              <Badge variant="neutral">Creator</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
