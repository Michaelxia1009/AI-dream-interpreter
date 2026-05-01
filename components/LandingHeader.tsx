'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Moon, X } from 'lucide-react';

/**
 * Sticky top-bar shown on marketing pages (landing, /pricing, /about).
 *
 * Layout follows the brand reference:
 *   • crescent-moon mark + wordmark on the left
 *   • centered nav: Journal · Leaderboard · Circles · Profile
 *   • aurora-CTA pill on the right
 *
 * On narrow screens the centered nav collapses into a dropdown opened by a
 * hamburger; the right-hand "Start journaling" CTA stays visible at all sizes
 * so the primary action is never more than one tap away.
 *
 * Uses backdrop-blur so the aurora hero shimmers through the bar without the
 * type losing contrast.
 */

const LINKS = [
  { href: '/journal',     label: 'Journal' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/circles',     label: 'Circles' },
  { href: '/profile',     label: 'Profile' },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  // Close mobile drawer when the viewport widens past lg.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mql.matches) setOpen(false);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-full px-1 py-1 text-foreground transition"
          aria-label="Dreamweaver — home"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border border-ring/30 bg-secondary/70 text-ring shadow-[0_0_28px_rgba(167,139,250,0.28)] backdrop-blur transition group-hover:text-foreground">
            <Moon className="h-6 w-6 -rotate-12" />
          </span>
          <span className="font-serif text-2xl tracking-tight text-foreground">Dreamweaver</span>
        </Link>

        {/* Center nav (desktop) */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-base font-semibold text-foreground/80 transition hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <Link
            href="/capture"
            className="aurora-cta inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
          >
            Start journaling
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="rounded-full border border-border/50 bg-background/30 p-2 text-muted-foreground backdrop-blur transition hover:text-foreground lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="absolute inset-x-0 top-full mx-3 mt-1 overflow-hidden rounded-2xl border border-border/40 bg-background/85 backdrop-blur-xl"
          >
            <ul className="divide-y divide-border/40">
              {LINKS.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-4 text-base text-foreground/90 transition hover:bg-secondary/40"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
