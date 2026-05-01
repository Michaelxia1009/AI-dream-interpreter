import Link from 'next/link';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Brand `Button` — the canonical Dreamweaver CTA / secondary / ghost button.
 *
 * Three variants, three sizes. Renders as `<button>` by default; pass
 * `as="link"` + `href` to render as a Next.js `<Link>` instead. Pass
 * `as="a"` + `href` for a plain `<a>` (e.g. external URLs).
 *
 * Visual rules locked here (do NOT redefine inline elsewhere):
 *   - primary   → filled aurora gradient (`aurora-cta`), bold tracking-wide.
 *   - secondary → outline-glass pill (border + background/30 + backdrop-blur).
 *   - ghost     → text-only with hover color, no border, no fill.
 *
 * Sizes set vertical rhythm via `px`/`py` + `text-*`. They do NOT change
 * border-radius — every variant is `rounded-full`, the brand pill shape.
 */

export type DreamButtonVariant = 'primary' | 'secondary' | 'ghost';
export type DreamButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<DreamButtonVariant, string> = {
  primary:
    'aurora-cta font-semibold tracking-wide shadow-xl hover:scale-[1.02] active:scale-[0.98]',
  secondary:
    'border border-border/60 bg-background/30 text-foreground/90 backdrop-blur transition hover:text-foreground hover:border-ring/60',
  ghost:
    'text-muted-foreground transition hover:text-foreground',
};

const SIZE_CLASSES: Record<DreamButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-full transition disabled:cursor-not-allowed disabled:opacity-55';

interface CommonProps {
  variant?: DreamButtonVariant;
  size?: DreamButtonSize;
  className?: string;
  children?: ReactNode;
}

interface ButtonAsButton
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  as?: 'button';
}

interface ButtonAsLink
  extends CommonProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> {
  as: 'link' | 'a';
  href: string;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      as = 'button',
      variant = 'primary',
      size = 'md',
      className,
      children,
      ...rest
    } = props as CommonProps & { as?: 'button' | 'link' | 'a'; href?: string };

    const cls = cn(
      BASE_CLASSES,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className,
    );

    if (as === 'link') {
      const { href, ...anchorRest } =
        rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cls}
          {...anchorRest}
        >
          {children}
        </Link>
      );
    }

    if (as === 'a') {
      const { href, ...anchorRest } =
        rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cls}
          {...anchorRest}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cls}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  },
);
