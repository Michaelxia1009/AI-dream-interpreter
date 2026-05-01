'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button, GlassPanel } from '@/components/ui';

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
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => setOpen(o => !o)}
      >
        <KeyRound className="h-4 w-4" />
        Join
      </Button>
      {open && (
        <GlassPanel size="sm" className="absolute right-0 top-full z-20 mt-3 w-[min(20rem,calc(100vw-2rem))] shadow-2xl">
          <h2 className="font-display text-xl">Join by invite</h2>
          <input
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase tracking-[0.14em] outline-none focus:border-ring"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={submit} disabled={busy || !inviteCode.trim()}>
              Join circle
            </Button>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
