import { generateObject } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { gateway, CLAUDE_MODEL } from './client';
import { STYLES, listStyleIds } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/score.system.md'),
  'utf8',
);

const MetricSchema = z.object({
  score: z.number().int().min(1).max(10),
  oneLiner: z.string().min(1).max(80),
});

export const ScoreResultSchema = z.object({
  metrics: z.object({
    weirdness: MetricSchema,
    imagination: MetricSchema,
    emotionalIntensity: MetricSchema,
    vividness: MetricSchema,
  }),
  matchedStyleIds: z.array(z.string()).length(3),
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
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;

export async function scoreDream(enrichedDream: string): Promise<ScoreResult> {
  const stylesContext = STYLES.map(s => ({
    id: s.id,
    name: s.name,
    moodTags: s.moodTags,
  }));
  const validIds = listStyleIds();

  const { object } = await generateObject({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
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

  // Clamp scores to 1-10
  for (const key of Object.keys(object.metrics) as (keyof typeof object.metrics)[]) {
    object.metrics[key].score = Math.max(1, Math.min(10, object.metrics[key].score));
  }

  // Ensure exactly 3 valid style ids
  const filtered = object.matchedStyleIds.filter(id => validIds.includes(id));
  if (filtered.length < 3) {
    const fillers = validIds.filter(id => !filtered.includes(id)).slice(0, 3 - filtered.length);
    object.matchedStyleIds = [...filtered, ...fillers];
  } else {
    object.matchedStyleIds = filtered.slice(0, 3);
  }

  return object as ScoreResult;
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
