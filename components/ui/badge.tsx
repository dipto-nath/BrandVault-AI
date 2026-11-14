import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'low' | 'medium' | 'high' | 'neutral' | 'outline' | 'gold' | 'success' | 'danger' | 'warning';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    low:     'badge-low',
    medium:  'badge-medium',
    high:    'badge-high',
    neutral: 'badge-neutral',
    outline: 'badge-outline',
    gold:    'badge-gold',
    success: 'bg-evidence-supported/15 text-evidence-supported border-evidence-supported/30',
    danger:  'bg-evidence-contradicted/15 text-evidence-contradicted border-evidence-contradicted/30',
    warning: 'bg-evidence-unverified/15 text-evidence-unverified border-evidence-unverified/30',
  };
  return <span className={cn('badge font-sans', variants[variant] || variants.neutral, className)} {...props} />;
}
