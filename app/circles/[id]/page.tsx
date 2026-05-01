'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Loader2, MessageCircle, Send, Share2 } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { toast } from 'sonner';
import { PageShell, PageHeader, GlassPanel, Button } from '@/components/ui';

interface Metric {
  score: number;
  oneLiner: string;
}

interface CircleComment {
  id: string;
  dreamId: string;
  authorFp: string;
  content: string;
  emoji: string | null;
  createdAt: number;
}

interface CircleDream {
  id: string;
  createdAt: number;
  sharedAt: number;
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
  comments: CircleComment[];
}

interface CircleDetail {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  sharedDreamCount: number;
  isMember: boolean;
  dreams: CircleDream[];
}

const REACTIONS = ['spark', 'moon', 'earth', 'spiral', 'candle', 'butterfly', 'mirror'];
const REACTION_LABELS: Record<string, string> = {
  spark: '*',
  moon: 'moon',
  earth: 'earth',
  spiral: 'spiral',
  candle: 'candle',
  butterfly: 'wing',
  mirror: 'mirror',
};

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(ms));
}

export default function CircleDetailPage() {
  const params = useParams<{ id: string }>();
  const circleId = params.id;
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [recentDreams, setRecentDreams] = useState<CircleDream[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedDreamId, setSelectedDreamId] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async (fp: string) => {
    const res = await fetch(`/api/circles/${circleId}?fingerprint=${encodeURIComponent(fp)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('circle failed');
    const data = await res.json() as { circle: CircleDetail; recentDreams: CircleDream[] };
    setCircle(data.circle);
    setRecentDreams(data.recentDreams);
    setSelectedDreamId(current => current || data.recentDreams[0]?.id || '');
  }, [circleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        if (cancelled) return;
        setFingerprint(fp);
        await load(fp);
      } catch (err) {
        console.error(err);
        toast.error('Could not open this circle.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function copyInvite() {
    if (!circle) return;
    await navigator.clipboard.writeText(circle.inviteCode);
    toast.success('Invite code copied.');
  }

  async function shareDream() {
    if (!fingerprint || !selectedDreamId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/share`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, dreamId: selectedDreamId }),
      });
      if (!res.ok) throw new Error('share failed');
      await load(fingerprint);
      toast.success('Dream shared to circle.');
    } catch (err) {
      console.error(err);
      toast.error('Could not share that dream.');
    } finally {
      setBusy(false);
    }
  }

  async function addComment(dreamId: string, emoji?: string) {
    if (!fingerprint) return;
    const content = commentDrafts[dreamId] ?? '';
    if (!content.trim() && !emoji) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/circles/${circleId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, dreamId, content, emoji }),
      });
      if (!res.ok) throw new Error('comment failed');
      setCommentDrafts(d => ({ ...d, [dreamId]: '' }));
      await load(fingerprint);
    } catch (err) {
      console.error(err);
      toast.error('Could not add that note.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell width="wide">
        <div className="grid flex-1 place-items-center">
          <span className="inline-flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening circle...
          </span>
        </div>
      </PageShell>
    );
  }

  if (!circle) {
    return (
      <PageShell width="wide">
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <h1 className="text-h1">Circle not found</h1>
            <Button as="link" href="/circles" variant="secondary" size="lg" className="mt-4">
              Back to circles
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell width="wide">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Circle"
          title={circle.name}
          subtitle={circle.description || 'A private place for shared dream notes.'}
        />
        <Button variant="secondary" size="lg" onClick={copyInvite}>
          <Copy className="h-4 w-4" />
          Invite {circle.inviteCode}
        </Button>
      </header>

      <GlassPanel as="section" size="md" className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Share a recent dream</label>
            <select
              value={selectedDreamId}
              onChange={e => setSelectedDreamId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-ring"
            >
              {recentDreams.length === 0 ? (
                <option value="">No generated dreams found</option>
              ) : recentDreams.map(d => (
                <option key={d.id} value={d.id}>{formatDate(d.createdAt)} - {d.blurb}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={shareDream}
            disabled={busy || !selectedDreamId}
            size="lg"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </GlassPanel>

      {circle.dreams.length === 0 ? (
        <GlassPanel as="section" size="lg" className="text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-h2">No shared dreams yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Share one of your generated dreams above, then comments and reactions will collect here.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {circle.dreams.map(dream => (
            <GlassPanel key={dream.id} as="article" size="sm" className="overflow-hidden p-0">
              <div className="grid gap-4 p-4 sm:grid-cols-[12rem_1fr]">
                <div className="overflow-hidden rounded-xl bg-secondary">
                  {dream.thumbnailUrl ? (
                    // Generated Vercel Blob URLs are already final image artifacts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dream.thumbnailUrl} alt="" className="h-48 w-full object-cover sm:h-full" />
                  ) : (
                    <div className="grid h-48 place-items-center text-sm text-muted-foreground">Video dream</div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Shared {formatDate(dream.sharedAt)} · {dream.styleName}
                  </p>
                  <p className="mt-2 text-lg leading-relaxed">{dream.blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dream.symbols.slice(0, 5).map(s => (
                      <span key={s} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2">
                    {dream.comments.map(comment => (
                      <div key={comment.id} className="rounded-xl bg-secondary/50 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{comment.emoji ? `${comment.emoji} ` : ''}</span>
                        {comment.content || REACTION_LABELS[comment.emoji ?? ''] || 'reaction'}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {REACTIONS.map(reaction => (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => addComment(dream.id, reaction)}
                        disabled={busy}
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                      >
                        {REACTION_LABELS[reaction]}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={commentDrafts[dream.id] ?? ''}
                      onChange={e => setCommentDrafts(d => ({ ...d, [dream.id]: e.target.value }))}
                      placeholder="Add a note..."
                      className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-ring"
                    />
                    <button
                      type="button"
                      onClick={() => addComment(dream.id)}
                      disabled={busy || !(commentDrafts[dream.id] ?? '').trim()}
                      className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                      aria-label="Send comment"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
