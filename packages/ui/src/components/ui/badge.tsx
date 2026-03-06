import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  ghost: 'border-transparent hover:bg-accent hover:text-accent-foreground',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}