/**
 * ISO-week helpers — week starts Monday 00:00 UTC.
 * Format: "YYYY-Www" (zero-padded week number, e.g. "2026-W04").
 *
 * We compute everything in UTC so weekly leaderboard rollovers happen at
 * the same instant globally regardless of the server's clock zone.
 */

export function isoWeekKey(d: Date | number = Date.now()): string {
  const date = new Date(d);
  // Copy and normalise to UTC midnight.
  const utc = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  // Per ISO-8601: the ISO week year is the Thursday of the same week.
  // Jump to that Thursday: weekday 1=Mon … 7=Sun, push from current day to Thursday.
  const day = utc.getUTCDay() || 7;       // Sun → 7, Mon → 1
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const isoYear = utc.getUTCFullYear();
  // Week 1 contains Jan 4 (always). Days from Jan 1 of isoYear → Thursday.
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNo = Math.ceil(
    (((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7,
  );
  return `${isoYear}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns the Monday 00:00 UTC of the ISO week containing `d`.
 */
export function isoWeekStart(d: Date | number = Date.now()): Date {
  const date = new Date(d);
  const utc = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  const day = utc.getUTCDay() || 7;       // Sun → 7
  utc.setUTCDate(utc.getUTCDate() - (day - 1));
  return utc;
}

/**
 * Returns ms remaining until the next ISO-week boundary (next Monday 00:00 UTC).
 */
export function msUntilNextIsoWeek(d: Date | number = Date.now()): number {
  const start = isoWeekStart(d).getTime();
  const next = start + 7 * 24 * 60 * 60 * 1000;
  return next - (typeof d === 'number' ? d : d.getTime());
}

/**
 * Human-readable date range for the ISO week containing `d`,
 * e.g. "Apr 27 – May 3".
 */
export function formatIsoWeekRange(d: Date | number = Date.now()): string {
  const start = isoWeekStart(d);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  return `${fmt(start)} – ${fmt(end)}`;
}
