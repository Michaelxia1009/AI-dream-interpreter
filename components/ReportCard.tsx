'use client';

import type { ScoreResult } from '@/lib/state';

const METRIC_LABELS: Record<keyof ScoreResult['metrics'], string> = {
  weirdness: 'Weirdness',
  imagination: 'Imagination',
  emotionalIntensity: 'Emotional Intensity',
  vividness: 'Vividness',
};

export function ReportCard({ score }: { score: ScoreResult }) {
  return (
    <div className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <h2 className="font-serif text-base">Dream Report Card</h2>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
        {(Object.keys(METRIC_LABELS) as (keyof ScoreResult['metrics'])[]).map(k => {
          const m = score.metrics[k];
          return (
            <div key={k} className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-zinc-400 min-w-0 truncate flex-1">{METRIC_LABELS[k]}</span>
              <div className="h-1 w-12 overflow-hidden rounded-full bg-zinc-800 shrink-0">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                  style={{ width: `${m.score * 10}%` }}
                />
              </div>
              <span className="font-serif text-sm shrink-0">{m.score}<span className="text-[10px] text-zinc-500">/10</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
