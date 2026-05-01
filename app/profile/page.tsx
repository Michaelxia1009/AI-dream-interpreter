'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Loader2, Lock, Sparkles, Trophy, UserRound } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { MoodSpectrum, type MoodSummary } from '@/components/patterns/MoodSpectrum';
import { SymbolCloud, type SymbolHit } from '@/components/patterns/SymbolCloud';
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
  metrics: {
    weirdness: Metric;
    imagination: Metric;
    emotionalIntensity: Metric;
    vividness: Metric;
  };
  symbols: string[];
  isPublic: boolean;
}

interface ProfilePayload {
  handle: string;
  dreamerCode: string;
  totalDreams: number;
  firstDreamAt: number | null;
  lastDreamAt: number | null;
  patternsUnlocked: boolean;
  patternSummary: string;
  patterns: {
    mood: MoodSummary;
    symbols: SymbolHit[];
    totalDreams: number;
  };
  dreams: ProfileDream[];
}

function formatDate(ms: number | null): string {
  if (!ms) return 'Not yet';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ms));
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        const res = await fetch(`/api/profile?fingerprint=${encodeURIComponent(fp)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('profile failed');
        const data = await res.json() as { profile: ProfilePayload };
        if (!cancelled) setProfile(data.profile);
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

  return (
    <main className="aurora-bg min-h-dvh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="surface-glass rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
                <h1 className="mt-2 font-serif text-5xl leading-tight tracking-tight">{profile.handle}</h1>
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
                <p className="text-2xl font-semibold">{profile.dreams.filter(d => d.isPublic).length}</p>
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
              href="/patterns"
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${
                profile.patternsUnlocked
                  ? 'aurora-cta'
                  : 'border border-border text-muted-foreground'
              }`}
            >
              Open patterns <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        </header>

        {profile.patternsUnlocked && (
          <div className="mb-6 grid gap-5 lg:grid-cols-2">
            <MoodSpectrum mood={profile.patterns.mood} />
            <SymbolCloud symbols={profile.patterns.symbols} />
          </div>
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
                    // Generated Vercel Blob URLs are already final image artifacts.
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
                      {dream.symbols.slice(0, 4).map(s => (
                        <span key={s} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                          {s}
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
