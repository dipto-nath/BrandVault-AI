'use client';

import React, { useState } from 'react';
import {
  Users, UserPlus, Shield, ShieldCheck, Mail, Check, AlertCircle,
  Clock, Trash2, Cpu, Server, Lock, ChevronDown, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface MemberItem {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
}

export interface InvitationItem {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

interface SettingsManagerProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isDemo: boolean;
  };
  initialMembers: MemberItem[];
  initialInvitations: InvitationItem[];
  configuredModel: string;
}

const ROLES = ['ADMIN', 'MANAGER', 'REVIEWER', 'CREATOR', 'AGENCY'] as const;

export function SettingsManager({
  workspace,
  initialMembers,
  initialInvitations,
  configuredModel,
}: SettingsManagerProps) {
  const [members, setMembers] = useState<MemberItem[]>(initialMembers);
  const [invitations, setInvitations] = useState<InvitationItem[]>(initialInvitations);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'REVIEWER' | 'CREATOR' | 'MANAGER' | 'ADMIN'>('REVIEWER');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    if (workspace.isDemo) {
      setErrorMsg('Demo workspace cannot invite members. Create a new workspace to invite your team.');
      return;
    }

    setSubmittingInvite(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/workspaces/current/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInvitations((prev) => [data, ...prev]);
      setInviteEmail('');
      setInviteModalOpen(false);
      setSuccessMsg(`Invitation dispatched to ${inviteEmail}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invitation failed');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (workspace.isDemo) {
      setErrorMsg('Demo workspace member roles cannot be modified.');
      return;
    }

    setUpdatingRoleId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/workspaces/current/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member role');
      }

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );
      setSuccessMsg(`Member role updated to ${newRole}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (workspace.isDemo) return;
    try {
      await fetch(`/api/workspaces/current/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-sand-dark/60">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-brand ring-4 ring-brand/20" />
          <span className="text-xs font-bold text-brand uppercase tracking-wider">
            Workspace Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink-dark tracking-tight">
          Workspace Governance & Team Access
        </h1>
        <p className="text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
          Manage your organization&apos;s brand governance desk, verify AI engine disclosure parameters, and assign role-based permissions.
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-evidence-contradicted/10 border border-evidence-contradicted/30 text-evidence-contradicted text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold ml-2">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-evidence-supported/10 border border-evidence-supported/30 text-evidence-supported text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold ml-2">×</button>
        </div>
      )}

      {/* Team Management */}
      <Card className="bg-surface border border-sand-dark/60 rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-4 bg-cream/40 border-b border-sand-dark/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand" />
            <CardTitle className="text-base font-serif font-bold text-ink-dark">
              Workspace Team Members ({members.length})
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            className="text-xs bg-brand text-white hover:bg-brand/90 gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </Button>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="divide-y divide-sand-dark/40">
            {members.map((member) => (
              <div key={member.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sand-light border border-sand-dark flex items-center justify-center font-bold text-xs text-brand">
                    {(member.user.full_name || member.user.email || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-ink-dark flex items-center gap-2">
                      <span>{member.user.full_name || member.user.email.split('@')[0]}</span>
                      {workspace.isDemo && member.user.email.includes('demo') && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sand border border-sand-dark text-ink-muted">
                          Demo User
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-muted">{member.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={member.role}
                      disabled={workspace.isDemo || updatingRoleId === member.user_id}
                      onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-sand-dark bg-surface text-ink-dark font-medium focus:ring-1 focus:ring-brand disabled:opacity-60 cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="pt-4 border-t border-sand-dark/60 mt-4">
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Pending Invitations ({invitations.length})
              </h4>
              <div className="divide-y divide-sand-dark/30">
                {invitations.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-evidence-unverified" />
                      <span className="font-medium text-ink-dark">{inv.email}</span>
                      <span className="text-ink-muted text-[11px]">invited as {inv.role}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvitation(inv.id)}
                      className="text-[11px] text-evidence-contradicted hover:bg-evidence-contradicted/10 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Disclosure & Engine Parameters */}
      <Card className="bg-surface border border-sand-dark/60 rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-4 bg-cream/40 border-b border-sand-dark/50 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand" />
            <CardTitle className="text-base font-serif font-bold text-ink-dark">
              AI Provider Disclosure & Execution Parameters
            </CardTitle>
          </div>
          <Badge variant="low">Active & Isolated</Badge>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-cream/30 border border-sand-dark/60">
            <div>
              <span className="font-bold text-ink-muted uppercase text-[10px] tracking-wider block mb-1">
                Configured Provider
              </span>
              <span className="text-sm font-bold text-ink-dark">Google Gemini API</span>
              <span className="text-xs text-ink-muted block mt-1">
                Executed via secure server-side abstraction (@google/generative-ai)
              </span>
            </div>
            <div>
              <span className="font-bold text-ink-muted uppercase text-[10px] tracking-wider block mb-1">
                Primary Model
              </span>
              <span className="text-sm font-bold text-ink-dark font-mono">{configuredModel}</span>
              <span className="text-xs text-ink-muted block mt-1">
                Deterministic rule matching executed before LLM evaluation
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 text-xs text-ink leading-relaxed">
            <span className="font-bold text-brand block mb-1 uppercase tracking-wide text-[10px]">
              Evidence & Security Architecture Guarantee:
            </span>
            All verification and guideline extraction requests execute strictly server-side. Company API keys never reach client browsers. Content evaluated against approved ground truth only; missing company specs yield UNVERIFIED findings rather than synthetic guesses.
          </div>
        </CardContent>
      </Card>

      {/* Workspace Details */}
      <Card className="bg-surface border border-sand-dark/60 rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-4 bg-cream/40 border-b border-sand-dark/50">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-brand" />
            <CardTitle className="text-base font-serif font-bold text-ink-dark">
              Workspace Profile & Ground Truth Isolation
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-ink-muted font-semibold text-[11px] uppercase tracking-wider block mb-1">Workspace Name</span>
              <span className="font-bold text-ink-dark text-sm">{workspace.name}</span>
            </div>
            <div>
              <span className="text-ink-muted font-semibold text-[11px] uppercase tracking-wider block mb-1">Namespace Slug</span>
              <span className="font-mono text-ink-dark text-sm bg-sand-light px-2 py-0.5 rounded border border-sand-dark">{workspace.slug}</span>
            </div>
            <div>
              <span className="text-ink-muted font-semibold text-[11px] uppercase tracking-wider block mb-1">Isolation State</span>
              <Badge variant="low">{workspace.isDemo ? 'Sandbox Demo' : 'Production Tenant'}</Badge>
            </div>
          </div>
          <p className="text-ink-muted leading-relaxed pt-3 border-t border-sand-dark/40">
            {workspace.description || 'Pre-publication evidence-first governance workspace.'}
          </p>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-dark/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-sand-dark/60 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-ink-dark flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand" />
                Invite Team Member
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-ink-muted hover:text-ink-dark text-lg font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink-dark">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@yourcompany.com"
                  className="w-full p-2.5 rounded-xl border border-sand-dark bg-cream/30 focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink-dark">Role & Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-sand-dark bg-surface text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand/30 font-medium"
                >
                  <option value="REVIEWER">Reviewer (Can resolve findings & issue passports)</option>
                  <option value="CREATOR">Creator (Can submit drafts for evaluation)</option>
                  <option value="MANAGER">Manager (Can supervise compliance streams)</option>
                  <option value="ADMIN">Admin (Full organization control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={submittingInvite || !inviteEmail.trim()}
                  className="bg-brand text-white hover:bg-brand/90"
                >
                  {submittingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
