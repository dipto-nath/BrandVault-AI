import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export function Link({ children, className, href, ...props }: LinkProps) {
  const isButton = className?.includes('btn');
  return (
    <NextLink
      href={href as string}
      {...props}
      className={cn(
        !isButton && 'text-accent hover:underline text-sm font-medium',
        className
      )}
    >
      {children}
    </NextLink>
  );
}
