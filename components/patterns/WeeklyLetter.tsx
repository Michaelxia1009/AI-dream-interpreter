'use client';

import { RefreshCw } from 'lucide-react';
import { Button, GlassPanel } from '@/components/ui';

export interface WeeklyLetterPayload {
  text: string;
  generatedAt: number;
  cached: boolean;
}

export function WeeklyLetter({
  letter,
  loading,
  onRefresh,
}: {
  letter: WeeklyLetterPayload | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <GlassPanel as="section" size="sm" className="border-ring/40 shadow-[0_0_50px_rgba(125,92,255,0.14)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weekly letter</p>
          <h2 className="mt-1 font-display text-3xl tracking-tight">A note from the pattern</h2>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-9 w-9 px-0"
          aria-label="Refresh weekly letter"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="mt-5 font-serif text-xl leading-relaxed text-foreground/90">
        {loading && !letter
          ? 'Reading the week...'
          : letter?.text ?? 'Capture a few dreams and this space will begin to answer back.'}
      </p>
      {letter && (
        <p className="mt-4 text-xs text-muted-foreground">
          {letter.cached ? 'Cached for this week' : 'Freshly generated'}
        </p>
      )}
    </GlassPanel>
  );
}
