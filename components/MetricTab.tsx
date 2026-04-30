'use client';

import type { LeaderboardMetric } from '@/lib/dreams/types';

interface Props {
  id: LeaderboardMetric;
  label: string;
  active: boolean;
  onSelect(id: LeaderboardMetric): void;
}

export function MetricTab({ id, label, active, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'aurora-cta'
          : 'border border-border/60 bg-card/40 text-muted-foreground backdrop-blur hover:text-foreground hover:border-ring/60'
      }`}
    >
      {label}
    </button>
  );
}
