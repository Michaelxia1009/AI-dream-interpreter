import { Flame, Moon } from 'lucide-react';
import type { StreakInfo } from '@/lib/dreams/streak';
import { GlassPanel } from '@/components/ui';

export function StreakBadge({
  streak,
  variant = 'compact',
  className = '',
}: {
  streak: StreakInfo;
  variant?: 'compact' | 'full';
  className?: string;
}) {
  const pct = Math.min(100, (streak.current / streak.nextMilestone) * 100);
  const active = streak.current > 0;

  if (variant === 'full') {
    return (
      <GlassPanel size="sm" className={`flex items-center gap-4 ${className}`}>
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(244,240,255,0.14)" strokeWidth="2" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="url(#dreamweaver-streak)"
              strokeDasharray={`${pct * 0.942} 100`}
              strokeLinecap="round"
              strokeWidth="2.5"
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
            <defs>
              <linearGradient id="dreamweaver-streak" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="50%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#F0ABFC" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {active ? (
              <Flame className="h-6 w-6 text-ring" />
            ) : (
              <Moon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-display text-2xl leading-tight">
            {streak.current}{' '}
            <span className="font-sans text-sm text-muted-foreground">
              day{streak.current === 1 ? '' : 's'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {streak.dreamtToday
              ? `${Math.max(0, streak.nextMilestone - streak.current)} to ${streak.nextMilestone}`
              : streak.current > 0
                ? 'Capture today to keep the streak alive'
                : 'Start a new streak tonight'}
          </div>
          {streak.longest > streak.current && (
            <div className="mt-0.5 text-[10px] text-muted-foreground/70">
              Longest: {streak.longest}
            </div>
          )}
        </div>
      </GlassPanel>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-ring/40 bg-ring/10 shadow-[0_0_24px_rgba(167,139,250,0.24)]'
          : 'border-border/40 bg-card/40 text-muted-foreground'
      } ${className}`}
      title={streak.dreamtToday ? 'You journaled today' : 'Capture a dream to extend your streak'}
    >
      {active ? <Flame className="h-3.5 w-3.5 text-ring" /> : <Moon className="h-3.5 w-3.5" />}
      <span className="tabular-nums">
        {streak.current} <span className="text-muted-foreground">day{streak.current === 1 ? '' : 's'}</span>
      </span>
    </div>
  );
}
