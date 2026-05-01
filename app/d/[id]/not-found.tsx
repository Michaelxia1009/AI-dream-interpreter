import Link from 'next/link';

export default function DreamNotFound() {
  return (
    <main className="aurora-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
        ✦ Dreamweaver
      </div>
      <h1 className="text-h1">
        This dream <span className="aurora-text">drifted away.</span>
      </h1>
      <p className="mt-5 max-w-md text-base text-muted-foreground">
        It might have been kept private by its dreamer, or it expired with the
        week. Either way, the link is no longer live.
      </p>
      <Link
        href="/"
        className="aurora-cta mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide"
      >
        Make your own dream &rarr;
      </Link>
      <Link
        href="/leaderboard"
        className="mt-4 text-xs text-muted-foreground/80 underline-offset-4 hover:underline"
      >
        Or browse this week\u2019s top dreams
      </Link>
    </main>
  );
}
