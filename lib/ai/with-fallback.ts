import {
  generateObject,
  generateText,
  streamText,
} from 'ai';
import { gateway, CLAUDE_MODEL } from './client';
import { minimax, MINIMAX_CHAT_MODEL, isMiniMaxConfigured } from './minimax-client';

/**
 * Chat-completion wrappers that try Anthropic Claude first and fall back
 * to MiniMax M2.5 (via OpenAI-compatible API) on error.
 *
 * Fallback fires on any thrown error EXCEPT user-initiated AbortError.
 * If `MINIMAX_API_KEY` is unset, the original error propagates — no hidden
 * retries. Streaming wrapper is best-effort; mid-stream errors surface to
 * the caller (only the synchronous setup of streamText is guarded).
 *
 * MiniMax M2.5 is a reasoning model that emits `<think>...</think>` blocks
 * before its final answer. The AI SDK's strict JSON parser in
 * `generateObject` chokes on that prefix. So in the MiniMax fallback path
 * for `generateObject` we use `generateText` + manual JSON extraction +
 * zod validation against the original schema. Same end shape (`{ object,
 * usage, ... }`), just resilient to thinking tokens.
 */

function isAbort(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: unknown }).name;
  return name === 'AbortError' || name === 'AbortException';
}

function shouldFallback(err: unknown): boolean {
  if (isAbort(err)) return false;
  return isMiniMaxConfigured();
}

function logFallback(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const safe = msg
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-key]')
    .replace(/r8_[A-Za-z0-9_-]+/g, '[redacted-token]')
    .slice(0, 200);
  console.warn(`[fallback:${scope}] Anthropic failed → MiniMax: ${safe}`);
}

/**
 * Strip `<think>...</think>` reasoning blocks (used by MiniMax M2.5 and
 * other reasoning models) and extract the first balanced JSON object/array
 * from the remaining text.
 */
function extractJsonFromReasoningModel(raw: string): unknown {
  // Drop everything between <think> ... </think> (greedy across newlines)
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Try direct parse first (the model may already return clean JSON)
  try {
    return JSON.parse(stripped);
  } catch {
    /* fall through to balanced-brace scan */
  }

  // Scan for the first balanced { ... } or [ ... ] block.
  const opens: Record<string, string> = { '{': '}', '[': ']' };
  for (let start = 0; start < stripped.length; start++) {
    const ch = stripped[start];
    if (!opens[ch]) continue;
    const close = opens[ch];
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < stripped.length; i++) {
      const c = stripped[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === ch) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          const candidate = stripped.slice(start, i + 1);
          try { return JSON.parse(candidate); }
          catch { break; /* try a later opening */ }
        }
      }
    }
  }
  throw new Error(`No parseable JSON found in MiniMax response (text length: ${raw.length})`);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyOpts = Record<string, any>;
type GenObjReturn = { object: any; finishReason?: any; usage?: any; warnings?: any };
type GenTextReturn = { text: string; finishReason?: any; usage?: any; warnings?: any };

async function generateObjectViaMiniMaxText(opts: AnyOpts): Promise<GenObjReturn> {
  // Re-use the same prompt/system/messages but go through generateText so the
  // raw response (with <think> blocks) reaches us for manual extraction.
  // Drop schema from the LLM call — we'll validate with it locally.
  const { schema, schemaName, schemaDescription, output, mode, ...textOpts } = opts;
  // Suppress unused-var warnings for the discarded schema-mode keys.
  void schemaName; void schemaDescription; void output; void mode;

  // Nudge the model toward concise JSON-only output.
  const jsonNudge = '\n\nReturn ONLY a valid JSON object. No explanation, no code fences, no commentary.';
  const augmented = textOpts.system
    ? { ...textOpts, system: `${textOpts.system}${jsonNudge}` }
    : { ...textOpts, prompt: `${textOpts.prompt ?? ''}${jsonNudge}` };

  const result = await generateText({
    model: minimax(MINIMAX_CHAT_MODEL),
    ...augmented,
  } as any);

  const parsed = extractJsonFromReasoningModel(result.text);
  // Validate with the original zod schema if provided.
  if (schema && typeof schema?.safeParse === 'function') {
    const v = schema.safeParse(parsed);
    if (!v.success) {
      throw new Error(`MiniMax response failed schema validation: ${v.error.message.slice(0, 200)}`);
    }
    return {
      object: v.data,
      finishReason: result.finishReason,
      usage: result.usage,
      warnings: result.warnings,
    };
  }
  return {
    object: parsed,
    finishReason: result.finishReason,
    usage: result.usage,
    warnings: result.warnings,
  };
}

export async function generateObjectWithFallback(opts: AnyOpts): Promise<GenObjReturn> {
  try {
    return (await generateObject({ model: gateway(CLAUDE_MODEL), ...opts } as any)) as GenObjReturn;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    logFallback('generateObject', err);
    return await generateObjectViaMiniMaxText(opts);
  }
}

export async function generateTextWithFallback(opts: AnyOpts): Promise<GenTextReturn> {
  try {
    return (await generateText({ model: gateway(CLAUDE_MODEL), ...opts } as any)) as GenTextReturn;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    logFallback('generateText', err);
    const result = await generateText({ model: minimax(MINIMAX_CHAT_MODEL), ...opts } as any);
    // Strip thinking-tokens from the visible text so callers don't see them.
    return {
      ...result,
      text: result.text.replace(/<think>[\s\S]*?<\/think>/g, '').trim(),
    } as GenTextReturn;
  }
}

/**
 * Best-effort streaming fallback. `streamText` returns synchronously, so
 * only synchronous setup errors trigger fallback. Errors during the async
 * stream surface via the caller's existing error path.
 *
 * NOTE: when fallback fires for streamText, MiniMax's `<think>` tokens
 * stream through to the user as visible text (the SDK doesn't expose
 * a chunk-level transform). The interpret endpoint is the only consumer
 * and the user can simply retry on Anthropic recovery.
 */
export function streamTextWithFallback(opts: AnyOpts): ReturnType<typeof streamText> {
  try {
    return streamText({ model: gateway(CLAUDE_MODEL), ...opts } as any);
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    logFallback('streamText', err);
    return streamText({ model: minimax(MINIMAX_CHAT_MODEL), ...opts } as any);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
