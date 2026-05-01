'use client';

import { RefreshCw } from 'lucide-react';

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
    <section className="rounded-2xl border border-ring/40 bg-card/50 p-5 shadow-[0_0_50px_rgba(125,92,255,0.14)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Weekly letter</p>
          <h2 className="mt-1 font-serif text-3xl tracking-tight">A note from the pattern</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-border/70 p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          aria-label="Refresh weekly letter"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
    </section>
  );
}
