import { generateObject } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { gateway, CLAUDE_MODEL } from './client';
import type { Style } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/scene.system.md'),
  'utf8',
);

// Strict schemas for validation/tests
export const CarouselPromptsSchema = z.object({
  prompts: z.array(z.string().min(5)).min(4).max(6),
});

export const VideoPromptSchema = z.object({
  prompt: z.string().min(5),
});

// Relaxed schemas for generateObject — Anthropic doesn't support
// min/max constraints in JSON schema
const CarouselPromptsSchemaLLM = z.object({
  prompts: z.array(z.string()),
});

const VideoPromptSchemaLLM = z.object({
  prompt: z.string(),
});

export async function buildCarouselPrompts(
  enrichedDream: string,
  style: Style,
): Promise<string[]> {
  const { object } = await generateObject({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    schema: CarouselPromptsSchemaLLM,
    prompt: `MODE: CAROUSEL\nSTYLE_SUFFIX: ${style.imagePromptSuffix}\nDREAM:\n${enrichedDream}`,
    temperature: 0.85,
  });
  return object.prompts.map(p => `${style.imagePromptSuffix}, ${p}`);
}

export async function buildVideoScenePrompt(
  enrichedDream: string,
  style: Style,
): Promise<string> {
  const { object } = await generateObject({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    schema: VideoPromptSchemaLLM,
    prompt: `MODE: VIDEO\nSTYLE_SUFFIX: ${style.imagePromptSuffix}\nDREAM:\n${enrichedDream}`,
    temperature: 0.85,
  });
  return `${style.imagePromptSuffix}, ${object.prompt}`;
}
