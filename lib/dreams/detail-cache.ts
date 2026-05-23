type CachedMetric = {
  score: number;
  oneLiner: string;
};

export type CachedDreamDetail = {
  id: string;
  createdAt: number;
  format: 'video' | 'carousel';
  styleId?: string;
  styleName: string;
  blurb: string;
  dreamText: string;
  dreamType: 'normal' | 'nightmare' | 'recurring' | 'prophetic';
  symbols: string[];
  generation:
    | { kind: 'carousel'; imageUrls: string[]; zipUrl?: string }
    | { kind: 'video'; videoUrl: string; audioUrl: string; narrationText?: string };
  metrics: {
    weirdness: CachedMetric;
    imagination: CachedMetric;
    emotionalIntensity: CachedMetric;
    vividness: CachedMetric;
  };
  moderation: {
    ok: boolean;
    flags: string[];
  };
  isPublic: boolean;
  handle: string;
};

const CACHE_PREFIX = 'dream-detail-v1:';

function keyFor(id: string): string {
  return `${CACHE_PREFIX}${id}`;
}

export function readCachedDreamDetail(id: string | undefined): CachedDreamDetail | null {
  if (!id || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(keyFor(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDreamDetail;
    return parsed?.id === id ? parsed : null;
  } catch {
    return null;
  }
}

export function cacheDreamDetailPreview(dream: CachedDreamDetail): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(keyFor(dream.id), JSON.stringify(dream));
  } catch {
    // Storage can be unavailable in private browsing; navigation still falls back to the API.
  }
}
