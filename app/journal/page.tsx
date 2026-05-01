'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Loader2, Lock, Plus, Search, Sparkles } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { StreakBadge } from '@/components/StreakBadge';
import { MoodSpectrum, type MoodSummary } from '@/components/patterns/MoodSpectrum';
import { SymbolCloud, type SymbolHit } from '@/components/patterns/SymbolCloud';
import { WeeklyLetter, type WeeklyLetterPayload } from '@/components/patterns/WeeklyLetter';
import type { StreakInfo } from '@/lib/dreams/streak';
import { toast } from 'sonner';

type DreamType = 'normal' | 'nightmare' | 'recurring' | 'prophetic';

interface ProfileDream {
  id: string;
  createdAt: number;
  blurb: string;
  format: 'video' | 'carousel';
  styleName: string;
  thumbnailUrl: string | null;
  dreamType: DreamType;
  symbols: string[];
  isPublic: boolean;
}

interface ProfilePayload {
  totalDreams: number;
  patternsUnlocked: boolean;
  streak: StreakInfo;
  dreams: ProfileDream[];
}

interface DayBin {
  date: string;
  count: number;
  avgWeirdness: number;
}

interface RecentCard {
  id: string;
  createdAt: number;
  blurb: string;
  styleName: string;
  format: 'video' | 'carousel';
  thumbnailUrl: string | null;
  dreamType: DreamType;
  symbols: string[];
  weirdness: number;
}

interface PatternsPayload {
  ok: boolean;
  isoWeekRange: string;
  windowDays: number;
  mood: MoodSummary;
  symbols: SymbolHit[];
  timeline: DayBin[];
  recent: RecentCard[];
  totalDreams: number;
}

const FILTERS: Array<'all' | DreamType> = ['all', 'normal', 'nightmare', 'recurring', 'prophetic'];
const TYPE_LABEL: Record<DreamType, string> = {
  normal: 'Normal',
  nightmare: 'Nightmare',
  recurring: 'Recurring',
  prophetic: 'Prophetic',
};

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ms));
}

function barHeight(day: DayBin): string {
  if (day.count === 0) return '10%';
  return `${Math.min(100, 28 + day.count * 18)}%`;
}

