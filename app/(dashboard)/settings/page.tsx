import { storage } from '@/lib/db/adaptor';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Cpu, Database, Users, Lock, KeyRound, Server, Shield } from 'lucide-react';

export default async function SettingsPage() {
  const ws = await storage.getDemoWorkspace();
  const members = ws ? await storage.listMembers(ws.id) : [];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <span className="eyebrow">Workspace Configuration</span>
        <h1>Workspace Governance & Engine Settings</h1>
        <p className="description">
          Configure AI provider disclosure, workspace ground truth isolation parameters, and governance team roles.
        </p>
      </div>

      {/* AI Provider Disclosure (Mandatory Spec Requirement) */}
      <Card className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-2 border-b border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand" />
              <h2 className="text-base font-bold text-ink font-serif">
                AI Provider Disclosure & Engine Parameters
              </h2>
            </div>
            <Badge variant="low">Active & Isolated</Badge>
          </div>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-line bg-surface-2">
            <div>
              <span className="font-bold text-ink-3 uppercase text-[10px] tracking-wider block mb-1">
                Configured Provider
              </span>
              <span className="text-sm font-bold text-ink font-serif">Google Gemini API</span>
              <span className="text-xs text-ink-3 block mt-1">
                Secure server-side abstraction (@google/generative-ai)
              </span>
            </div>
            <div>
              <span className="font-bold text-ink-3 uppercase text-[10px] tracking-wider block mb-1">
                Primary Model
              </span>
              <span className="text-sm font-bold text-ink font-serif">gemini-1.5-flash / gemini-2.0</span>
              <span className="text-xs text-ink-3 block mt-1">
                Deterministic rule verification before LLM judgment
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-brand/30 bg-brand-soft text-xs text-ink leading-relaxed">
            <span className="font-bold text-brand block mb-1 uppercase tracking-wide text-[10px]">Security & Privacy Architecture Guarantee:</span>
            The AI model is accessed exclusively from server-side route handlers. API keys and service-role credentials are strictly stored in server environment variables and never exposed to the client. Uploaded document text and extracted claims are sent only to the configured provider for the duration of the verification request. No training on your data. No persistent storage by the provider. All verification runs are logged in the audit trail with model version, prompt version, and content hash for full reproducibility.
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface-2 text-xs text-ink leading-relaxed">
            <span className="font-bold text-ink block mb-1">What we never do:</span>
            <ul className="list-disc list-inside space-y-1 text-ink-3">
              <li>Never publish or modify your approved knowledge without explicit human approval</li>
              <li>Never use your content to train or fine-tune models</li>
              <li>Never send your full brand library — only the specific claim and minimal retrieved context</li>
              <li>Never retain provider responses beyond the verification session</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Workspace Profile */}
      <Card className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-2 border-b border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand" />
              <h2 className="text-base font-bold text-ink font-serif">Workspace Profile</h2>
            </div>
            <Badge variant="low">Demo Isolation Active</Badge>
          </div>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-line bg-surface-2">
            <div>
              <span className="font-bold text-ink-3 uppercase text-[10px] tracking-wider block mb-1">Workspace Name</span>
              <span className="font-bold text-ink text-sm font-serif">{ws?.name || 'NexTech'}</span>
            </div>
            <div>
              <span className="font-bold text-ink-3 uppercase text-[10px] tracking-wider block mb-1">Namespace Slug</span>
              <span className="font-mono text-ink text-sm bg-surface border border-line px-2 py-0.5 rounded">{ws?.slug || 'nexatech'}</span>
            </div>
          </div>
          <p className="text-ink-3 leading-relaxed pt-3 border-t border-line/50">
            {ws?.description || 'Fictional Indian consumer technology company — demo workspace for BrandVault AI.'}
          </p>
        </div>
      </Card>

      {/* Role-Based Governance Access */}
      <Card className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-2 border-b border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand" />
              <h2 className="text-base font-bold text-ink font-serif">Governance Roles & Publishing Permissions</h2>
            </div>
            <span className="text-xs font-semibold text-brand uppercase tracking-wider bg-brand-soft px-2 py-0.5 rounded border border-brand/20">Human-in-the-Loop</span>
          </div>
        </div>
        <div className="p-5 text-xs">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink text-sm font-serif">Reviewer Role (Current Demo User)</div>
                <div className="text-ink-3 mt-1 leading-relaxed">
                  Authority to approve, reject, or request content revisions; records official cryptographically signed audit decisions.
                </div>
              </div>
              <Badge variant="low">Active</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink text-sm font-serif">Administrator Role</div>
                <div className="text-ink-3 mt-1 leading-relaxed">
                  Full control over brand guidelines, approved facts, document ingestion, and guideline loop proposals.
                </div>
              </div>
              <Badge variant="neutral">Admin</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-line bg-surface-2 flex items-start justify-between gap-4">
              <div>
                <div className="font-bold text-ink text-sm font-serif">Creator Role</div>
                <div className="text-ink-3 mt-1 leading-relaxed">
                  Can draft and submit content to the Content Review Studio; cannot self-approve publishing.
                </div>
              </div>
              <Badge variant="neutral">Creator</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Disclosure */}
      <div className="ai-disclosure no-print">
        <Shield className="ai-disclosure-icon" />
        <span>AI-assisted findings · Humans decide</span>
      </div>
    </div>
  );
}
