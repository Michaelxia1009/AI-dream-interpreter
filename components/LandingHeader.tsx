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
          <span className="wordmark-font hidden text-3xl font-medium text-foreground sm:inline sm:text-[2.1rem] xl:text-[2.35rem]">
            Dreamweaver
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-5 md:flex lg:gap-7 xl:gap-10" aria-label="Primary">
          {LINKS.map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group inline-flex min-w-0 items-center gap-2.5 whitespace-nowrap font-sans text-sm font-medium text-foreground/70 transition hover:text-foreground lg:text-base xl:text-lg"
              >
                <Icon className="h-4 w-4 shrink-0 text-[var(--primary-glow)] opacity-75 transition group-hover:opacity-100 xl:h-[18px] xl:w-[18px]" />
                <span className="hidden lg:inline relative after:absolute after:bottom-[-3px] after:left-0 after:h-px after:w-0 after:bg-[var(--primary-glow)] after:opacity-60 after:transition-all after:duration-300 group-hover:after:w-full">{link.label}</span>
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
            className="aurora-cta inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 font-display text-sm font-normal shadow-glow transition hover:scale-[1.02] active:scale-[0.98] sm:px-5 sm:py-3 lg:px-6 lg:text-base"
          >
            <Plus className="mr-1 h-4 w-4 shrink-0" />
            <span>New dream</span>
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
                      className="flex items-center gap-3 px-5 py-4 font-sans text-base font-medium text-foreground/90 transition hover:bg-secondary/40"
                    >
                      <Icon className="h-4 w-4 text-[var(--primary-glow)]" />
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
