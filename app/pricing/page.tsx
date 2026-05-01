import type { Metadata } from 'next';
import { WaitlistForm } from '@/components/WaitlistForm';
import { PageShell, PageHeader, GlassPanel, Button, Eyebrow } from '@/components/ui';

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
    <PageShell chrome="landing">
      <section className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Pricing"
          title={
            <>
              Choose your <span className="aurora-text">sky.</span>
            </>
          }
          subtitle="Start free forever. Upgrade when you want unlimited dream art and deeper patterns."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* ─── FREE TIER ─────────────────────────────────────────── */}
          <GlassPanel size="lg" radius="3xl" className="relative flex flex-col">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              For occasional dreamers
            </p>
            <h2 className="mt-1 font-display text-3xl tracking-tight">Free</h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-5xl tracking-tight">$0</span>
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

            <Button variant="secondary" size="lg" as="link" href="/capture" className="mt-10 w-full justify-center">
              Start journaling →
            </Button>
          </GlassPanel>

          {/* ─── PLUS TIER ─────────────────────────────────────────── */}
          <GlassPanel size="lg" radius="3xl" className="relative flex flex-col ring-1 ring-ring/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Eyebrow>Most loved</Eyebrow>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              For devoted dream-keepers
            </p>
            <h2 className="mt-1 font-display text-3xl tracking-tight">
              <span className="aurora-text">Plus</span>
            </h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-5xl tracking-tight">$9.99</span>
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
          </GlassPanel>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Free quotas reset daily. Cancel anytime — your dreams stay yours.
        </p>
      </section>
    </PageShell>
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
