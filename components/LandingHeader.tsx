'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Moon, X } from 'lucide-react';

const LINKS = [
  { href: '/journal', label: 'Journal' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/circles', label: 'Circles' },
  { href: '/profile', label: 'Profile' },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mql.matches) setOpen(false);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-foreground transition hover:text-foreground"
          aria-label="Dreamweaver home"
        >
          <Moon className="h-6 w-6 -rotate-12 text-[var(--primary-glow)]" />
          <span className="font-display text-2xl font-light tracking-tight text-foreground sm:text-[1.7rem]">
            Dreamweaver
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-semibold text-foreground/80 transition hover:text-foreground lg:text-lg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/capture"
            className="aurora-cta inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold tracking-wide shadow-glow transition hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
          >
            Start journaling
          </Link>

          <button
            type="button"
            onClick={() => setOpen(value => !value)}
            className="rounded-full border border-border/50 bg-card/40 p-2 text-muted-foreground backdrop-blur transition hover:text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="absolute inset-x-0 top-full mx-3 mt-2 overflow-hidden rounded-2xl border border-border/40 bg-background/90 backdrop-blur-xl">
            <ul className="divide-y divide-border/40">
              {LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-5 py-4 text-base font-medium text-foreground/90 transition hover:bg-secondary/40"
                  >
                    {link.label}
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
