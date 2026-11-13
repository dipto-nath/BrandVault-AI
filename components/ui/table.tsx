import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export function Table({ className, ...props }: TableProps) {
  return <table className={cn('w-full border-collapse text-sm', className)} {...props} />;
}

export function Thead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...props} />;
}

export function Tbody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn(className)} {...props} />;
}

export function Th({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn(className)} {...props} />;
}

export function Td({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn(className)} {...props} />;
}
