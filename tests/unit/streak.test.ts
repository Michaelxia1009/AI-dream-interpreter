import { describe, expect, it } from 'vitest';
import { computeStreakInfo, nextMilestone } from '@/lib/dreams/streak';

const day = (iso: string) => Date.parse(`${iso}T12:00:00.000Z`);
const now = day('2026-05-01');

describe('computeStreakInfo', () => {
  it('returns empty streak for no dreams', () => {
    expect(computeStreakInfo([], { nowMs: now })).toEqual({
      current: 0,
      longest: 0,
      totalDreams: 0,
      dreamtToday: false,
      nextMilestone: 3,
    });
  });

  it('counts a today-only streak', () => {
    expect(computeStreakInfo([{ createdAt: now }], { nowMs: now })).toMatchObject({
      current: 1,
      longest: 1,
      totalDreams: 1,
      dreamtToday: true,
      nextMilestone: 3,
    });
  });

  it('continues a streak from yesterday when today is empty', () => {
    const result = computeStreakInfo([
      { createdAt: day('2026-04-29') },
      { createdAt: day('2026-04-30') },
    ], { nowMs: now });
    expect(result.current).toBe(2);
    expect(result.dreamtToday).toBe(false);
  });

  it('breaks the current streak after a gap', () => {
    const result = computeStreakInfo([
      { createdAt: day('2026-04-27') },
      { createdAt: day('2026-04-28') },
    ], { nowMs: now });
    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);
  });

  it('finds the longest streak across old runs', () => {
    const result = computeStreakInfo([
      { createdAt: day('2026-04-20') },
      { createdAt: day('2026-04-21') },
      { createdAt: day('2026-04-22') },
      { createdAt: day('2026-04-28') },
      { createdAt: day('2026-04-30') },
    ], { nowMs: now });
    expect(result.current).toBe(1);
    expect(result.longest).toBe(3);
  });

  it('selects the next milestone boundary', () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(3)).toBe(7);
    expect(nextMilestone(365)).toBe(465);
  });
});
