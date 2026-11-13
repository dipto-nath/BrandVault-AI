import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm';
}

export function Button({ className, variant = 'primary', size = 'default', ...props }: ButtonProps) {
  const base = 'btn font-sans transition-colors';
  const variants: Record<string, string> = {
    primary: 'btn-primary',
    accent: 'btn-accent',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-outline text-critical hover:bg-critical-soft hover:text-critical border-critical',
  };
  const sizes: Record<string, string> = {
    default: 'btn',
    sm: 'btn-sm',
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}
