'use client';

import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  onSelect(): void;
}

export function FormatCard({ icon, title, description, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="group relative flex h-full w-full flex-col items-start gap-4 overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition hover:border-ring/60 active:scale-[0.99]"
    >
      {/* subtle brand glow on hover */}
      <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-60" style={{ background: 'radial-gradient(closest-side, var(--dw-glow-soft), transparent)' }} />
      <div className="relative text-4xl">{icon}</div>
      <h3 className="relative font-serif text-2xl">{title}</h3>
      <p className="relative text-sm text-muted-foreground">{description}</p>
      <span className="relative mt-auto inline-flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">
        Choose &rarr;
      </span>
    </button>
  );
}
