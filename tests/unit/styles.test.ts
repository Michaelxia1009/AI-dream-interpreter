import { describe, it, expect } from 'vitest';
import { STYLES, getStyleById, listStyleIds } from '@/lib/styles';

describe('style library', () => {
  it('exports exactly 10 styles', () => {
    expect(STYLES).toHaveLength(10);
  });

  it('every style has required fields', () => {
    for (const s of STYLES) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
      expect(s.name).toBeTruthy();
      expect(s.vibe).toBeTruthy();
      expect(s.imagePromptSuffix).toBeTruthy();
      expect(s.narratorVoiceId).toMatch(/^elv_/);
      expect(s.narratorPersona).toBeTruthy();
      expect(Array.isArray(s.moodTags)).toBe(true);
      expect(s.moodTags.length).toBeGreaterThan(0);
    }
  });

  it('all ids unique', () => {
    const ids = STYLES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getStyleById returns correct style', () => {
    expect(getStyleById('ghibli-dream')?.name).toBe('Studio Ghibli Dream');
    expect(getStyleById('nonexistent')).toBeUndefined();
  });

  it('listStyleIds returns all ids', () => {
    expect(listStyleIds()).toEqual(STYLES.map(s => s.id));
  });
});
