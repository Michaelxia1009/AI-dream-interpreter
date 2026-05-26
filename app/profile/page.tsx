'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Loader2, Lock, Mail, Palette, Sparkles, Trophy, UserRound } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { StreakBadge } from '@/components/StreakBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MoodSpectrum, type MoodSummary } from '@/components/patterns/MoodSpectrum';
import { SymbolCloud, type SymbolHit } from '@/components/patterns/SymbolCloud';
import type { StreakInfo } from '@/lib/dreams/streak';
import { toast } from 'sonner';
import { PageShell, PageHeader, GlassPanel, Button } from '@/components/ui';
import { DreamArchiveCover } from '@/components/DreamArchiveCover';

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
  videoUrl: string | null;
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
    <GlassPanel size="sm">
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{used}/{cap}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-[var(--dw-gradient)]" style={{ width: `${pct}%` }} />
      </div>
    </GlassPanel>
  );
}

export default function ProfilePage() {
  const router = useRouter();
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
      <PageShell>
        <div className="grid flex-1 place-items-center">
          <span className="inline-flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading profile...
          </span>
        </div>
      </PageShell>
    );
  }

  if (!profile) {
    return (
      <PageShell>
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <h1 className="text-h1">Profile unavailable</h1>
            <Button as="link" href="/capture" size="lg" className="mt-5">
              Start journaling
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const used = Math.max(0, profile.usage.limit - profile.usage.remaining);

  return (
    <PageShell width="wide">
      <div className="space-y-14">
        <section>
          <PageHeader eyebrow="Profile" title="My profile" />
          <GlassPanel size="lg" className="mt-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary/80">
                    <UserRound className="h-6 w-6 text-foreground/80" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground/90 sm:text-3xl">
                      {profile.account.displayName || profile.handle}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      Dreamer #{profile.dreamerCode}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-2xl font-semibold">{profile.totalDreams}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Dreams</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-2xl font-semibold">{profile.patternsUnlocked ? 'On' : 'Soon'}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Patterns</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <p className="text-2xl font-semibold">{profile.publicDreams}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Public</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <p className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    First recorded: {formatDate(profile.firstDreamAt)}
                  </p>
                  <p className="block sm:inline-flex sm:items-center sm:gap-2">
                    <Sparkles className="mr-2 inline h-4 w-4" />
                    Latest dream: {formatDate(profile.lastDreamAt)}
                  </p>
                </div>
              </div>

              <div className="min-w-0 lg:w-[380px]">
                <h2 className="mb-3 text-h3">Your streak</h2>
                <StreakBadge streak={profile.streak} variant="full" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {profile.streak.totalDreams} dream{profile.streak.totalDreams === 1 ? '' : 's'} captured in total.
                </p>
              </div>
            </div>
          </GlassPanel>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-h2">Dream archive</h2>
            <Link href="/leaderboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Trophy className="h-4 w-4" />
              Explore dream leaderboard
            </Link>
          </div>

          {profile.dreams.length === 0 ? (
            <GlassPanel size="lg" className="text-center">
              <h3 className="text-h3">No dreams recorded yet</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Dreams appear here after you finish generating their image or video.
              </p>
              <Button as="link" href="/capture" size="lg" className="mt-6">
                Start journaling
              </Button>
            </GlassPanel>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.dreams.map(dream => (
                <GlassPanel key={dream.id} as="article" size="sm" className="overflow-hidden p-0">
                  <DreamArchiveCover thumbnailUrl={dream.thumbnailUrl} videoUrl={dream.videoUrl} />
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
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.push(`/interpret?id=${dream.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition hover:border-ring/50 hover:text-foreground"
                      >
                        <Sparkles className="h-3 w-3" />
                        Interpret
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-h2">Pattern summary</h2>
          <GlassPanel size="lg" className="mt-4 border-ring/40 shadow-[0_0_50px_rgba(125,92,255,0.14)]">
            <h3 className="text-h3">
              {profile.patternsUnlocked ? 'Your dream pattern is active' : 'Patterns unlock after 3 dreams'}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-foreground/90">{profile.patternSummary}</p>
            <Button
              as="link"
              href="/journal#patterns"
              variant={profile.patternsUnlocked ? 'primary' : 'secondary'}
              size="lg"
              className="mt-6"
            >
              Open journal patterns
            </Button>

            {profile.patternsUnlocked && (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <MoodSpectrum mood={profile.patterns.mood} />
                <SymbolCloud symbols={profile.patterns.symbols} />
              </div>
            )}
          </GlassPanel>
        </section>

        <section>
          <h2 className="text-h2">Usage</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <UsageCard label="Dream generations" used={used} cap={profile.usage.limit} />
            <GlassPanel size="sm">
              <div className="text-sm">Remaining today</div>
              <div className="mt-2 font-display text-3xl">{profile.usage.remaining}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Resets around {formatReset(profile.usage.resetAt)}
              </p>
            </GlassPanel>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            During preview, free-plan art and video caps are waived on the server.
            After preview ends, daily generation limits reset automatically.
          </p>
        </section>

        <section>
          <h2 className="text-h2">Appearance</h2>
          <GlassPanel size="md" className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Palette className="mt-1 h-5 w-5 text-[var(--primary-glow)]" />
              <div>
                <div className="text-lg font-medium">Sleep / Awake</div>
                <p className="text-sm italic text-muted-foreground">
                  Dark for dream-time. Light for daylight reflection.
                </p>
              </div>
            </div>
            <ThemeToggle />
          </GlassPanel>
        </section>

        <section>
          <h2 className="text-h2">Save your dreams forever</h2>
          <GlassPanel size="lg" className="mt-4">
            {profile.account.claimed ? (
              <>
                <h3 className="text-h3">Profile claimed</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  This prototype profile is attached to {profile.account.emailMasked}. Full cross-device recovery comes later.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-h3">Claim this dream archive</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  You are journaling anonymously. Add an email to mark this device profile as claimed.
                </p>
                <form onSubmit={claimAccount} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="h-12 rounded-xl border border-border/50 bg-card/50 px-3 text-sm outline-none focus:border-ring/70"
                  />
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-xl border border-border/50 bg-card/50 pl-9 pr-3 text-sm outline-none focus:border-ring/70"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={claiming}
                    className="h-12 rounded-xl"
                  >
                    {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Claim'}
                  </Button>
                </form>
              </>
            )}
          </GlassPanel>
        </section>
      </div>
    </PageShell>
  );
}
