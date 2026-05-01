'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Loader2, Lock, Sparkles, SunMoon, Trophy, UserRound } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { useTheme } from '@/lib/theme';
import { StreakBadge } from '@/components/StreakBadge';
import { MoodSpectrum, type MoodSummary } from '@/components/patterns/MoodSpectrum';
import { SymbolCloud, type SymbolHit } from '@/components/patterns/SymbolCloud';
import type { StreakInfo } from '@/lib/dreams/streak';
import { toast } from 'sonner';

interface Metric {
  score: number;
  oneLiner: string;
}

interface ProfileDream {
  id: string;
  createdAt: number;
  blurb: string;
  format: 'video' | 'carousel';
  styleName: string;
  thumbnailUrl: string | null;
  dreamType: 'normal' | 'nightmare' | 'recurring' | 'prophetic';
  metrics: {
    weirdness: Metric;
    imagination: Metric;
    emotionalIntensity: Metric;
    vividness: Metric;
  };
  symbols: string[];
  isPublic: boolean;
}

interface AccountState {
  claimed: boolean;
  emailMasked: string | null;
  displayName: string | null;
  claimedAt: number | null;
}

interface UsageState {
  limit: number;
  remaining: number;
  resetAt: number;
}

interface ProfilePayload {
  handle: string;
  dreamerCode: string;
  totalDreams: number;
  publicDreams: number;
  firstDreamAt: number | null;
  lastDreamAt: number | null;
  patternsUnlocked: boolean;
  patternSummary: string;
  patterns: {
    mood: MoodSummary;
    symbols: SymbolHit[];
    totalDreams: number;
  };
  account: AccountState;
  streak: StreakInfo;
  usage: UsageState;
  dreams: ProfileDream[];
}

function formatDate(ms: number | null): string {
  if (!ms) return 'Not yet';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ms));
}

function formatReset(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
}

