import { generateText } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gateway, CLAUDE_MODEL } from './client';
import { getRedis } from '@/lib/redis';
import type { PatternsAggregation } from '@/lib/dreams/patterns';

/**
 * Weekly Letter — a short LLM-generated reflection on a dreamer's week.
 *
 * Cached at `letter:{fpHash}:{isoWeek}` with a 14-day TTL so the same week's
 * letter is reused on /patterns refreshes (the LLM call is the only slow
 * part of the page).
 *
 * Cache invalidation: writing a new dream within the same week does NOT
 * automatically invalidate the cached letter — the user can hit a "Refresh"
 * affordance which calls this with `force: true` to regenerate. (Avoids
 * hammering the LLM after every single dream while still letting users
 * pull a fresh one once their week feels different.)
 */

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/weekly-letter.system.md'),
  'utf8',
);

const LETTER_TTL_SECONDS = 14 * 24 * 60 * 60;

export interface WeeklyLetter {
  text: string;
  generatedAt: number;
  cached: boolean;
}

function cacheKey(fpHash: string, isoWeek: string): string {
  return `letter:${fpHash}:${isoWeek}`;
}

/**
 * Builds a compact USER prompt from the aggregation. Kept short — the model
 * does not need every dream, just the texture of the week.
 */
function buildUserPrompt(
  agg: PatternsAggregation,
  recentBlurbs: string[],
): string {
  const m = agg.mood;
  const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(1) : '—';
  return [
    `WEEK SUMMARY (${agg.windowDays}-day window):`,
    `- total dreams: ${m.count}`,
    `- avg weirdness: ${fmt(m.avgWeirdness)} / 10`,
    `- avg imagination: ${fmt(m.avgImagination)} / 10`,
    `- avg emotional intensity: ${fmt(m.avgEmotionalIntensity)} / 10`,
    `- avg vividness: ${fmt(m.avgVividness)} / 10`,
    '',
    'TOP SYMBOLS (by count, this window):',
    agg.symbols.length === 0
      ? '  (none yet)'
      : agg.symbols.slice(0, 10).map(s => `  - ${s.symbol} (×${s.count})`).join('\n'),
    '',
    'RECENT DREAM BLURBS (newest first):',
    recentBlurbs.length === 0
      ? '  (none)'
      : recentBlurbs.slice(0, 6).map(b => `  - ${b}`).join('\n'),
    '',
    'Write the Weekly Letter now.',
  ].join('\n');
}

/**
 * Returns the (possibly cached) weekly letter for this fp+week. Falls back
 * to a soft static line if the LLM call fails — the page should never block
 * on the letter.
 */
export async function getOrGenerateWeeklyLetter(
  fpHash: string,
  isoWeek: string,
  agg: PatternsAggregation,
  recentBlurbs: string[],
  opts: { force?: boolean } = {},
): Promise<WeeklyLetter> {
  const redis = getRedis();
  const key = cacheKey(fpHash, isoWeek);

  if (!opts.force) {
    try {
      const cached = await redis.get<{ text: string; generatedAt: number } | string>(key);
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (parsed && typeof parsed.text === 'string') {
          return { text: parsed.text, generatedAt: parsed.generatedAt ?? Date.now(), cached: true };
        }
      }
    } catch {
      /* fall through to regenerate */
    }
  }

  // Empty week → don't waste a model call. Return a graceful soft line.
  if (agg.totalDreams === 0) {
    return {
      text: 'No dreams have surfaced this week. The page is patient — it will be here when one finds you.',
      generatedAt: Date.now(),
      cached: false,
    };
  }

  try {
    const { text } = await generateText({
      model: gateway(CLAUDE_MODEL),
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(agg, recentBlurbs),
      maxOutputTokens: 220,
      temperature: 0.75,
    });
    const cleaned = text.trim().replace(/\n{2,}/g, ' ').slice(0, 800);
    const payload = { text: cleaned, generatedAt: Date.now() };
    try {
      await redis.set(key, JSON.stringify(payload), { ex: LETTER_TTL_SECONDS });
    } catch {
      /* cache write is best-effort */
    }
    return { ...payload, cached: false };
  } catch (err) {
    console.error('weekly-letter LLM failed', err);
    return {
      text: agg.totalDreams === 1
        ? 'One dream this week — small, but counted. The shape of a pattern starts here.'
        : `${agg.totalDreams} dreams this week, drifting in their own weather. The week's letter is offline — try refreshing in a moment.`,
      generatedAt: Date.now(),
      cached: false,
    };
  }
}
