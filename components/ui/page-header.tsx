import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Eyebrow } from './eyebrow';

/**
 * `PageHeader` — eyebrow + h1 + subtitle. The single canonical page-top
 * composition. Use on every route except the landing hero (which uses
 * `text-display-xl` directly for the larger scale).
 *
 *   <PageHeader
 *     eyebrow="Patterns"
 *     title="Your dreams, mapped."
 *     subtitle="The shapes you've been moving through this month."
 *   />
 *
 * Pass `title` as a string for the simple case, or as a node when you need
 * mixed styling (e.g. an aurora-text accent on one word).
 */

interface PageHeaderProps {
  eyebrow?: ReactNode;
  /** Glyph rendered before the eyebrow label. Default `✦`. */
  eyebrowPrefix?: ReactNode | null;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  eyebrowPrefix,
  title,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col items-start gap-5', className)}>
      {eyebrow && (
        <Eyebrow prefix={eyebrowPrefix === undefined ? '✦' : eyebrowPrefix}>
          {eyebrow}
        </Eyebrow>
      )}
      <h1 className="text-h1">{title}</h1>
      {subtitle && (
        <p className="text-body-lg text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </header>
  );
}
