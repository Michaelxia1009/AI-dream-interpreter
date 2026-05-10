import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { generateObjectWithFallback } from './with-fallback';
import { STYLES, listStyleIds } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/score.system.md'),
  'utf8',
);

const MetricSchema = z.object({
  score: z.number().int().min(1).max(10),
  oneLiner: z.string().min(1).max(80),
});

const ModerationSchema = z.object({
  ok: z.boolean(),
  flags: z.array(z.string()),
});

export const ScoreResultSchema = z.object({
  metrics: z.object({
    weirdness: MetricSchema,
    imagination: MetricSchema,
    emotionalIntensity: MetricSchema,
    vividness: MetricSchema,
  }),
  matchedStyleIds: z.array(z.string()).length(3),
  blurb: z.string().min(1).max(80).optional().default('A dream worth remembering.'),
  moderation: ModerationSchema.optional().default({ ok: true, flags: [] }),
  symbols: z.array(z.string()).min(0).max(8).optional().default([]),
});

// Relaxed schema for generateObject — Anthropic API doesn't support
// min/max/length constraints on integers/arrays in JSON schema
const MetricSchemaLLM = z.object({
  score: z.number(),
  oneLiner: z.string(),
});

const ScoreResultSchemaLLM = z.object({
  metrics: z.object({
    weirdness: MetricSchemaLLM,
    imagination: MetricSchemaLLM,
    emotionalIntensity: MetricSchemaLLM,
    vividness: MetricSchemaLLM,
  }),
  matchedStyleIds: z.array(z.string()),
  blurb: z.string(),
  moderation: z.object({
    ok: z.boolean(),
    flags: z.array(z.string()),
  }),
  symbols: z.array(z.string()),
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;

const EXTRA_INSTRUCTIONS = [
  '',
  'ADDITIONAL OUTPUTS:',
  '- "blurb": a poster-card excerpt of the dream, ≤ 80 characters, evocative not literal.',
  '  • Never repeat the user\'s words verbatim. Distil the vibe.',
  '  • Good: "A whale of stained glass surfaces in the church floor."',
  '  • Bad: "I dreamed about a whale in a church."',
  '- "moderation": { ok: boolean, flags: string[] }',
  '  • ok=false if the dream contains: explicit sexual content, graphic violence, real-named slurs, real-person targeted harassment, or self-harm encouragement.',
  '  • Mere unsettling, surreal, or dark dream content is fine — those are normal dreams.',
  '  • flags: short tags like ["explicit_sexual", "graphic_violence", "slur"] when ok=false; [] when ok=true.',
  '- "symbols": 3 to 8 short, lower-case, single-word (or hyphenated) motifs that appear in the dream.',
  '  • Concrete imagery, not abstract feelings: prefer "ocean", "grandmother", "stairs" over "fear", "peace".',
  '  • One word each — split phrases ("flying" not "the act of flying"). Use a hyphen only for unsplittable compounds ("dream-stairs" → "stairs").',
  '  • All lower-case ASCII. No punctuation, no emoji. De-duplicate.',
  '  • If the dream is too sparse for 3 symbols, return as many as you can — never invent.',
].join('\n');

function clampMetric(m: { score: number; oneLiner: string }): { score: number; oneLiner: string } {
  return {
    score: Math.max(1, Math.min(10, Math.round(m.score))),
    oneLiner: typeof m.oneLiner === 'string' ? m.oneLiner.slice(0, 80) : '',
  };
}

export async function scoreDream(enrichedDream: string): Promise<ScoreResult> {
  const stylesContext = STYLES.map(s => ({
    id: s.id,
    name: s.name,
    moodTags: s.moodTags,
  }));
  const validIds = listStyleIds();

  const result = await generateObjectWithFallback({
    system: SYSTEM_PROMPT + EXTRA_INSTRUCTIONS,
    schema: ScoreResultSchemaLLM,
    prompt: [
      'DREAM:',
      enrichedDream,
      '',
      'AVAILABLE STYLES:',
      JSON.stringify(stylesContext, null, 2),
    ].join('\n'),
    temperature: 0.4,
  });
  const object = result.object as z.infer<typeof ScoreResultSchemaLLM>;

  // Clamp scores to 1-10 and oneLiners to ≤80
  const metrics = {
    weirdness: clampMetric(object.metrics.weirdness),
    imagination: clampMetric(object.metrics.imagination),
    emotionalIntensity: clampMetric(object.metrics.emotionalIntensity),
    vividness: clampMetric(object.metrics.vividness),
  };

  // Ensure exactly 3 valid style ids
  const filtered = object.matchedStyleIds.filter(id => validIds.includes(id));
  let matchedStyleIds: string[];
  if (filtered.length < 3) {
    const fillers = validIds.filter(id => !filtered.includes(id)).slice(0, 3 - filtered.length);
    matchedStyleIds = [...filtered, ...fillers];
  } else {
    matchedStyleIds = filtered.slice(0, 3);
  }

  // Truncate blurb defensively
  const blurb = (typeof object.blurb === 'string' ? object.blurb : '').trim().slice(0, 80) ||
    'A dream worth remembering.';

  // Moderation default-safe: if the model omitted it (shouldn't happen with the relaxed schema),
  // fall back to ok=true so we don't accidentally hide every dream.
  const moderation = object.moderation && typeof object.moderation.ok === 'boolean'
    ? { ok: object.moderation.ok, flags: object.moderation.flags ?? [] }
    : { ok: true, flags: [] };

  // Normalise symbols: lower-case, alpha + hyphen only, dedupe, cap at 8.
  const symbols = sanitizeSymbols(object.symbols);

  return {
    metrics,
    matchedStyleIds,
    blurb,
    moderation,
    symbols,
  };
}

/**
 * Lower-case, strip non-letters (keep hyphens), drop blanks, dedupe, cap at 8.
 * Defensive — the model occasionally returns trailing punctuation or duplicates.
 */
function sanitizeSymbols(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const cleaned = item
      .toLowerCase()
      .trim()
      .replace(/[^a-z\-]/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    if (!cleaned || cleaned.length < 2) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 8) break;
  }
  return out;
}

export async function rerollStyles(
  enrichedDream: string,
  exclude: string[],
): Promise<string[]> {
  const remaining = listStyleIds().filter(id => !exclude.includes(id));
  if (remaining.length <= 3) return remaining.slice(0, 3);
  const result = await scoreDream(enrichedDream);
  const freshPicks = result.matchedStyleIds.filter(id => !exclude.includes(id));
  const fill = remaining.filter(id => !freshPicks.includes(id));
  return [...freshPicks, ...fill].slice(0, 3);
}
