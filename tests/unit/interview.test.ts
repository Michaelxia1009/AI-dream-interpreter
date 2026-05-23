import { describe, it, expect } from 'vitest';
import { normalizeQuestion, shouldStopInterview } from '@/lib/ai/interview';

describe('normalizeQuestion', () => {
  it('deduplicates and trims structured chip options', () => {
    expect(normalizeQuestion({
      text: ' What did the spaceship look like inside? ',
      category: 'environment',
      selectionMode: 'one',
      options: [
        ' cold white corridors ',
        'cold white corridors',
        'a dim capsule',
        'warm amber cabin',
        'glass dome',
      ],
    })).toEqual({
      text: 'What did the spaceship look like inside?',
      category: 'environment',
      selectionMode: 'one',
      options: [
        'cold white corridors',
        'a dim capsule',
        'warm amber cabin',
        'glass dome',
      ],
    });
  });

  it('pads underfilled option lists so the chip UI has enough choices', () => {
    const question = normalizeQuestion({
      text: 'What color dominated the dream?',
      category: 'color',
      selectionMode: 'many',
      options: ['red', 'blue'],
    });

    expect(question.options).toHaveLength(4);
    expect(question.options.slice(0, 2)).toEqual(['red', 'blue']);
  });
});

describe('shouldStopInterview', () => {
  it('stops after 5 structured questions regardless of model', () => {
    expect(shouldStopInterview(5)).toBe(true);
    expect(shouldStopInterview(4)).toBe(false);
  });
});
