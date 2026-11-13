import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps & { type?: string }) {
  return (
    <input
      type={type}
      className={cn('input font-sans', className)}
      {...props}
    />
  );
}
