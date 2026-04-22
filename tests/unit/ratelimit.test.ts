import { describe, it, expect } from 'vitest';
import { buildRateLimitKey } from '@/lib/ratelimit';

describe('buildRateLimitKey', () => {
  it('combines ip + user agent + fingerprint into stable sha256 prefix', () => {
    const k1 = buildRateLimitKey('1.2.3.4', 'Mozilla/5.0', 'fp-abc');
    const k2 = buildRateLimitKey('1.2.3.4', 'Mozilla/5.0', 'fp-abc');
    expect(k1).toBe(k2);
    expect(k1).toMatch(/^rl:[a-f0-9]{16}$/);
  });

  it('different inputs produce different keys', () => {
    const a = buildRateLimitKey('1.2.3.4', 'ua', 'fp');
    const b = buildRateLimitKey('1.2.3.5', 'ua', 'fp');
    expect(a).not.toBe(b);
  });
});
