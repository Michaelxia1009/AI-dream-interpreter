import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_DURATION_SECONDS,
  getDefaultVideoProviderId,
  getVideoProvider,
  selectVideoProvider,
} from '@/lib/providers/video';

const originalVideoProvider = process.env.VIDEO_PROVIDER;

afterEach(() => {
  process.env.VIDEO_PROVIDER = originalVideoProvider;
});

describe('video provider defaults', () => {
  it('uses Seedance 2.0 Fast as the default 10-second provider', () => {
    delete process.env.VIDEO_PROVIDER;

    expect(DEFAULT_DURATION_SECONDS).toBe(10);
    expect(getDefaultVideoProviderId()).toBe('seedance-2-fast');
    expect(selectVideoProvider().id).toBe('seedance-2-fast');
    expect(getVideoProvider('seedance-2-fast').modelLabel).toBe('Seedance 2.0 Fast');
    expect(getVideoProvider('seedance-2-fast').usesNativeAudio).toBe(true);
  });

  it('allows Seedance 2.0 Fast durations up to 15 seconds', () => {
    const seedance = getVideoProvider('seedance-2-fast');

    expect(seedance.supportsDuration(10)).toBe(true);
    expect(seedance.supportsDuration(15)).toBe(true);
    expect(seedance.supportsDuration(16)).toBe(false);
  });
});
