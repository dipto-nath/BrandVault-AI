'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  className?: string;
}

export function FlowButton({
  text = 'Submit for review',
  className,
  ...props
}: FlowButtonProps) {
  return (
    <button
      className={cn(
        'group relative flex items-center gap-2 overflow-hidden rounded-full border border-brand/30 bg-surface/90 backdrop-blur-sm px-7 py-2.5 text-sm font-semibold text-brand cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-white hover:rounded-xl shadow-sm hover:shadow-md hover:shadow-brand/25 active:scale-[0.96] no-underline hover:no-underline font-jakarta',
        className
      )}
      {...props}
    >
      {/* Sliding Left Arrow (enters from left on hover) */}
      <ArrowRight 
        className="absolute w-4 h-4 left-[-25%] stroke-brand fill-none z-[9] group-hover:left-4 group-hover:stroke-white transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
      />

      {/* Center Text */}
      <span className="relative z-[1] -translate-x-1.5 group-hover:translate-x-3 transition-all duration-[700ms] ease-out no-underline">
        {text}
      </span>

      {/* Expanding Brand Circle Background */}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-brand rounded-full opacity-0 group-hover:w-[280px] group-hover:h-[280px] group-hover:opacity-100 transition-all duration-[700ms] ease-[cubic-bezier(0.19,1,0.22,1)]" />

      {/* Sliding Right Arrow (leaves to right on hover) */}
      <ArrowRight 
        className="absolute w-4 h-4 right-4 stroke-brand fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-white transition-all duration-[700ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
      />
    </button>
  );
}
