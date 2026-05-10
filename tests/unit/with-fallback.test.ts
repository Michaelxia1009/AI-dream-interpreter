import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the underlying AI SDK calls. We track invocations to assert which
// model the wrapper called (Claude vs MiniMax) by inspecting the `model`
// field on each call.
const generateObjectMock = vi.fn();
const generateTextMock = vi.fn();
const streamTextMock = vi.fn();

vi.mock('ai', () => ({
  generateObject: (opts: { model: { modelId?: string; provider?: string } }) =>
    generateObjectMock(opts),
  generateText: (opts: { model: { modelId?: string; provider?: string } }) =>
    generateTextMock(opts),
  streamText: (opts: { model: { modelId?: string; provider?: string } }) =>
    streamTextMock(opts),
}));

// Import AFTER the vi.mock declarations so the wrapper picks up the mocks.
import {
  generateObjectWithFallback,
  generateTextWithFallback,
  streamTextWithFallback,
} from '@/lib/ai/with-fallback';

const ORIGINAL_KEY = process.env.MINIMAX_API_KEY;

beforeEach(() => {
  generateObjectMock.mockReset();
  generateTextMock.mockReset();
  streamTextMock.mockReset();
  process.env.MINIMAX_API_KEY = 'test-key';
});

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.MINIMAX_API_KEY;
  else process.env.MINIMAX_API_KEY = ORIGINAL_KEY;
});

describe('generateObjectWithFallback', () => {
  it('returns the primary result when Claude succeeds (no fallback)', async () => {
    generateObjectMock.mockResolvedValueOnce({ object: { ok: 1 } });
    const result = await generateObjectWithFallback({ system: 's', prompt: 'p' });
    expect(result).toEqual({ object: { ok: 1 } });
    expect(generateObjectMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to MiniMax when Claude throws', async () => {
    generateObjectMock
      .mockRejectedValueOnce(new Error('anthropic 503'))
      .mockResolvedValueOnce({ object: { ok: 'from-minimax' } });
    const result = await generateObjectWithFallback({ system: 's', prompt: 'p' });
    expect(result).toEqual({ object: { ok: 'from-minimax' } });
    expect(generateObjectMock).toHaveBeenCalledTimes(2);
    // Second call's model should be the MiniMax one (different from Claude).
    const firstModel = generateObjectMock.mock.calls[0][0].model;
    const secondModel = generateObjectMock.mock.calls[1][0].model;
    expect(secondModel).not.toBe(firstModel);
  });

  it('does NOT fall back on AbortError', async () => {
    const abortErr = new Error('user cancelled');
    abortErr.name = 'AbortError';
    generateObjectMock.mockRejectedValueOnce(abortErr);
    await expect(generateObjectWithFallback({ prompt: 'p' })).rejects.toBe(abortErr);
    expect(generateObjectMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT fall back when MINIMAX_API_KEY is unset', async () => {
    delete process.env.MINIMAX_API_KEY;
    const err = new Error('anthropic timeout');
    generateObjectMock.mockRejectedValueOnce(err);
    await expect(generateObjectWithFallback({ prompt: 'p' })).rejects.toBe(err);
    expect(generateObjectMock).toHaveBeenCalledTimes(1);
  });
});

describe('generateTextWithFallback', () => {
  it('falls back to MiniMax when Claude throws', async () => {
    generateTextMock
      .mockRejectedValueOnce(new Error('anthropic 500'))
      .mockResolvedValueOnce({ text: 'from minimax' });
    const result = await generateTextWithFallback({ prompt: 'p' });
    expect(result).toEqual({ text: 'from minimax' });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it('returns primary when Claude succeeds', async () => {
    generateTextMock.mockResolvedValueOnce({ text: 'from claude' });
    const result = await generateTextWithFallback({ prompt: 'p' });
    expect(result).toEqual({ text: 'from claude' });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });
});

describe('streamTextWithFallback', () => {
  it('falls back to MiniMax when Claude throws synchronously at setup', () => {
    streamTextMock
      .mockImplementationOnce(() => { throw new Error('claude setup error'); })
      .mockReturnValueOnce({ textStream: 'mock-stream' });
    const result = streamTextWithFallback({ prompt: 'p' });
    expect(result).toEqual({ textStream: 'mock-stream' });
    expect(streamTextMock).toHaveBeenCalledTimes(2);
  });

  it('returns primary when Claude setup succeeds', () => {
    streamTextMock.mockReturnValueOnce({ textStream: 'claude-stream' });
    const result = streamTextWithFallback({ prompt: 'p' });
    expect(result).toEqual({ textStream: 'claude-stream' });
    expect(streamTextMock).toHaveBeenCalledTimes(1);
  });
});
