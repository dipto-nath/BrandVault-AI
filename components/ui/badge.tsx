import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'low' | 'medium' | 'high' | 'neutral' | 'outline' | 'gold';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    low:     'badge-low',
    medium:  'badge-medium',
    high:    'badge-high',
    neutral: 'badge-neutral',
    outline: 'badge-outline',
    gold:    'badge-gold',
  };
  return <span className={cn('badge font-sans', variants[variant], className)} {...props} />;
}
