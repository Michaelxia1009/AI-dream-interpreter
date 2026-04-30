import { NextRequest } from 'next/server';
import { z } from 'zod';
import { streamText } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gateway, CLAUDE_MODEL } from '@/lib/ai/client';
import { getAgent, getLens, type Lens, type AgentId } from '@/lib/interpret';

/**
 * POST /api/interpret  → text/plain stream of Claude tokens.
 *
 * Body:
 *   {
 *     lens:    'symbolic' | 'emotional' | 'jungian',
 *     agent:   'guide'    | 'zhougong'  | 'freud',
 *     messages: [{ role:'user'|'assistant', content:string }, …],
 *   }
 *
 * The first user message must already contain `<DREAM>…</DREAM>` (the client
 * builds this via `buildOpeningUserMessage`). The route stays stateless — the
 * client owns the chat history.
 */

export const runtime = 'nodejs';
// Long answers can take 20–40s on Sonnet. Lift the function ceiling for safety.
export const maxDuration = 60;

const SYSTEM_TEMPLATE = readFileSync(
  path.join(process.cwd(), 'prompts/interpret.system.md'),
  'utf8',
);

const Body = z.object({
  lens: z.enum(['symbolic', 'emotional', 'jungian']),
  agent: z.enum(['guide', 'zhougong', 'freud']),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
});

function buildSystemPrompt(lens: Lens, agent: AgentId): string {
  return SYSTEM_TEMPLATE
    .replace('{{LENS_INSTRUCTION}}', getLens(lens).instruction)
    .replace('{{PERSONA_INSTRUCTION}}', getAgent(agent).instruction);
}

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const reason =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? 'Invalid request'
        : 'Invalid JSON body';
    return new Response(reason, { status: 400 });
  }

  const system = buildSystemPrompt(parsed.lens, parsed.agent);

  try {
    const result = streamText({
      model: gateway(CLAUDE_MODEL),
      system,
      messages: parsed.messages,
      maxOutputTokens: 700,
      temperature: 0.7,
    });
    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[/api/interpret] stream error', err);
    return new Response('Could not read your dream just now — try again.', {
      status: 500,
    });
  }
}
