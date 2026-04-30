'use client';

import type { LensDef, Lens } from '@/lib/interpret';

interface Props {
  lens: LensDef;
  active: boolean;
  disabled?: boolean;
  onSelect(id: Lens): void;
}

/**
 * Pill button used in the lens row above the chat. Aurora glow when active.
 * Disabled while a stream is in flight so we don't re-aim the model mid-answer.
 */
export function LensTab({ lens, active, disabled, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lens.id)}
      disabled={disabled}
      aria-pressed={active}
      className={
        active
          ? 'aurora-cta inline-flex flex-col items-start rounded-2xl px-4 py-3 text-left shadow-lg transition disabled:opacity-80'
          : 'inline-flex flex-col items-start rounded-2xl border border-border/60 bg-background/30 px-4 py-3 text-left text-muted-foreground backdrop-blur transition hover:border-ring/50 hover:text-foreground disabled:opacity-60'
      }
    >
      <span className="text-sm font-semibold tracking-wide">{lens.label}</span>
      <span className="mt-0.5 text-[11px] leading-snug opacity-90">
        {lens.blurb}
      </span>
    </button>
  );
}
