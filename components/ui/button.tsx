import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm';
}

export function Button({ className, variant = 'primary', size = 'default', ...props }: ButtonProps) {
  const base = 'btn font-sans transition-all';
  const variants: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent:  'btn-accent',
    outline: 'btn-outline',
    ghost:   'btn-ghost',
    danger:  'btn-outline',
  };
  const sizes: Record<string, string> = {
    default: '',
    sm:      'btn-sm',
  };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      style={variant === 'danger' ? { color: 'var(--critical)', borderColor: 'rgba(224,82,82,0.4)' } : undefined}
      {...props}
    />
  );
}
