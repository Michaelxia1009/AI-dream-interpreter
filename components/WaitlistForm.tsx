'use client';

import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Plus-tier waitlist signup. Posts to /api/waitlist; on success switches to a
 * "you're on the list" confirmation. Stays embedded in the Plus pricing card.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-3 text-center text-sm text-accent-foreground"
        role="status"
      >
        <span aria-hidden>✦</span>
        <span>
          You&apos;re on the list. We&apos;ll send word when Plus opens up.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) {
          toast.error('Add your email first.');
          return;
        }
        setSubmitting(true);
        try {
          const res = await fetch('/api/waitlist', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: trimmed }),
          });
          const j = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
          };
          if (!res.ok || !j.ok) {
            toast.error(j.error ?? 'Could not save your email — try again.');
            return;
          }
          setDone(true);
          toast.success('Welcomed in.');
        } catch {
          toast.error('Network hiccup — try again.');
        } finally {
          setSubmitting(false);
        }
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@yourself.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        className="flex-1 rounded-full border border-border/60 bg-background/40 px-5 py-3 text-sm placeholder:text-muted-foreground/60 outline-none transition focus:border-ring/80 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={submitting}
        className="aurora-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
      >
        {submitting ? 'Sending…' : 'Join Plus waitlist'}
      </button>
    </form>
  );
}
