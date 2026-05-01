import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LandingHeader } from '@/components/LandingHeader';

/**
 * `PageShell` — every route's outermost wrapper. Sets the aurora background,
 * vignette, max-width container, and (optionally) the sticky landing header.
 *
 * `NavMenu` and `FloatingThemeToggle` are rendered globally in `app/layout.tsx`,
 * so this shell never has to mount them. The `chrome` prop is purely about
 * which extra header (if any) sits at the top:
 *
 *   - `landing` → renders the sticky `<LandingHeader />` (use on `/`,
 *     `/about`, `/pricing`, marketing pages).
 *   - `app` → no extra chrome; NavMenu from layout is enough (use on
 *     in-product pages: `/capture`, `/journal`, `/patterns`, `/result`…).
 *   - `share` → no chrome at all; identical to `app` but reserved as a
 *     semantic flag in case we later want to hide more on `/d/[id]`.
 *
 * Width prop maps to a max-width that scales with content density:
 *   - `narrow`  → max-w-2xl   (long-form / single-column reading flows)
 *   - `default` → max-w-4xl   (most app pages)
 *   - `wide`    → max-w-6xl   (leaderboard, patterns dashboard)
 */

export type PageShellChrome = 'landing' | 'app' | 'share';
export type PageShellWidth = 'narrow' | 'default' | 'wide';

const WIDTH_CLASS: Record<PageShellWidth, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
};

interface PageShellProps {
  chrome?: PageShellChrome;
  width?: PageShellWidth;
  className?: string;
  /** Override the default top padding (`pt-24 sm:pt-28`). Rare. */
  topPadClassName?: string;
  children: ReactNode;
}

export function PageShell({
  chrome = 'app',
  width = 'default',
  className,
  topPadClassName,
  children,
}: PageShellProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      {chrome === 'landing' && <LandingHeader />}

      {/* Aurora vignette to keep text legible against the drifting nebula */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background/90" />

      <section
        className={cn(
          'relative z-10 mx-auto flex min-h-dvh flex-col px-6 pb-16',
          WIDTH_CLASS[width],
          topPadClassName ?? 'pt-24 sm:pt-28',
          className,
        )}
      >
        {children}
      </section>
    </main>
  );
}
