import { generateObject } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { gateway, CLAUDE_MODEL } from './client';

const MAX_QUESTIONS = 5;
const MIN_OPTIONS = 4;
const MAX_OPTIONS = 6;

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/interview.system.md'),
  'utf8',
);

export const CATEGORIES = [
  'figuresAppearance',
  'environment',
  'emotion',
  'lighting',
  'motion',
  'color',
  'keyObject',
  'sound',
  'twist',
] as const;

export type InterviewCategory = (typeof CATEGORIES)[number];

export interface InterviewTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const InterviewQuestionSchema = z.object({
  text: z.string().min(3),
  category: z.enum(CATEGORIES),
  selectionMode: z.enum(['one', 'many']),
  options: z.array(z.string().min(1)).min(MIN_OPTIONS).max(MAX_OPTIONS),
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

export const InterviewStepSchema = z.discriminatedUnion('done', [
  z.object({ done: z.literal(true) }),
  z.object({ done: z.literal(false), question: InterviewQuestionSchema }),
]);

export type InterviewStepResult = z.infer<typeof InterviewStepSchema>;

// Relaxed for `generateObject` — Anthropic JSON schema ignores min/max and
// `discriminatedUnion`, so we shape the response with optional/nullable fields
// and clamp/validate downstream.
const InterviewStepSchemaLLM = z.object({
  done: z.boolean(),
  question: z
    .object({
      text: z.string(),
      category: z.enum(CATEGORIES),
      selectionMode: z.enum(['one', 'many']),
      options: z.array(z.string()),
    })
    .nullable(),
});

export function shouldStopInterview(questionsAsked: number): boolean {
  return questionsAsked >= MAX_QUESTIONS;
}

export function normalizeQuestion(raw: {
  text: string;
  category: InterviewCategory;
  selectionMode: 'one' | 'many';
  options: string[];
}): InterviewQuestion {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const o of raw.options) {
    const t = o.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(t);
  }
  // Truncate excess.
  let options = cleaned.slice(0, MAX_OPTIONS);
  // Pad if the LLM under-shot (rare).
  while (options.length < MIN_OPTIONS) {
    options.push(`something else (${options.length + 1})`);
  }
  return {
    text: raw.text.trim(),
    category: raw.category,
    selectionMode: raw.selectionMode,
    options,
  };
}

export async function nextInterviewStep(
  history: InterviewTurn[],
  questionsAsked: number,
): Promise<InterviewStepResult> {
  if (shouldStopInterview(questionsAsked)) return { done: true };

  let raw: z.infer<typeof InterviewStepSchemaLLM>;
  try {
    const result = await generateObject({
      model: gateway(CLAUDE_MODEL),
      system: SYSTEM_PROMPT,
      schema: InterviewStepSchemaLLM,
      messages: history,
      temperature: 0.8,
    });
    raw = result.object;
  } catch (err) {
    console.error('[interview] generateObject failed:', err);
    // Graceful degradation: end the interview rather than crashing the page.
    return { done: true };
  }

  if (raw.done || !raw.question) return { done: true };

  const normalized = normalizeQuestion(raw.question);
  const validated = InterviewStepSchema.safeParse({
    done: false,
    question: normalized,
  });
  if (!validated.success) {
    console.error('[interview] post-normalize validation failed:', validated.error);
    return { done: true };
  }
  return validated.data;
}

export function compileEnrichedDream(history: InterviewTurn[]): string {
  return history
    .map(t => (t.role === 'user' ? `USER: ${t.content}` : `Q: ${t.content}`))
    .join('\n');
}
