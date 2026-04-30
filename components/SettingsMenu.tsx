'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, X, Moon, Sun, Trophy } from 'lucide-react';
import { useDream } from '@/lib/state';
import { useTheme, type Theme } from '@/lib/theme';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'zh-CN', label: '中文' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
];

const THEMES: { id: Theme; label: string; sub: string; icon: typeof Moon }[] = [
  { id: 'nightshade', label: 'Nightshade', sub: 'Aurora on midnight', icon: Moon },
  { id: 'daylight', label: 'Daylight', sub: 'Cream & ember', icon: Sun },
];

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { reset } = useDream();
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState('en-US');

  // Hide on the public dream-share page so first-time recipients see a clean artifact.
  if (pathname?.startsWith('/d/')) return null;

  function handleLangChange(code: string) {
    setLang(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dream-lang', code);
    }
  }

  function handleReset() {
    reset();
    setOpen(false);
    window.location.href = '/';
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="surface-glass relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Preferences</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {/* Leaderboard quick-link */}
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Discover</label>
                <Link
                  href="/leaderboard"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center gap-3 rounded-xl border border-border px-4 py-3 transition hover:border-ring/60 hover:bg-secondary/50"
                >
                  <Trophy className="h-4 w-4 text-foreground" />
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">Leaderboard</span>
                    <span className="text-[11px] text-muted-foreground">This week\u2019s top dreams</span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                </Link>
              </div>

              {/* Theme */}
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Theme</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {THEMES.map(t => {
                    const Icon = t.icon;
                    const active = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          active
                            ? 'border-ring bg-secondary'
                            : 'border-border hover:border-ring/50 hover:bg-secondary/50'
                        }`}
                        aria-pressed={active}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">{t.label}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{t.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Voice Language</label>
                <select
                  value={lang}
                  onChange={e => handleLangChange(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:border-ring focus:outline-none"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Reset session */}
              <div className="border-t border-border pt-5">
                <button
                  onClick={handleReset}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition hover:border-ring/60 hover:text-foreground"
                >
                  Start Over (New Dream)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
