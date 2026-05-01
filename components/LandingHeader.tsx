'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenText, Menu, Moon, Plus, Trophy, UserRound, UsersRound, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const LINKS = [
  { href: '/journal', label: 'Journal', icon: BookOpenText },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/circles', label: 'Circles', icon: UsersRound },
  { href: '/profile', label: 'Profile', icon: UserRound },
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
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2 text-foreground transition hover:text-foreground"
          aria-label="Dreamweaver home"
        >
          <Moon className="h-6 w-6 -rotate-12 text-[var(--primary-glow)]" />
          <span className="hidden font-display text-2xl font-light tracking-tight text-foreground sm:inline sm:text-[1.7rem] xl:text-3xl">
            Dreamweaver
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 md:flex lg:gap-5 xl:gap-8" aria-label="Primary">
          {LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-w-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-foreground/80 transition hover:text-foreground lg:text-base xl:text-lg"
              >
                <Icon className="h-4 w-4 shrink-0 text-foreground/60 xl:h-5 xl:w-5" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle compact />
          </div>
          <Link
            href="/capture"
            className="aurora-cta inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold tracking-wide shadow-glow transition hover:scale-[1.02] active:scale-[0.98] sm:px-5 sm:py-3 lg:px-6 lg:text-base"
          >
            <Plus className="mr-1 h-4 w-4 shrink-0" />
            <span className="hidden xl:inline">Start journaling</span>
            <span className="xl:hidden">New dream</span>
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
              {LINKS.map(link => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-5 py-4 text-base font-medium text-foreground/90 transition hover:bg-secondary/40"
                    >
                      <Icon className="h-4 w-4 text-foreground/60" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
