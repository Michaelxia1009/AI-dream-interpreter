'use client';

import Link from 'next/link';
import { useDream } from '@/lib/state';
import { InterpretChat } from '@/components/InterpretChat';

/**
 * `/interpret` — open-ended chat over the dream currently in session.
 *
 * The dream text is taken from `useDream().session.enrichedDream`. The chat is
 * client-only so the dream never leaves the browser until the user actually
 * asks a question; we never persist interpretations server-side at this stage.
 */
export default function InterpretPage() {
  const { session } = useDream();
  const dream = session.enrichedDream ?? '';

  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background/90" />

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-24 pb-16 sm:pt-32">
        <div className="mb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            ✦ Interpret
          </div>
          <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
            Read your dream <span className="aurora-text">closely.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Three lenses, three voices. Pick one or weave between them — your
            dream is the only ground truth.
          </p>
        </div>

        <InterpretChat dream={dream} />

        <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link
            href="/capture"
            className="rounded-full border border-border/60 bg-background/30 px-4 py-2 backdrop-blur transition hover:text-foreground hover:border-ring/60"
          >
            ← New dream
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-border/60 bg-background/30 px-4 py-2 backdrop-blur transition hover:text-foreground hover:border-ring/60"
          >
            Gallery →
          </Link>
        </div>
      </section>
    </main>
  );
}