function UsageCard({ label, used, cap }: { label: string; used: number; cap: number }) {
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  return (
    <div className="surface-glass rounded-2xl p-4">
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{used}/{cap}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-[var(--dw-gradient)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        if (cancelled) return;
        setFingerprint(fp);
        const res = await fetch(`/api/profile?fingerprint=${encodeURIComponent(fp)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('profile failed');
        const data = await res.json() as { profile: ProfilePayload };
        if (!cancelled) {
          setProfile(data.profile);
          setDisplayName(data.profile.account.displayName ?? data.profile.handle);
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load your profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function claimAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fingerprint) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/profile/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, email, displayName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error === 'invalid_email' ? 'Enter a valid email.' : 'Could not claim this profile.');
      }
      const data = await res.json() as { account: AccountState };
      setProfile(prev => prev ? { ...prev, account: data.account } : prev);
      setEmail('');
      toast.success('Profile claimed for this device.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not claim this profile.');
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <main className="aurora-bg grid min-h-dvh place-items-center px-6">
        <span className="inline-flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </span>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="aurora-bg grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <h1 className="font-serif text-4xl">Profile unavailable</h1>
          <Link href="/capture" className="aurora-cta mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
            Start journaling
          </Link>
        </div>
      </main>
    );
  }

  const used = Math.max(0, profile.usage.limit - profile.usage.remaining);

  return (
    <main className="aurora-bg min-h-dvh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="surface-glass rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your profile</p>
                <h1 className="mt-2 font-serif text-5xl leading-tight tracking-tight">
                  {profile.account.displayName || profile.handle}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Platform badge: Dreamer #{profile.dreamerCode}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary/80">
                <UserRound className="h-6 w-6 text-foreground/80" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-2xl font-semibold">{profile.totalDreams}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Dreams</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-2xl font-semibold">{profile.patternsUnlocked ? 'On' : 'Soon'}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Patterns</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-2xl font-semibold">{profile.publicDreams}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Public</p>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                First recorded: {formatDate(profile.firstDreamAt)}
              </p>
              <p className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Latest dream: {formatDate(profile.lastDreamAt)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-ring/40 bg-card/50 p-6 shadow-[0_0_50px_rgba(125,92,255,0.14)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pattern summary</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight">
              {profile.patternsUnlocked ? 'Your dream pattern is active' : 'Patterns unlock after 3 dreams'}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/90">{profile.patternSummary}</p>
            <Link
              href="/journal#patterns"
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${
                profile.patternsUnlocked
                  ? 'aurora-cta'
                  : 'border border-border text-muted-foreground'
              }`}
            >
              Open journal patterns
            </Link>
          </section>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div>
              <h2 className="mb-3 font-serif text-2xl tracking-tight">Your streak</h2>
              <StreakBadge streak={profile.streak} variant="full" />
              <p className="mt-3 text-xs text-muted-foreground">
                {profile.streak.totalDreams} dream{profile.streak.totalDreams === 1 ? '' : 's'} captured in total.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl tracking-tight">Appearance</h2>
              <div className="surface-glass flex items-center justify-between gap-4 rounded-2xl p-4">
                <div>
                  <div className="text-sm font-medium">Sleep / Awake</div>
                  <p className="text-xs italic text-muted-foreground">
                    Dark for dream-time. Light for daylight reflection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'nightshade' ? 'daylight' : 'nightshade')}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <SunMoon className="h-4 w-4" />
                  {theme === 'nightshade' ? 'Sleep' : 'Awake'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <section className="space-y-3">
              <h2 className="font-serif text-2xl tracking-tight">Usage</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <UsageCard label="Dream generations" used={used} cap={profile.usage.limit} />
                <div className="surface-glass rounded-2xl p-4">
                  <div className="text-sm">Remaining today</div>
                  <div className="mt-2 font-serif text-3xl">{profile.usage.remaining}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resets around {formatReset(profile.usage.resetAt)}
                  </p>
                </div>
              </div>
            </section>

            <section className="surface-glass rounded-2xl p-5">
              {profile.account.claimed ? (
                <>
                  <h2 className="font-serif text-2xl tracking-tight">Profile claimed</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This prototype profile is attached to {profile.account.emailMasked}. Full cross-device recovery comes later.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-2xl tracking-tight">Save your dreams forever</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You are journaling anonymously. Add an email to mark this device profile as claimed.
                  </p>
                  <form onSubmit={claimAccount} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Display name"
                      className="h-11 rounded-xl border border-border/50 bg-card/50 px-3 text-sm outline-none focus:border-ring/70"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 rounded-xl border border-border/50 bg-card/50 px-3 text-sm outline-none focus:border-ring/70"
                    />
                    <button
                      type="submit"
                      disabled={claiming}
                      className="aurora-cta inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
                    >
                      {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim'}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </section>

        {profile.patternsUnlocked && (
          <section className="grid gap-5 lg:grid-cols-2">
            <MoodSpectrum mood={profile.patterns.mood} />
            <SymbolCloud symbols={profile.patterns.symbols} />
          </section>
        )}

        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dream archive</p>
              <h2 className="font-serif text-3xl tracking-tight">All dreams recorded here</h2>
            </div>
            <Link href="/leaderboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Trophy className="h-4 w-4" />
              Explore dream leaderboard
            </Link>
          </div>

          {profile.dreams.length === 0 ? (
            <div className="surface-glass rounded-2xl p-8 text-center">
              <h3 className="font-serif text-3xl">No dreams recorded yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Once you generate a dream, it will appear here with its symbols, score, and privacy state.
              </p>
              <Link href="/capture" className="aurora-cta mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                Start journaling
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.dreams.map(dream => (
                <article key={dream.id} className="surface-glass overflow-hidden rounded-2xl">
                  {dream.thumbnailUrl ? (
                    // Generated Blob URLs are final display assets.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dream.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="grid h-40 place-items-center bg-secondary/70 text-sm text-muted-foreground">
                      Video dream
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDate(dream.createdAt)} · {dream.format}
                      </p>
                      {!dream.isPublic && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{dream.blurb}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {dream.symbols.slice(0, 4).map(symbol => (
                        <span key={symbol} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                          {symbol}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <span>Weird {dream.metrics.weirdness.score}/10</span>
                      <span>Vivid {dream.metrics.vividness.score}/10</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
