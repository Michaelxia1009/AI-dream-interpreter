import Link from 'next/link';
import { Moon, Sparkles } from 'lucide-react';
import { LandingHeader } from '@/components/LandingHeader';
import { Button } from '@/components/ui';

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

      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
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
          <div className="dreamtok-hero-fade absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-12 pt-24 text-center md:pb-14">
          <div className="hero-badge mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-card/35 px-5 py-2.5 backdrop-blur-md transition-all">
            <Sparkles className="h-4 w-4 text-[var(--primary-glow)]" />
            <span className="font-serif text-sm text-white/90 md:text-base">
              Your subconscious, illustrated
            </span>
          </div>

          <h1 className="mb-8 pb-3 font-display text-5xl font-normal leading-[1.08] md:text-7xl lg:text-8xl">
            Catch your dreams
            <br />
            <span className="font-serif-italic italic text-gradient-aurora">
              before they fade
            </span>
          </h1>

          <p className="font-serif-italic mx-auto mb-12 max-w-2xl text-xl italic leading-[1.5] text-muted-foreground md:text-2xl">
            A nightly companion that captures, illustrates, and decodes your
            dreams — so the patterns of your subconscious become visible over
            time.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              as="link"
              href="/capture"
              variant="primary"
              size="lg"
              className="hero-primary-cta h-14 min-w-72 text-lg"
            >
              Start journaling — it&apos;s free
            </Button>
            <Button
              as="link"
              href="/leaderboard"
              variant="secondary"
              size="lg"
              className="h-14 min-w-72 text-lg font-light"
            >
              Explore the gallery
            </Button>
          </div>

          <p className="mx-auto mt-6 max-w-xl font-serif-italic text-sm italic leading-relaxed text-white/90 md:text-base">
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
                <span className="wordmark-font text-2xl font-medium">Dreamweaver</span>
              </Link>
              <p className="font-serif max-w-sm text-base leading-relaxed text-muted-foreground">
                A dreamy AI journal that captures, illustrates, and decodes your
                dreams.
              </p>
            </div>

            <div>
              <h2 className="mb-4 font-display text-xs font-medium uppercase text-foreground/80">
                Product
              </h2>
              <ul className="space-y-2.5 font-sans text-sm text-muted-foreground">
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
              <h2 className="mb-4 font-display text-xs font-medium uppercase text-foreground/80">
                Company
              </h2>
              <ul className="space-y-2.5 font-sans text-sm text-muted-foreground">
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

          <div className="flex flex-col items-start justify-between gap-4 border-t border-border/30 pt-8 text-sm text-muted-foreground sm:flex-row">
            <p className="font-sans">© 2026 Dreamweaver. All dreams reserved.</p>
            <p className="font-serif-italic italic text-muted-foreground/60">Catch them before they fade.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
