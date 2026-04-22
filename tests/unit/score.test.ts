import { describe, it, expect } from 'vitest';
import { ScoreResultSchema } from '@/lib/ai/score';

describe('ScoreResultSchema', () => {
  it('accepts a valid payload', () => {
    const payload = {
      metrics: {
        weirdness: { score: 8, oneLiner: 'Mildly feral.' },
        imagination: { score: 7, oneLiner: 'Inspired.' },
        emotionalIntensity: { score: 5, oneLiner: 'Moderate.' },
        vividness: { score: 9, oneLiner: 'HD dreamspace.' },
      },
      matchedStyleIds: ['ghibli-dream', 'watercolor-memory', 'vaporwave'],
    };
    expect(() => ScoreResultSchema.parse(payload)).not.toThrow();
  });

  it('rejects out-of-range score', () => {
    const bad = {
      metrics: {
        weirdness: { score: 11, oneLiner: 'x' },
        imagination: { score: 7, oneLiner: 'x' },
        emotionalIntensity: { score: 5, oneLiner: 'x' },
        vividness: { score: 9, oneLiner: 'x' },
      },
      matchedStyleIds: ['a', 'b', 'c'],
    };
    expect(() => ScoreResultSchema.parse(bad)).toThrow();
  });

  it('rejects wrong number of matched ids', () => {
    const bad = {
      metrics: {
        weirdness: { score: 8, oneLiner: 'x' },
        imagination: { score: 7, oneLiner: 'x' },
        emotionalIntensity: { score: 5, oneLiner: 'x' },
        vividness: { score: 9, oneLiner: 'x' },
      },
      matchedStyleIds: ['a', 'b'],
    };
    expect(() => ScoreResultSchema.parse(bad)).toThrow();
  });
});
