import Link from 'next/link';
import { Moon, Sparkles } from 'lucide-react';
import { LandingHeader } from '@/components/LandingHeader';

const productLinks = [
  { href: '/journal', label: 'Journal' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/pricing', label: 'Pricing' },
];

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/features', label: 'Features' },
  { href: '/questions', label: 'Questions' },
];

export default function LandingPage() {
  return (
    <main className="dreamtok-landing min-h-dvh overflow-x-hidden bg-background text-foreground">
      <LandingHeader />

      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-dream.jpg"
            alt=""
            className="dreamtok-hero-image h-full w-full object-cover opacity-60"
            width={1920}
            height={1280}
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary-glow)]" />
            <span className="font-sans text-xs font-semibold uppercase text-muted-foreground">
              Your subconscious, illustrated
            </span>
          </div>

          <h1 className="mb-8 pb-3 font-display text-5xl font-light leading-[1.08] md:text-7xl lg:text-8xl">
            Catch your dreams
            <br />
            <span className="font-serif-italic text-gradient-aurora italic">
              before they fade.
            </span>
          </h1>

          <p className="font-serif-italic mx-auto mb-12 max-w-2xl text-xl italic leading-[1.5] text-muted-foreground md:text-2xl">
            A nightly companion that captures, illustrates, and decodes your
            dreams — so the patterns of your subconscious become visible over
            time.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/capture"
              className="bg-gradient-aurora inline-flex h-14 min-w-72 items-center justify-center rounded-full px-8 font-sans text-lg font-semibold text-primary-foreground shadow-glow-lg transition hover:scale-[1.02] hover:shadow-glow active:scale-[0.98]"
            >
              Start journaling — it&apos;s free
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex h-14 min-w-72 items-center justify-center rounded-full border border-border/60 bg-card/30 px-8 font-sans text-lg font-semibold text-foreground/85 backdrop-blur transition hover:border-ring/60 hover:bg-card/45 hover:text-foreground"
            >
              Explore the gallery
            </Link>
          </div>

          <p className="mx-auto mb-20 mt-9 max-w-xl font-sans text-sm font-medium leading-relaxed text-muted-foreground/85 md:text-base">
            No sign-up. No credit card. Just open and dream.
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-b from-transparent to-background" />
      </section>

      <footer className="relative border-t border-border/40 py-16">
        <div className="container mx-auto px-6">
          <div className="mb-12 grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <Moon className="h-5 w-5 -rotate-12 text-[var(--primary-glow)]" />
                <span className="font-display text-lg font-light">Dreamweaver</span>
              </Link>
              <p className="font-serif-italic max-w-sm text-base italic leading-relaxed text-muted-foreground">
                A dreamy AI journal that captures, illustrates, and decodes your
                dreams.
              </p>
            </div>

            <div>
              <h2 className="mb-4 font-sans text-xs font-semibold uppercase text-foreground">
                Product
              </h2>
              <ul className="space-y-2 font-sans text-sm text-muted-foreground">
                {productLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-4 font-sans text-xs font-semibold uppercase text-foreground">
                Company
              </h2>
              <ul className="space-y-2 font-sans text-sm text-muted-foreground">
                {companyLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-border/30 pt-8 font-sans text-sm text-muted-foreground sm:flex-row">
            <p>© 2026 Dreamweaver. All dreams reserved.</p>
            <p className="text-muted-foreground/70">Catch them before they fade.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
