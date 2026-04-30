import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About · Dreamweaver',
  description:
    'A quiet companion for the half-remembered world between sleep and waking — capture dreams, read them with care, and turn them into gentle art.',
};

export default function AboutPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      {/* Aurora vignette to keep text legible against the drifting nebula */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background/90" />

      <section className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col px-6 pt-24 pb-16 sm:pt-32">
        <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          ✦ About
        </div>

        <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
          About <span className="aurora-text">Dreamweaver.</span>
        </h1>

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Dreamweaver is a quiet companion for the half-remembered world
            between sleep and waking — a place to capture dreams, read them with
            care, and turn them into gentle art.
          </p>
          <p>
            We use thoughtful prompts and modern AI through a managed gateway.
            Your journal stays yours; you can journal anonymously, share only
            what you choose, and invite trusted people into private circles.
          </p>
          <p>
            Built with curiosity and respect for the strange logic of dreams.
            If something feels off in the product, we want to hear about it.
          </p>
        </div>

        {/* How it works — 3 steps from DreamTok */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: 'Tell',
              body:
                'Type or speak your dream the moment you wake. Sleepy mode keeps the screen dark.',
            },
            {
              step: 'Watch',
              body:
                'AI paints a one-of-a-kind dreamscape from your words — yours to keep, share, or set aside.',
            },
            {
              step: 'Share',
              body:
                'Drop it into a private circle, or send it into the public gallery for the week.',
            },
          ].map((s) => (
            <div
              key={s.step}
              className="surface-glass rounded-2xl p-5 text-left"
            >
              <h3 className="font-serif text-xl tracking-tight">{s.step}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Privacy promise */}
        <div className="surface-glass mt-12 rounded-2xl p-6">
          <h2 className="font-serif text-2xl tracking-tight">Privacy promise</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No accounts required. Your fingerprint stays on your device.
            Dreams expire on their own unless you keep them. Public sharing
            is opt-in, per dream — not on by default.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link
            href="/capture"
            className="aurora-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Start journaling →
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-5 py-3 text-sm text-muted-foreground backdrop-blur transition hover:text-foreground hover:border-ring/60"
          >
            Pricing →
          </Link>
        </div>
      </section>
    </main>
  );
}
