import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * `Badge` — small pill used inline to label dream type, format, status etc.
 *
 * Two variants:
 *   - outline → border + transparent background, subdued text. Default.
 *   - aurora  → filled brand gradient, eye-catching ("featured", "new").
 */

export type BadgeVariant = 'outline' | 'aurora';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  outline:
    'border border-border/60 bg-background/30 text-muted-foreground backdrop-blur',
  aurora:
    'bg-gradient-aurora text-primary-foreground shadow-glow',
};

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({
  variant = 'outline',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
