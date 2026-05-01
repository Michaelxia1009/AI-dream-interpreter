import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * `Eyebrow` — the small uppercase pill that sits above a page's `<h1>`.
 *
 * Replaces the inline `inline-flex … rounded-full border border-border/60
 * bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em]
 * text-muted-foreground backdrop-blur` pattern that's repeated across pages.
 *
 *   <Eyebrow>About</Eyebrow>          // renders "✦ About"
 *   <Eyebrow prefix="◐">Patterns</Eyebrow>
 *   <Eyebrow prefix={null}>v3.1</Eyebrow>
 */

interface EyebrowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'prefix'> {
  /** Glyph rendered before the label. Default `✦`. Pass `null` to omit. */
  prefix?: ReactNode | null;
  children: ReactNode;
}

export function Eyebrow({
  prefix = '✦',
  className,
  children,
  ...rest
}: EyebrowProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 self-start rounded-full border border-border/60 bg-background/30 px-3 py-1 text-eyebrow backdrop-blur',
        className,
      )}
      {...rest}
    >
      {prefix !== null && <span aria-hidden>{prefix}</span>}
      <span>{children}</span>
    </div>
  );
}