function DreamCard({ dream }: { dream: ProfileDream }) {
  const content = (
    <article className="surface-glass group h-full overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-0.5 hover:border-ring/50">
      {dream.thumbnailUrl ? (
        // Generated Blob URLs are final display assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dream.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="grid h-40 place-items-center bg-secondary/60 text-sm text-muted-foreground">
          Video dream
        </div>
      )}
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {formatDate(dream.createdAt)}
            </p>
            <p className="mt-1 text-xs capitalize text-ring">{TYPE_LABEL[dream.dreamType]}</p>
          </div>
          {!dream.isPublic && <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </div>
        <p className="font-serif text-lg italic leading-snug text-foreground/90">
          {dream.blurb}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {dream.symbols.slice(0, 4).map(symbol => (
            <span key={symbol} className="rounded-full bg-secondary/70 px-2 py-1 text-[11px] text-muted-foreground">
              {symbol}
            </span>
          ))}
        </div>
        <div className="mt-4 border-t border-border/30 pt-3 text-xs text-muted-foreground">
          {dream.styleName} · {dream.format}
        </div>
      </div>
    </article>
  );

  return dream.isPublic ? (
    <Link href={`/d/${dream.id}`} className="block h-full">
      {content}
    </Link>
  ) : content;
}

export default function JournalPage() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [patterns, setPatterns] = useState<PatternsPayload | null>(null);
  const [letter, setLetter] = useState<WeeklyLetterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [letterLoading, setLetterLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | DreamType>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        if (cancelled) return;
        setFingerprint(fp);

        const [profileRes, patternsRes, letterRes] = await Promise.all([
          fetch(`/api/profile?fingerprint=${encodeURIComponent(fp)}`, { cache: 'no-store' }),
          fetch(`/api/patterns?fingerprint=${encodeURIComponent(fp)}&days=30`, { cache: 'no-store' }),
          fetch(`/api/patterns/letter?fingerprint=${encodeURIComponent(fp)}&days=30`, { cache: 'no-store' }),
        ]);

        if (!profileRes.ok) throw new Error('profile failed');
        const profilePayload = await profileRes.json() as { profile: ProfilePayload };
        if (!cancelled) setProfile(profilePayload.profile);

        if (patternsRes.ok) {
          const patternsPayload = await patternsRes.json() as PatternsPayload;
          if (!cancelled) setPatterns(patternsPayload);
        }
        if (letterRes.ok) {
          const letterPayload = await letterRes.json() as { letter: WeeklyLetterPayload };
          if (!cancelled) setLetter(letterPayload.letter);
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load your journal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshLetter() {
    if (!fingerprint) return;
    setLetterLoading(true);
    try {
      const res = await fetch(`/api/patterns/letter?fingerprint=${encodeURIComponent(fingerprint)}&days=30&force=1`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('letter failed');
      const payload = await res.json() as { letter: WeeklyLetterPayload };
      setLetter(payload.letter);
    } catch (err) {
      console.error(err);
      toast.error('The letter would not refresh. Try again in a moment.');
    } finally {
      setLetterLoading(false);
    }
  }

  const dreams = useMemo(() => profile?.dreams ?? [], [profile?.dreams]);
  const filteredDreams = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dreams.filter(dream => {
      if (filter !== 'all' && dream.dreamType !== filter) return false;
      if (!q) return true;
      return [
        dream.blurb,
        dream.styleName,
        dream.format,
        dream.dreamType,
        dream.symbols.join(' '),
      ].join(' ').toLowerCase().includes(q);
    });
  }, [dreams, filter, query]);

  if (loading) {
    return (
      <main className="aurora-bg grid min-h-dvh place-items-center px-6">
        <span className="inline-flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening your journal...
        </span>
      </main>
    );
  }

  return (
    <main className="aurora-bg min-h-dvh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Your journal</h1>
            <p className="mt-2 text-lg italic text-muted-foreground">
              {dreams.length} dream{dreams.length === 1 ? '' : 's'} remembered
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.streak && <StreakBadge streak={profile.streak} />}
            <Link
              href="/capture"
              className="aurora-cta inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              New dream
            </Link>
          </div>
        </header>

        <section className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search your dreams..."
              className="h-11 w-full rounded-full border border-border/40 bg-card/40 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring/70"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs capitalize transition ${
                  filter === item
                    ? 'border-ring/60 bg-ring/20 text-foreground'
                    : 'border-border/40 bg-card/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {filteredDreams.length === 0 ? (
          <section className="py-20 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary/60">
              <Sparkles className="h-6 w-6 text-ring" />
            </div>
            <h2 className="font-serif text-3xl">
              {dreams.length ? 'No dreams match' : 'Your journal is waiting'}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              {dreams.length
                ? 'Try clearing search or filters to see everything.'
                : 'Even a single image is enough. Capture what you remember before it dissolves.'}
            </p>
            {!dreams.length && (
              <Link href="/capture" className="aurora-cta mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
                Capture your first dream
              </Link>
            )}
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDreams.map(dream => (
              <DreamCard key={dream.id} dream={dream} />
            ))}
          </section>
        )}

        <section id="patterns" className="mt-16 scroll-mt-24">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patterns</p>
            <h2 className="mt-2 font-serif text-4xl tracking-tight">What keeps returning</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Your private pattern view now lives inside the journal: weekly letters, recurring symbols, mood texture, and rhythm.
            </p>
          </div>

          {!patterns || patterns.totalDreams < 3 ? (
            <div className="surface-glass rounded-2xl p-8 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 font-serif text-3xl tracking-tight">Capture 3 dreams to see patterns emerge</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                You have {patterns?.totalDreams ?? profile?.totalDreams ?? 0} indexed dreams in the current window. The pattern view stays quiet until there is enough material to notice without pretending.
              </p>
              <Link
                href="/capture"
                className="aurora-cta mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Start journaling <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <WeeklyLetter letter={letter} loading={letterLoading} onRefresh={refreshLetter} />
                <MoodSpectrum mood={patterns.mood} />
              </div>
              <div className="space-y-5">
                <SymbolCloud symbols={patterns.symbols} />
                <section className="surface-glass rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dream rhythm</p>
                  <h3 className="mt-1 font-serif text-2xl tracking-tight">{patterns.isoWeekRange}</h3>
                  <div className="mt-5 flex h-28 items-end gap-1.5">
                    {patterns.timeline.slice(-14).map(day => (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-24 w-full items-end rounded-full bg-secondary/50">
                          <div
                            className="w-full rounded-full bg-ring/80"
                            style={{ height: barHeight(day), opacity: day.count ? 1 : 0.25 }}
                            title={`${day.date}: ${day.count} dreams`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {patterns && patterns.recent.length > 0 && (
            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-serif text-2xl tracking-tight">Recent dream signals</h3>
                <span className="text-xs text-muted-foreground">Last {patterns.windowDays} days</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {patterns.recent.map(dream => (
                  <article key={dream.id} className="surface-glass overflow-hidden rounded-2xl">
                    {dream.thumbnailUrl && (
                      // Generated Blob URLs are final display assets.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dream.thumbnailUrl} alt="" className="h-32 w-full object-cover" />
                    )}
                    <div className="p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {formatDate(dream.createdAt)} · {dream.format}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">{dream.blurb}</p>
                      {dream.symbols.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {dream.symbols.slice(0, 3).map(symbol => (
                            <span key={symbol} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                              {symbol}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
