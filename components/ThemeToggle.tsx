'use client';

import { Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

const MARKETING_ROUTES = ['/', '/about', '/pricing', '/how-it-works', '/features', '/questions'];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const isNight = theme === 'nightshade';

  return (
    <button
      type="button"
      onClick={() => setTheme(isNight ? 'daylight' : 'nightshade')}
      className={`inline-flex items-center rounded-full border border-border/60 bg-card/40 p-1 text-muted-foreground backdrop-blur transition hover:border-ring/70 hover:text-foreground ${
        compact ? 'gap-1' : 'gap-2'
      }`}
      aria-label={isNight ? 'Switch to daylight theme' : 'Switch to night theme'}
      aria-pressed={isNight}
    >
      <span
        className={`grid place-items-center rounded-full transition ${
          isNight
            ? 'bg-accent text-accent-foreground shadow-glow'
            : 'text-muted-foreground'
        } ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      >
        <Moon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
      <span
        className={`grid place-items-center rounded-full transition ${
          !isNight
            ? 'bg-accent text-accent-foreground shadow-glow'
            : 'text-muted-foreground'
        } ${compact ? 'h-8 w-8' : 'h-9 w-9'}`}
      >
        <Sun className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </span>
    </button>
  );
}

export function FloatingThemeToggle() {
  const pathname = usePathname();
  const hidden =
    pathname?.startsWith('/d/') ||
    (pathname !== undefined && MARKETING_ROUTES.includes(pathname));

  if (hidden) return null;

  return <ThemeToggle compact />;
}
