import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatRelative(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const diff = now.getTime() - date.getTime();
  if (diff < 0) {
    const futureMins = Math.floor(-diff / 60000);
    if (futureMins < 1) return 'in a moment';
    if (futureMins < 60) return `in ${futureMins}m`;
    const futureHours = Math.floor(futureMins / 60);
    if (futureHours < 24) return `in ${futureHours}h`;
    const futureDays = Math.floor(futureHours / 24);
    if (futureDays < 7) return `in ${futureDays}d`;
    return formatDate(dateString);
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

export type BadgeVariant = 'low' | 'medium' | 'high' | 'neutral' | 'outline' | 'gold' | 'success' | 'danger' | 'warning';

export function statusToVariant(status: string): BadgeVariant {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'APPROVED':
    case 'SUPPORTED':
    case 'ACCEPTED':
    case 'DISMISSED':
    case 'RESOLVED':
      return 'low';
    case 'NEEDS_REVIEW':
    case 'CHANGES_REQUESTED':
    case 'OVERRIDDEN':
    case 'UNVERIFIED':
    case 'PARTIALLY_SUPPORTED':
      return 'medium';
    case 'REJECTED':
    case 'FAILED':
    case 'CONTRADICTED':
      return 'high';
    case 'DRAFT':
    case 'ANALYZING':
    case 'OPEN':
    case 'PENDING':
    default:
      return 'neutral';
  }
}

export function riskToVariant(risk: string): BadgeVariant {
  const r = (risk || '').toUpperCase();
  switch (r) {
    case 'CRITICAL':
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
    default:
      return 'neutral';
  }
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(`bv:${key}`);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`bv:${key}`, value);
    } catch {
      // quota or disabled
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(`bv:${key}`);
    } catch {
      // disabled
    }
  },
};

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
  if (typeof submission !== 'string' && submission.reference) {
    return submission.reference;
  }
  const idStr = typeof submission === 'string' ? submission : submission.id || '';
  if (!idStr) return 'REV-2026-0001';

  // 1. Check for explicit trailing digits (e.g. from seed IDs ending in digits)
  const trailingDigits = idStr.match(/(\d+)$/);
  if (trailingDigits) {
    const num = parseInt(trailingDigits[1], 10);
    return `REV-2026-${String(num % 10000 || 1).padStart(4, '0')}`;
  }

  // 2. Check for any digits in the ID
  const anyDigits = idStr.replace(/\D/g, '');
  if (anyDigits.length >= 4) {
    const num = parseInt(anyDigits.slice(-4), 10);
    return `REV-2026-${String(num || 1).padStart(4, '0')}`;
  }

  // 3. Fallback: derive consistent 4-digit number from ID hash
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const code = (Math.abs(hash) % 9000) + 1000;
  return `REV-2026-${code}`;
}

export function getPassportReference(
  submission: string | { id?: string; passport_reference?: string; reference?: string } | null | undefined
): string {
  if (!submission) return 'BVP-2026-0000';
  if (typeof submission !== 'string') {
    if (submission.passport_reference) return submission.passport_reference;
    if (submission.reference) return submission.reference.replace('REV-', 'BVP-');
  }
  const idStr = typeof submission === 'string' ? submission : submission.id || '';
  if (!idStr) return 'BVP-2026-0001';

  const trailingDigits = idStr.match(/(\d+)$/);
  if (trailingDigits) {
    const num = parseInt(trailingDigits[1], 10);
    return `BVP-2026-${String(num % 10000 || 1).padStart(4, '0')}`;
  }

  const anyDigits = idStr.replace(/\D/g, '');
  if (anyDigits.length >= 4) {
    const num = parseInt(anyDigits.slice(-4), 10);
    return `BVP-2026-${String(num || 1).padStart(4, '0')}`;
  }

  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const code = (Math.abs(hash) % 9000) + 1000;
  return `BVP-2026-${code}`;
}
