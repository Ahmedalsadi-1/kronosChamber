import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type StatusChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  tone?: StatusChipTone;
}

const toneClasses: Record<StatusChipTone, string> = {
  neutral: 'border-border bg-card/70 text-muted-foreground',
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-500',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive',
  info: 'border-primary/40 bg-primary/10 text-primary',
};

export function StatusChip({ icon, tone = 'neutral', className, children, ...props }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium transition-colors',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
