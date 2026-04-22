'use client';

import type { ScoreResult } from '@/lib/state';

const METRIC_LABELS: Record<keyof ScoreResult['metrics'], string> = {
  weirdness: 'Weirdness',
  imagination: 'Imagination',
  emotionalIntensity: 'Emotional Intensity',
  vividness: 'Vividness',
};

export function ReportCard({ score }: { score: ScoreResult }) {
  const entries = (Object.keys(METRIC_LABELS) as (keyof ScoreResult['metrics'])[]).map(k => ({
    key: k,
    label: METRIC_LABELS[k],
    ...score.metrics[k],
  }));

  return (
    <div className="report-card-surface shrink-0 overflow-hidden rounded-3xl px-5 py-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg leading-none">Dream Report Card</h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">by ✦ Dreamweaver</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
        {entries.map(m => (
          <div key={m.key} className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="aurora-text font-serif text-3xl leading-none tabular-nums">
                {m.score}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                /10
              </span>
            </div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {m.label}
            </div>
            {m.oneLiner && (
              <p className="mt-1 font-serif text-[13px] italic leading-snug text-foreground/85 line-clamp-2">
                “{m.oneLiner}”
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
