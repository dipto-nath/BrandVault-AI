import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export function Link({ children, className, href, ...props }: LinkProps) {
  return (
    <NextLink href={href as string} {...props} className={cn('text-accent hover:underline text-sm font-medium', className)}>
      {children}
    </NextLink>
  );
}
