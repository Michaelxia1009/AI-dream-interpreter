'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';

export function CircleJoinDialog({
  busy,
  onJoin,
}: {
  busy: boolean;
  onJoin: (inviteCode: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  async function submit() {
    if (!inviteCode.trim()) return;
    await onJoin(inviteCode);
    setInviteCode('');
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-ring/60"
      >
        <KeyRound className="h-4 w-4" />
        Join
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-4 shadow-2xl">
          <h2 className="font-serif text-xl">Join by invite</h2>
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase tracking-[0.14em] outline-none focus:border-ring"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={busy || !inviteCode.trim()} className="aurora-cta rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Join circle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
