import type { ElementType, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * `GlassPanel` — frosted card sitting on top of the aurora background.
 *
 * Wraps the existing `surface-glass` utility plus the `glass-pad-*` padding
 * scale. Use this anywhere a card is needed; do NOT re-invent glass styling
 * inline. Hover shadow is applied globally (see `surface-glass` in
 * globals.css) so featured cards feel alive.
 *
 *   <GlassPanel size="md">…</GlassPanel>
 *   <GlassPanel size="sm" radius="2xl" as="article">…</GlassPanel>
 */

export type GlassPanelSize = 'sm' | 'md' | 'lg';
export type GlassPanelRadius = '2xl' | '3xl';

const SIZE_PAD: Record<GlassPanelSize, string> = {
  sm: 'glass-pad-sm',
  md: 'glass-pad-md',
  lg: 'glass-pad-lg',
};

const RADIUS_CLASS: Record<GlassPanelRadius, string> = {
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  size?: GlassPanelSize;
  radius?: GlassPanelRadius;
  as?: ElementType;
  children?: ReactNode;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLElement>;
}

export function GlassPanel({
  size = 'md',
  radius = '2xl',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        'surface-glass',
        RADIUS_CLASS[radius],
        SIZE_PAD[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
