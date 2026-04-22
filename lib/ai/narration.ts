import { generateText } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gateway, CLAUDE_MODEL } from './client';
import type { Style } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/narration.system.md'),
  'utf8',
);

export async function buildNarrationScript(
  enrichedDream: string,
  style: Style,
): Promise<string> {
  const { text } = await generateText({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `NARRATOR: ${style.narratorPersona}\nDREAM:\n${enrichedDream}`,
    temperature: 0.9,
    maxOutputTokens: 120,
  });
  return text.trim();
}
