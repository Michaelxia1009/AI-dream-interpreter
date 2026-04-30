'use client';

import { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /** Canonical share URL — usually `${origin}/d/${id}` */
  url: string;
  /** Title shown in the OS share sheet */
  title?: string;
  /** Body text shown in the OS share sheet */
  text?: string;
  /** Optional class to override the default pill style */
  className?: string;
  /** If true, render as a small icon-only square button. */
  iconOnly?: boolean;
  /** Called once a share/copy attempt completes (success only) */
  onShared?(): void;
  /** Disable the button */
  disabled?: boolean;
  /** Custom label override */
  label?: string;
}

/**
 * Share button — invokes the OS Web Share sheet on mobile (which routes to
 * Instagram/TikTok/Messages/etc.) and falls back to clipboard copy on desktop.
 *
 * The full URL is stable and shareable across devices — recipients open
 * `/d/[id]` and see the dream rendered server-side, no auth or session needed.
 */
export function ShareButton({
  url,
  title = 'A dream, visualised ✦',
  text = 'I turned my dream into a cinematic short. Made with Dreamweaver.',
  className,
  iconOnly = false,
  onShared,
  disabled,
  label = 'Share',
}: Props) {
  const [justCopied, setJustCopied] = useState(false);

  async function handleClick() {
    if (disabled) return;
    try {
      // Prefer native share when supported; the OS sheet handles app routing.
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const payload: ShareData = { title, text, url };
        // canShare is optional; if unsupported, just call share().
        if (typeof navigator.canShare === 'function' && !navigator.canShare(payload)) {
          throw new Error('not shareable');
        }
        await navigator.share(payload);
        onShared?.();
        return;
      }
      throw new Error('no share api');
    } catch (err: any) {
      // AbortError = user dismissed the share sheet — silent no-op.
      if (err?.name === 'AbortError') return;
      // Fall back to clipboard.
      try {
        await navigator.clipboard.writeText(url);
        setJustCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setJustCopied(false), 1800);
        onShared?.();
      } catch {
        toast.error('Couldn\u2019t copy link — long-press to select instead.');
      }
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={label}
        className={
          className ??
          'rounded-full border border-border bg-card p-4 text-muted-foreground transition hover:text-foreground hover:border-ring/60 disabled:cursor-not-allowed disabled:opacity-50'
        }
      >
        {justCopied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={
        className ??
        'aurora-cta inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      {justCopied ? (
        <>
          <Check className="h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
