import Link from 'next/link';
import { HeroLoop } from '@/components/HeroLoop';
import { LandingHeader } from '@/components/LandingHeader';

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      <LandingHeader />

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative h-dvh overflow-hidden">
        <HeroLoop />
        {/* Aurora vignette — deepens the edges, lets hero video glow through the middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
        <div className="relative z-10 flex h-dvh flex-col items-center justify-center px-6 pb-24 pt-28 text-center sm:pb-40 sm:pt-36">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur sm:mb-8 sm:text-[12px]">
            ✦ Your subconscious, illustrated
          </div>
          <h1 className="hero-title-aurora mb-6 font-serif text-[clamp(3.35rem,9.2vw,8.75rem)] leading-[0.94] tracking-tight sm:mb-10">
            <span className="block">Catch your dreams</span>
            <span className="block italic">before they fade.</span>
          </h1>
          <p className="max-w-3xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-2xl">
            A nightly companion that captures, illustrates, and decodes your
            dreams — so the patterns of your subconscious become visible over
            time.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:mt-14 sm:flex-row sm:gap-4">
            <Link
              href="/capture"
              className="aurora-cta inline-flex min-w-72 items-center justify-center gap-2 rounded-full px-9 py-4 text-base font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98] sm:py-5 sm:text-lg"
            >
              Start journaling — it&apos;s free
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-w-72 items-center justify-center gap-2 rounded-full border border-border/60 bg-background/30 px-9 py-4 text-base font-semibold text-foreground/85 backdrop-blur transition hover:border-ring/60 hover:text-foreground sm:py-5 sm:text-lg"
            >
              Explore dream leaderboard
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground/80 sm:mt-8">
            No sign-up. No credit card. Just open and dream.
          </p>
        </div>
        <footer className="absolute inset-x-0 bottom-0 z-20 border-t border-border/30 bg-background/20 px-4 py-3 backdrop-blur sm:px-6 sm:py-6">
          <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-xs font-medium text-foreground/80 sm:gap-3 sm:text-base">
            {[
              { href: '/pricing', label: 'Pricing' },
              { href: '/about', label: 'About' },
              { href: '/how-it-works', label: 'How it works' },
              { href: '/features', label: 'Features' },
              { href: '/questions', label: 'Questions' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-border/60 bg-background/35 px-3 py-1.5 backdrop-blur transition hover:border-ring/60 hover:text-foreground sm:px-4 sm:py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-b from-transparent to-background" />
      </section>
    </main>
  );
}
