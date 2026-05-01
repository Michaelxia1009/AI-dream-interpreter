'use client';

import { Activity, Brain, Eye, Zap } from 'lucide-react';
import { GlassPanel } from '@/components/ui';

export interface MoodSummary {
  avgWeirdness: number;
  avgImagination: number;
  avgEmotionalIntensity: number;
  avgVividness: number;
  count: number;
}

const METRICS = [
  { key: 'avgWeirdness', label: 'Weirdness', icon: Zap, color: 'bg-fuchsia-400' },
  { key: 'avgImagination', label: 'Imagination', icon: Brain, color: 'bg-cyan-300' },
  { key: 'avgEmotionalIntensity', label: 'Emotion', icon: Activity, color: 'bg-rose-300' },
  { key: 'avgVividness', label: 'Vividness', icon: Eye, color: 'bg-amber-300' },
] as const;

function displayScore(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

function widthFor(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.max(4, Math.min(100, value * 10))}%`;
}

export function MoodSpectrum({ mood }: { mood: MoodSummary }) {
  return (
    <GlassPanel size="sm" as="section">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mood spectrum</p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">The weather of your recent dreams</h2>
        </div>
        <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
          {mood.count} dreams
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {METRICS.map(({ key, label, icon: Icon, color }) => {
          const value = mood[key];
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-foreground/90">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                <span className="tabular-nums text-muted-foreground">{displayScore(value)} / 10</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full ${color}`} style={{ width: widthFor(value) }} />
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
