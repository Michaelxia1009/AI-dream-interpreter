/**
 * Canonical data shapes for persisted dreams + leaderboards.
 * Server-side only — see lib/dreams/repo.ts for read/write helpers.
 */

export type DreamFormat = 'video' | 'carousel';

export interface PersistedMetric {
  score: number;     // 1–10
  oneLiner: string;  // ≤ 80 chars
}

export interface PersistedMetrics {
  weirdness: PersistedMetric;
  imagination: PersistedMetric;
  emotionalIntensity: PersistedMetric;
  vividness: PersistedMetric;
}

/**
 * Media payload — store proxy paths (`/api/blob?path=…`) NOT raw private blob URLs,
 * so that share recipients can stream directly through the proxy without any auth.
 */
export type PersistedGeneration =
  | {
      kind: 'carousel';
      imageUrls: string[];   // proxy URLs
      zipUrl: string;        // proxy URL
    }
  | {
      kind: 'video';
      videoUrl: string;      // proxy URL — audio (if any) is baked into the video by the model
    };

export interface ModerationResult {
  ok: boolean;
  flags: string[];
}

/**
 * Full canonical dream record, serialised as JSON in the value of
 * Redis hash key `dream:{id}`.
 */
export interface DreamRecord {
  id: string;                    // uuid v4
  createdAt: number;             // ms epoch
  isoWeek: string;               // e.g. "2026-W18"
  format: DreamFormat;
  styleId: string;
  styleName: string;             // denormalised so /d/[id] doesn't need a styles lookup
  metrics: PersistedMetrics;
  generation: PersistedGeneration;
  fpHash: string;                // 16-char sha256 of the raw fingerprint
  handle: string;                // either user-set or "Dreamer #0063"
  isPublic: boolean;
  moderation: ModerationResult;
  blurb: string;                 // ≤ 80 chars — LLM-generated card excerpt, never the raw transcript
  dreamType?: 'normal' | 'nightmare' | 'recurring' | 'prophetic';
  /**
   * 3–8 short, lower-case symbols/motifs the LLM extracted from the dream
   * (e.g. ["forest","flying","grandmother"]). Used by /patterns to surface
   * recurring imagery across a user's history. Optional for back-compat
   * with records persisted before this field shipped.
   */
  symbols?: string[];
  /**
   * Full dream text + interview answers, concatenated by capture/page.tsx
   * before being passed to the generation routes. Persisted so the user
   * can launch interpret on past dreams from /journal and /profile. Owner-
   * only access via the /api/dream/[id]/enriched route. Optional for
   * back-compat with records persisted before this field shipped.
   */
  enrichedDream?: string;
}

export type LeaderboardMetric = 'weirdness' | 'vivid' | 'emotional';

/**
 * Subset of DreamRecord that powers a leaderboard row card. Excludes
 * the heavy `generation` payload to keep the leaderboard response small.
 */
export interface LeaderboardEntry {
  id: string;
  rank: number;          // 1-indexed
  handle: string;
  blurb: string;
  styleId: string;
  styleName: string;
  format: DreamFormat;
  thumbnailUrl: string | null;  // first carousel image, or null for video (poster comes later)
  metricScore: number;          // the score for the metric this leaderboard ranks by
  createdAt: number;
}
