import { describe, it, expect } from 'vitest';
import {
  shouldStopInterview,
  normalizeQuestion,
  InterviewStepSchema,
} from '@/lib/ai/interview';

describe('shouldStopInterview', () => {
  it('stops at MAX_QUESTIONS (5)', () => {
    expect(shouldStopInterview(5)).toBe(true);
    expect(shouldStopInterview(4)).toBe(false);
    expect(shouldStopInterview(0)).toBe(false);
  });
});

describe('normalizeQuestion', () => {
  it('trims and dedupes options (case-insensitive)', () => {
    const result = normalizeQuestion({
      text: '  Who appeared?  ',
      category: 'figuresAppearance',
      selectionMode: 'many',
      options: ['  a child', 'A Child', 'a tall woman', 'a tall woman', 'a dog', 'birds'],
    });
    expect(result.text).toBe('Who appeared?');
    expect(result.options).toEqual(['a child', 'a tall woman', 'a dog', 'birds']);
  });

  it('truncates excess options to 6', () => {
    const result = normalizeQuestion({
      text: 'Q?',
      category: 'environment',
      selectionMode: 'one',
      options: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    });
    expect(result.options).toHaveLength(6);
    expect(result.options).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('pads under-shot options to 4', () => {
    const result = normalizeQuestion({
      text: 'Q?',
      category: 'emotion',
      selectionMode: 'one',
      options: ['only one'],
    });
    expect(result.options.length).toBeGreaterThanOrEqual(4);
    expect(result.options[0]).toBe('only one');
  });

  it('drops empty/whitespace-only options before evaluating count', () => {
    const result = normalizeQuestion({
      text: 'Q?',
      category: 'emotion',
      selectionMode: 'one',
      options: ['valid', '', '   ', 'also valid'],
    });
    expect(result.options).toContain('valid');
    expect(result.options).toContain('also valid');
    expect(result.options.every(o => o.trim().length > 0)).toBe(true);
  });
});

describe('InterviewStepSchema', () => {
  it('accepts done:true with no question', () => {
    const r = InterviewStepSchema.safeParse({ done: true });
    expect(r.success).toBe(true);
  });

  it('accepts done:false with a valid question', () => {
    const r = InterviewStepSchema.safeParse({
      done: false,
      question: {
        text: 'Who was there?',
        category: 'figuresAppearance',
        selectionMode: 'many',
        options: ['a', 'b', 'c', 'd'],
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects done:false without question', () => {
    const r = InterviewStepSchema.safeParse({ done: false });
    expect(r.success).toBe(false);
  });

  it('rejects fewer than 4 options', () => {
    const r = InterviewStepSchema.safeParse({
      done: false,
      question: {
        text: 'Q?',
        category: 'environment',
        selectionMode: 'one',
        options: ['a', 'b', 'c'],
      },
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown category', () => {
    const r = InterviewStepSchema.safeParse({
      done: false,
      question: {
        text: 'Q?',
        category: 'unknown',
        selectionMode: 'one',
        options: ['a', 'b', 'c', 'd'],
      },
    });
    expect(r.success).toBe(false);
  });
});
