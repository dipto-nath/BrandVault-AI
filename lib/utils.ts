import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatRelative(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export function getRiskColor(level: string): string {
  if (level === 'HIGH') return 'text-critical';
  if (level === 'MEDIUM') return 'text-warning';
  return 'text-success';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Draft', ANALYZING: 'Analysing', NEEDS_REVIEW: 'Needs Review',
    CHANGES_REQUESTED: 'Changes Requested', APPROVED: 'Approved',
    REJECTED: 'Rejected', FAILED: 'Failed',
    SUPPORTED: 'Supported', CONTRADICTED: 'Contradicted', UNVERIFIED: 'Unverified',
  };
  return labels[status] || status;
}

export function getSubmissionReference(
  submission: string | { id?: string; reference?: string } | null | undefined
): string {
  if (!submission) return 'REV-2026-0000';
  if (typeof submission === 'string') {
    const match = submission.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return `REV-2026-${String(num).padStart(4, '0')}`;
    }
    return 'REV-2026-0001';
  }
  if (submission.reference) return submission.reference;
  const match = submission.id?.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `REV-2026-${String(num).padStart(4, '0')}`;
  }
  return 'REV-2026-0001';
}

export function getPassportReference(
  submission: string | { id?: string; passport_reference?: string; reference?: string } | null | undefined
): string {
  if (!submission) return 'BVP-2026-0000';
  if (typeof submission === 'string') {
    const match = submission.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return `BVP-2026-${String(num).padStart(4, '0')}`;
    }
    return 'BVP-2026-0001';
  }
  if (submission.passport_reference) return submission.passport_reference;
  if (submission.reference) return submission.reference.replace('REV-', 'BVP-');
  const match = submission.id?.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `BVP-2026-${String(num).padStart(4, '0')}`;
  }
  return 'BVP-2026-0001';
}
