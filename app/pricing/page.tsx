import type { Metadata } from 'next';
import Link from 'next/link';
import { WaitlistForm } from '@/components/WaitlistForm';
import { LandingHeader } from '@/components/LandingHeader';

export const metadata: Metadata = {
  title: 'Pricing · Dreamweaver',
  description:
    'Start free forever. Upgrade when you want unlimited dream art and deeper patterns.',
};

const FREE_BULLETS = [
  'Unlimited dream journaling',
  'All three interpretation lenses',
  '5 AI dream generations per day',
  'One weekly insight letter per week',
  'Public gallery & weekly leaderboard',
];

const PLUS_BULLETS = [
  'Everything in Free',
  'Unlimited AI dream art & videos',
  'Unlimited weekly insight refreshes',
  'Dream-pattern timelines',
  'Priority generation',
  'Early access to new lenses',
];

export default function PricingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      <LandingHeader />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background/90" />

      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-16 sm:pt-36">
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            ✦ Pricing
          </div>
          <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
            Choose your <span className="aurora-text">sky.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Start free forever. Upgrade when you want unlimited dream art and
            deeper patterns.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* ─── FREE TIER ─────────────────────────────────────────── */}
          <div className="surface-glass relative flex flex-col rounded-3xl p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              For occasional dreamers
            </p>
            <h2 className="mt-1 font-serif text-3xl tracking-tight">Free</h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-5xl tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>

            <ul className="mt-8 flex-1 space-y-3 text-sm">
              {FREE_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check />
                  <span className="leading-relaxed text-foreground/90">{b}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/capture"
              className="mt-10 inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-background/30 px-6 py-3 text-base font-semibold backdrop-blur transition hover:text-foreground hover:border-ring/60"
            >
              Start journaling →
            </Link>
          </div>

          {/* ─── PLUS TIER ─────────────────────────────────────────── */}
          <div className="surface-glass relative flex flex-col rounded-3xl p-8 ring-1 ring-ring/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="aurora-cta inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                ✦ Most loved
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              For devoted dream-keepers
            </p>
            <h2 className="mt-1 font-serif text-3xl tracking-tight">
              <span className="aurora-text">Plus</span>
            </h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-5xl tracking-tight">$9.99</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>

            <ul className="mt-8 flex-1 space-y-3 text-sm">
              {PLUS_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <Check />
                  <span className="leading-relaxed text-foreground/90">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <WaitlistForm />
              <p className="mt-3 text-center text-xs text-muted-foreground/80">
                We&apos;ll email waitlist signups when paid checkout goes live.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Free quotas reset daily. Cancel anytime — your dreams stay yours.
        </p>
      </section>
    </main>
  );
}

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5l4 4 8-8" />
    </svg>
  );
}
