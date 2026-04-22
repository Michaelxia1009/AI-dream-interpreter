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
      className="group flex h-full w-full flex-col items-start gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.99]"
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-zinc-300 group-hover:text-white">
        Choose &rarr;
      </span>
    </button>
  );
}
