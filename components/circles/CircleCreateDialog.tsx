'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="aurora-cta inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
      >
        <Plus className="h-4 w-4" />
        Create
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-4 shadow-2xl">
          <h2 className="font-serif text-xl">New circle</h2>
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
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={busy || !name.trim()} className="aurora-cta rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Create circle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
