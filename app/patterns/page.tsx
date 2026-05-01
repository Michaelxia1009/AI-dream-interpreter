'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Loader2 } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { MoodSpectrum, type MoodSummary } from '@/components/patterns/MoodSpectrum';
import { SymbolCloud, type SymbolHit } from '@/components/patterns/SymbolCloud';
import { WeeklyLetter, type WeeklyLetterPayload } from '@/components/patterns/WeeklyLetter';
import { toast } from 'sonner';

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

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(ms));
}

function barHeight(day: DayBin): string {
  if (day.count === 0) return '10%';
  return `${Math.min(100, 28 + day.count * 18)}%`;
}

export default function PatternsPage() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [data, setData] = useState<PatternsPayload | null>(null);
  const [letter, setLetter] = useState<WeeklyLetterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [letterLoading, setLetterLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        if (cancelled) return;
        setFingerprint(fp);

        const res = await fetch(`/api/patterns?fingerprint=${encodeURIComponent(fp)}&days=30`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('patterns failed');
        const payload = await res.json() as PatternsPayload;
        if (cancelled) return;
        setData(payload);

        const letterRes = await fetch(`/api/patterns/letter?fingerprint=${encodeURIComponent(fp)}&days=30`, {
          cache: 'no-store',
        });
        if (letterRes.ok) {
          const letterPayload = await letterRes.json() as { letter: WeeklyLetterPayload };
          if (!cancelled) setLetter(letterPayload.letter);
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load your patterns yet.');
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

  if (loading) {
    return (
      <main className="aurora-bg grid min-h-dvh place-items-center px-6">
        <div className="inline-flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading your dream history...
        </div>
      </main>
    );
  }

  const needsMoreDreams = !data || data.totalDreams < 3;

  return (
    <main className="aurora-bg min-h-dvh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Patterns</p>
            <h1 className="mt-2 font-serif text-5xl leading-tight tracking-tight">
              Your dreams, over time.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              A private dashboard for recurring symbols, mood texture, and a weekly letter drawn from dreams saved on this device.
            </p>
          </div>
          <Link
            href="/capture"
            className="aurora-cta inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            New dream <ChevronRight className="h-4 w-4" />
          </Link>
        </header>

        {needsMoreDreams ? (
          <section className="surface-glass rounded-2xl p-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 font-serif text-3xl tracking-tight">Capture 3 dreams to see patterns emerge</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              You have {data?.totalDreams ?? 0} indexed dreams in the current window. The pattern view stays quiet until there is enough material to notice without pretending.
            </p>
            <Link
              href="/capture"
              className="aurora-cta mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
            >
              Start journaling
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <WeeklyLetter letter={letter} loading={letterLoading} onRefresh={refreshLetter} />
              <MoodSpectrum mood={data.mood} />
            </div>
            <div className="space-y-5">
              <SymbolCloud symbols={data.symbols} />
              <section className="surface-glass rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dream rhythm</p>
                <h2 className="mt-1 font-serif text-2xl tracking-tight">{data.isoWeekRange}</h2>
                <div className="mt-5 flex h-28 items-end gap-1.5">
                  {data.timeline.slice(-14).map(day => (
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

        {data && data.recent.length > 0 && (
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-2xl tracking-tight">Recent dream signals</h2>
              <span className="text-xs text-muted-foreground">Last {data.windowDays} days</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.recent.map(d => (
                <article key={d.id} className="surface-glass overflow-hidden rounded-2xl">
                  {d.thumbnailUrl && (
                    // Generated Vercel Blob URLs are already optimized artifacts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.thumbnailUrl} alt="" className="h-32 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {formatDate(d.createdAt)} · {d.format}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{d.blurb}</p>
                    {d.symbols.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {d.symbols.slice(0, 3).map(s => (
                          <span key={s} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                            {s}
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
      </div>
    </main>
  );
}
