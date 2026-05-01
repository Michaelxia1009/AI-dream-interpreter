import { describe, expect, it } from 'vitest';
import { maskEmail, normalizeEmail, publicAccountState } from '@/lib/dreams/account';

describe('prototype account helpers', () => {
  it('normalizes valid email addresses', () => {
    expect(normalizeEmail('  Dreamer@Example.COM ')).toBe('dreamer@example.com');
  });

  it('rejects invalid email addresses', () => {
    expect(normalizeEmail('not-an-email')).toBeNull();
    expect(normalizeEmail('x@y')).toBeNull();
  });

  it('masks email addresses for profile responses', () => {
    expect(maskEmail('dreamer@example.com')).toBe('dr...@example.com');
    expect(maskEmail('xy@example.com')).toBe('xy@example.com');
  });

  it('returns public claimed and unclaimed states', () => {
    expect(publicAccountState(null)).toEqual({
      claimed: false,
      emailMasked: null,
      displayName: null,
      claimedAt: null,
    });
    expect(publicAccountState({
      email: 'dreamer@example.com',
      displayName: 'Dreamer',
      claimedAt: 123,
    })).toEqual({
      claimed: true,
      emailMasked: 'dr...@example.com',
      displayName: 'Dreamer',
      claimedAt: 123,
    });
  });
});
