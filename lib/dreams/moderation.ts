/**
 * Lightweight handle blocklist — used for both client-side pre-validation
 * AND server-side authoritative checks. Keep this list public-safe; it's
 * shipped to the browser by the HandleEditor component.
 *
 * This is intentionally minimal — it catches the most obvious slurs and
 * brand spoofs. The real moderation gate for *dream content* is in the
 * Claude scoring prompt, which produces a `moderation: { ok, flags }` object.
 */

const BLOCKLIST = [
  // slurs (substring match, case-insensitive — leetspeak variants caught by collapse step)
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'kike',
  'spic',
  'chink',
  // brand spoofing
  'admin',
  'mod',
  'official',
  'staff',
  'support',
  'dreamweaver',
  'system',
  'team',
  // generic abuse
  'rape',
  'kill',
  'nazi',
  'hitler',
];

/** Strip leet substitutions and non-alphanumerics so e.g. "f.u.c.k1" → "fuck". */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z]/g, '');
}

export interface HandleValidation {
  ok: boolean;
  reason?: string;
}

/**
 * Validates a user-submitted handle. Returns `{ ok: false, reason }` if
 * the handle violates length, charset, or content rules.
 *
 * Rules:
 * - 3–20 characters
 * - alphanumerics, dot, underscore, hyphen only (display) — auto-handle "Dreamer #A4F2" excluded by length+charset
 * - no whitespace
 * - not in the blocklist (substring, normalised)
 */
export function validateHandle(handle: string): HandleValidation {
  const raw = handle.trim();
  if (raw.length < 3) return { ok: false, reason: 'Handle must be at least 3 characters.' };
  if (raw.length > 20) return { ok: false, reason: 'Handle must be 20 characters or fewer.' };
  if (!/^[A-Za-z0-9._-]+$/.test(raw)) {
    return { ok: false, reason: 'Letters, numbers, dot, underscore, hyphen only.' };
  }
  const flat = normalise(raw);
  for (const bad of BLOCKLIST) {
    if (flat.includes(bad)) return { ok: false, reason: 'That handle isn\u2019t available.' };
  }
  return { ok: true };
}
