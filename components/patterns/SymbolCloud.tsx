'use client';

import { Hash } from 'lucide-react';

export interface SymbolHit {
  symbol: string;
  count: number;
}

export function SymbolCloud({ symbols }: { symbols: SymbolHit[] }) {
  const max = symbols.reduce((n, s) => Math.max(n, s.count), 1);

  return (
    <section className="surface-glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recurring symbols</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight">Images that keep returning</h2>
        </div>
        <Hash className="h-5 w-5 text-muted-foreground" />
      </div>

      {symbols.length === 0 ? (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Symbols will gather here as new dreams are generated and scored.
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {symbols.map(s => {
            const scale = s.count / max;
            const size = scale > 0.75 ? 'text-base px-4 py-2' : scale > 0.4 ? 'text-sm px-3 py-1.5' : 'text-xs px-3 py-1.5';
            return (
              <span
                key={s.symbol}
                className={`rounded-full border border-border/60 bg-secondary/60 ${size}`}
                title={`${s.count} dreams`}
              >
                {s.symbol}
                <span className="ml-1.5 text-muted-foreground">x{s.count}</span>
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}
