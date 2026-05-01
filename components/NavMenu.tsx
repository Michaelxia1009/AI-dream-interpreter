'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sparkles,
  Trophy,
  Tag,
  BookOpen,
  Wand2,
  Home,
  ChartBar,
  UsersRound,
  UserRound,
} from 'lucide-react';

type Item = {
  href: string;
  label: string;
  blurb: string;
  icon: typeof Sparkles;
};

/**
 * Floating navigation pill in the top-right of every page.
 *
 * Sits next to <SettingsMenu />. Two pill buttons rather than one combined
 * mega-menu so each surfaces a single, focused affordance.
 *
 * Hidden on /d/* (public share pages should be chrome-free for first-time
 * recipients) — same rule SettingsMenu uses.
 */

const ITEMS: Item[] = [
  { href: '/',            label: 'Home',         blurb: 'Landing & overview',           icon: Home },
  { href: '/capture',     label: 'Capture',      blurb: 'Start a new dream',            icon: Wand2 },
  { href: '/profile',     label: 'Profile',      blurb: 'Your dream archive',           icon: UserRound },
  { href: '/interpret',   label: 'Interpret',    blurb: 'Read your dream closely',      icon: Sparkles },
  { href: '/patterns',    label: 'Patterns',     blurb: 'Mood and symbol analytics',    icon: ChartBar },
  { href: '/circles',     label: 'Circles',      blurb: 'Private dream groups',         icon: UsersRound },
  { href: '/leaderboard', label: 'Gallery',      blurb: 'This week\u2019s top dreams', icon: Trophy },
  { href: '/pricing',     label: 'Pricing',      blurb: 'Free forever or Plus',         icon: Tag },
  { href: '/about',       label: 'About',        blurb: 'What Dreamweaver is',          icon: BookOpen },
];

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Hide on public share pages (clean handoff for first-time recipients) and
  // on the marketing pages where <LandingHeader /> already renders a top-bar
  // nav — two nav surfaces would compete.
  const MARKETING_ROUTES = ['/', '/about', '/pricing'];
  const hidden =
    pathname?.startsWith('/d/') ||
    (pathname !== undefined && MARKETING_ROUTES.includes(pathname));

  // Click-outside + Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (hidden) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="Navigation"
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          role="menu"
          className="surface-glass absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl shadow-2xl"
        >
          <ul>
            {ITEMS.map(({ href, label, blurb, icon: Icon }) => {
              const active =
                href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className={`flex items-center gap-3 border-b border-border/40 px-4 py-3 transition last:border-b-0 ${
                      active
                        ? 'bg-secondary/60 text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-[11px] leading-snug opacity-80">
                        {blurb}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
