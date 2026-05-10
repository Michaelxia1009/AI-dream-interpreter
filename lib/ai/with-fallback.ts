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

// AI SDK v6 has multiple overloads for generateObject/generateText with
// generic schemas; `Parameters<…>` collapses to the most general overload
// and drops `schema`. We accept loose input + return types for the wrapper,
// and let the call sites' zod schemas validate the actual shape downstream.
//
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyOpts = Record<string, any>;
type GenObjReturn = { object: any; finishReason?: any; usage?: any; warnings?: any };
type GenTextReturn = { text: string; finishReason?: any; usage?: any; warnings?: any };

export async function generateObjectWithFallback(opts: AnyOpts): Promise<GenObjReturn> {
  try {
    return (await generateObject({ model: gateway(CLAUDE_MODEL), ...opts } as any)) as GenObjReturn;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    logFallback('generateObject', err);
    return (await generateObject({ model: minimax(MINIMAX_CHAT_MODEL), ...opts } as any)) as GenObjReturn;
  }
}

export async function generateTextWithFallback(opts: AnyOpts): Promise<GenTextReturn> {
  try {
    return (await generateText({ model: gateway(CLAUDE_MODEL), ...opts } as any)) as GenTextReturn;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    logFallback('generateText', err);
    return (await generateText({ model: minimax(MINIMAX_CHAT_MODEL), ...opts } as any)) as GenTextReturn;
  }
}

/**
 * Best-effort streaming fallback. `streamText` returns synchronously, so
 * only synchronous setup errors trigger fallback. Errors during the async
 * stream surface via the caller's existing error path.
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
