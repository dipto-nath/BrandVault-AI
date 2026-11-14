import * as React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-12 text-center flex flex-col items-center justify-center bg-surface-subtle/50 rounded-xl border border-dashed border-border/80 my-4", className)}>
      <div className="w-12 h-12 rounded-xl bg-accent-soft/40 border border-accent/20 flex items-center justify-center text-accent mb-4">
        {icon || <Shield className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-ink-dark mb-1.5 font-sans">
        {title}
      </h3>
      <p className="text-sm text-ink-secondary max-w-md mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
