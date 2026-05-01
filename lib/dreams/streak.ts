import type { DreamRecord } from './types';

export interface StreakInfo {
  current: number;
  longest: number;
  totalDreams: number;
  dreamtToday: boolean;
  nextMilestone: number;
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];
const DAY_MS = 24 * 60 * 60 * 1000;

export function nextMilestone(current: number): number {
  return MILESTONES.find(m => m > current) ?? current + 100;
}

function utcDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return utcDayKey(Date.UTC(y, m - 1, d + days));
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((bMs - aMs) / DAY_MS);
}

export function computeStreakInfo(
  dreams: Pick<DreamRecord, 'createdAt'>[],
  opts: { nowMs?: number } = {},
): StreakInfo {
  if (dreams.length === 0) {
    return {
      current: 0,
      longest: 0,
      totalDreams: 0,
      dreamtToday: false,
      nextMilestone: 3,
    };
  }

  const dates = Array.from(new Set(dreams.map(d => utcDayKey(d.createdAt))))
    .sort();
  const dateSet = new Set(dates);
  const todayKey = utcDayKey(opts.nowMs ?? Date.now());
  const yesterdayKey = addDays(todayKey, -1);
  const latestKey = dates[dates.length - 1];
  const dreamtToday = dateSet.has(todayKey);

  let current = 0;
  if (latestKey === todayKey || latestKey === yesterdayKey) {
    let cursor = latestKey;
    while (dateSet.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      run += 1;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);

  return {
    current,
    longest,
    totalDreams: dreams.length,
    dreamtToday,
    nextMilestone: nextMilestone(current),
  };
}

export function isMilestone(n: number): boolean {
  return MILESTONES.includes(n);
}
