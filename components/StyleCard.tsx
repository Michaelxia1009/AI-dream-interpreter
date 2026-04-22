'use client';

import type { Style } from '@/lib/styles';

interface Props {
  style: Style;
  showNarrator: boolean;
  onSelect(): void;
}

export function StyleCard({ style, showNarrator, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-zinc-600 active:scale-[0.99]"
    >
      <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900" />
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg">{style.name}</h3>
        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{style.vibe}</p>
        {showNarrator && (
          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            {style.narratorPersona}
          </p>
        )}
      </div>
      <span className="text-zinc-500">&rsaquo;</span>
    </button>
  );
}
