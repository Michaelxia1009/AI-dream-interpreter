'use client';

import { useState } from 'react';
import { Globe2, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getFingerprint } from '@/lib/fingerprint';

interface Props {
  dreamId: string;
  isPublic: boolean;
  /** Called once the user successfully flips visibility. */
  onChange(nextIsPublic: boolean): void;
  /** If true, the dream was forced-private by moderation — show a soft notice instead of a toggle. */
  moderated?: boolean;
}

/**
 * Pill-style toggle on the result screen.
 *   PUBLIC  → "🌐 Public on the leaderboard" — tapping confirms before flipping to private (DESTRUCTIVE)
 *   PRIVATE → "🔒 Private — only you can see this" — informational; cannot un-flip after delete
 */
export function PrivacyToggle({ dreamId, isPublic, onChange, moderated }: Props) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (moderated) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[12px] text-amber-200/90">
        <Lock className="h-3.5 w-3.5" />
        <span>This one\u2019s just for you — kept private.</span>
      </div>
    );
  }

  if (!isPublic) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[12px] text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Private — removed from the leaderboard.</span>
      </div>
    );
  }

  async function makePrivate() {
    setBusy(true);
    try {
      const fingerprint = await getFingerprint();
      const res = await fetch(`/api/dream/${dreamId}/visibility`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, isPublic: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'request failed');
      }
      onChange(false);
      toast.success('Removed from leaderboard. Your media is still downloadable for the next 24h.');
    } catch (err) {
      console.error(err);
      toast.error('Couldn\u2019t make this private. Please try again.');
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => setConfirming(c => !c)}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[12px] text-foreground/90 backdrop-blur transition hover:bg-card/60"
      >
        <Globe2 className="h-3.5 w-3.5" />
        <span>Public on the leaderboard</span>
        <span className="text-muted-foreground">▾</span>
      </button>

      {confirming && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg">
          <p className="text-foreground/90">
            Make this dream private? It will be removed from the leaderboard
            and the share link will no longer work. Your media remains
            downloadable here for 24 hours.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-border px-3 py-1 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={makePrivate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-destructive-foreground"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Make private
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
