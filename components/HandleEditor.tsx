'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getFingerprint } from '@/lib/fingerprint';
import { validateHandle } from '@/lib/dreams/moderation';

interface Props {
  dreamId: string;
  handle: string;
  /** Called with the new handle once saved. */
  onChange(nextHandle: string): void;
  /** If true, edits are disabled (e.g. private dream). */
  disabled?: boolean;
}

/**
 * Inline editor for the dream byline. Shows "Signed as: <handle> ✎" by
 * default. Tapping ✎ opens an inline input. On save, the handle is:
 *   1. validated locally (length + blocklist)
 *   2. PUT /api/handle  → sets the sticky default for this fingerprint
 *   3. PATCH /api/dream/[id]/visibility { handle } → updates the current dream
 */
export function HandleEditor({ dreamId, handle, onChange, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(handle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    if (disabled) return;
    setDraft(handle);
    setError(null);
    setEditing(true);
  }

  async function save() {
    const v = validateHandle(draft);
    if (!v.ok) { setError(v.reason ?? 'Invalid handle'); return; }
    setBusy(true);
    setError(null);
    try {
      const fingerprint = await getFingerprint();
      // 1. Sticky update for the device
      const handleRes = await fetch('/api/handle', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, handle: draft }),
      });
      if (!handleRes.ok) {
        const data = await handleRes.json().catch(() => null);
        throw new Error(data?.reason ?? 'Couldn\u2019t save handle');
      }
      // 2. Update the current dream's byline
      const dreamRes = await fetch(`/api/dream/${dreamId}/visibility`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, handle: draft.trim() }),
      });
      if (!dreamRes.ok) {
        const data = await dreamRes.json().catch(() => null);
        throw new Error(data?.error ?? 'Couldn\u2019t update dream');
      }
      onChange(draft.trim());
      setEditing(false);
      toast.success('Handle updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-ring/60 bg-card/60 px-3 py-1.5">
        <input
          autoFocus
          type="text"
          value={draft}
          maxLength={20}
          onChange={e => { setDraft(e.target.value); setError(null); }}
          onKeyDown={e => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="bg-transparent text-[13px] text-foreground placeholder-muted-foreground/60 focus:outline-none w-32"
          placeholder="your_handle"
          disabled={busy}
        />
        <button
          type="button"
          onClick={save}
          disabled={busy}
          aria-label="Save"
          className="rounded-full p-1 text-foreground/80 hover:text-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Cancel"
          className="rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {error && (
          <span className="ml-1 text-[11px] text-destructive">{error}</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[12px] text-muted-foreground backdrop-blur transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>
        Signed as: <span className="text-foreground/90">{handle}</span>
      </span>
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}
