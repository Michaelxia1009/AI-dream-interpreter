import Link from 'next/link';
import { HeroLoop } from '@/components/HeroLoop';

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-dvh">
        <HeroLoop />
        {/* Aurora vignette — deepens the edges, lets hero video glow through the middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
        <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            ✦ Your subconscious, illustrated
          </div>
          <h1 className="font-serif text-6xl leading-tight tracking-tight sm:text-7xl">
            Catch your dreams
            <br />
            <span className="aurora-text">before they fade.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            A nightly companion that captures, illustrates, and decodes your
            dreams — so the patterns of your subconscious become visible over
            time.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/capture"
              className="aurora-cta inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Start journaling — it&apos;s free
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-6 py-3 text-sm text-muted-foreground backdrop-blur transition hover:text-foreground hover:border-ring/60"
            >
              Explore the gallery →
            </Link>
          </div>
          <p className="mt-8 text-xs text-muted-foreground/80">
            No sign-up. No credit card. Just open and dream.
          </p>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              How it works
            </p>
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              Three breaths between you
              <br />
              and <span className="aurora-text">understanding.</span>
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: 'Step 1',
                title: 'Capture',
                body:
                  'Type or speak your dream the moment you wake. Sleepy mode keeps the screen dark and friction zero.',
              },
              {
                step: 'Step 2',
                title: 'Illustrate',
                body:
                  'AI paints a one-of-a-kind dreamscape from your words. Watch your subconscious become a gallery.',
              },
              {
                step: 'Step 3',
                title: 'Decode',
                body:
                  'Three lenses — symbolic, emotional, archetypal — reveal what your dreams are trying to tell you.',
              },
            ].map((s) => (
              <div
                key={s.title}
                className="surface-glass rounded-2xl p-6 text-left"
              >
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.step}
                </p>
                <h3 className="font-serif text-2xl tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Features
            </p>
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              A whole observatory for
              <br />
              your <span className="aurora-text">inner sky.</span>
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'AI Dream Art',
                body:
                  'Every dream becomes a painting. Five free per day, unlimited with Plus.',
              },
              {
                title: 'Three Interpretation Lenses',
                body:
                  'Symbolic, emotional, and Jungian-archetypal readings of every dream.',
              },
              {
                title: 'Symbol Constellation',
                body:
                  'Recurring symbols become a personal star map — see your inner world.',
              },
              {
                title: 'Pattern Insights',
                body:
                  'Mood trends, lucidity streaks, and weekly AI essays about your week of dreams.',
              },
              {
                title: 'Ask Your Dreams',
                body:
                  'Chat with the full archive of your subconscious. "What do my flying dreams mean?"',
              },
              {
                title: 'Dream Circles',
                body:
                  'Private invite-only groups for sharing dreams with people who matter.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="surface-glass rounded-2xl p-6"
              >
                <h3 className="font-serif text-xl tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DREAM GALLERY TEASER ──────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Dreams illustrated
          </p>
          <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Your dreams, painted
            <br />
            by <span className="aurora-text">light.</span>
          </h2>
          <Link
            href="/leaderboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-6 py-3 text-sm text-muted-foreground backdrop-blur transition hover:text-foreground hover:border-ring/60"
          >
            Open the public dream gallery →
          </Link>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Questions
            </p>
            <h2 className="font-serif text-4xl tracking-tight sm:text-5xl">
              Things people <span className="aurora-text">wonder.</span>
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: 'Do I really not have to sign up?',
                a: 'Right. Open the app, start journaling. Your dreams are tied to your device anonymously. When you\u2019re ready, you can claim an account and migrate everything in one tap.',
              },
              {
                q: 'What does \u201Cfree\u201D actually include?',
                a: 'Unlimited dream entries, all three interpretation lenses, the pattern dashboard, symbol constellation, and 5 AI dream generations per day. Plus unlocks unlimited generations, weekly essays, Ask Your Dreams chat, and posting in Circles.',
              },
              {
                q: 'Are my dreams private?',
                a: 'Yes. Dreams are private to your account by default. You decide per-dream whether to share to a private Circle or the public gallery. You can export or delete everything at any time.',
              },
              {
                q: 'How does the AI interpretation work?',
                a: 'We pass your dream text through carefully designed prompts to a state-of-the-art language model, returning three perspectives: symbolic (what objects mean), emotional (what feelings emerged), and Jungian-archetypal (which inner archetype showed up). Personalized using your dream history.',
              },
              {
                q: 'What about lucid dreaming?',
                a: 'Dreamweaver tracks lucidity on every dream and rewards streaks — with reality-check reminders and MILD/WBTB timers on the way.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="surface-glass group rounded-2xl p-6 [&_summary]:cursor-pointer"
              >
                <summary className="flex items-center justify-between gap-4 font-serif text-xl tracking-tight">
                  {item.q}
                  <span className="text-muted-foreground transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
            Tonight, before
            <br />
            <span className="aurora-text">it slips away.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Set the app on your nightstand. Tomorrow morning, the catching
            begins.
          </p>
          <Link
            href="/capture"
            className="aurora-cta mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Start journaling — free forever
          </Link>
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition">
              Pricing
            </Link>
            <span aria-hidden>·</span>
            <Link href="/about" className="hover:text-foreground transition">
              About
            </Link>
            <span aria-hidden>·</span>
            <Link
              href="/leaderboard"
              className="hover:text-foreground transition"
            >
              Gallery
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
