import Link from 'next/link';
import { HeroLoop } from '@/components/HeroLoop';

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden aurora-bg">
      <HeroLoop />
      {/* Aurora vignette — deepens the edges, lets hero video glow through the middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/90" />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-end px-6 pb-16 pt-32 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          ✦ Dreamweaver
        </div>
        <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
          Turn your dream into
          <br />
          <span className="aurora-text">a cinematic short.</span>
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          Describe what you dreamed. We&apos;ll bring it to life in cinematic 10 seconds — or a carousel you can swipe through.
        </p>
        <Link
          href="/capture"
          className="aurora-cta mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Tell us your dream &rarr;
        </Link>
        <p className="mt-8 text-xs text-muted-foreground/80">
          No account needed. 3 dreams a day on the house.
        </p>
      </div>
    </main>
  );
}
