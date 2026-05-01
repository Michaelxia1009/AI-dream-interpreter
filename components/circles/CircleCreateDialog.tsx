'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, GlassPanel } from '@/components/ui';

export function CircleCreateDialog({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function submit() {
    if (!name.trim()) return;
    await onCreate(name, description);
    setName('');
    setDescription('');
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(o => !o)}
      >
        <Plus className="h-4 w-4" />
        Create
      </Button>
      {open && (
        <GlassPanel size="sm" className="absolute right-0 top-full z-20 mt-3 w-[min(22rem,calc(100vw-2rem))] shadow-2xl">
          <h2 className="font-display text-xl">New circle</h2>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Circle name"
            className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this circle for?"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={submit} disabled={busy || !name.trim()}>
              Create circle
            </Button>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
