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
  it('uses Luma Ray Flash 2 720p as the default 9-second provider', () => {
    delete process.env.VIDEO_PROVIDER;

    expect(DEFAULT_DURATION_SECONDS).toBe(9);
    expect(getDefaultVideoProviderId()).toBe('luma-720p');
    expect(selectVideoProvider().id).toBe('luma-720p');
    expect(getVideoProvider('luma-720p').modelLabel).toBe('Luma Ray Flash 2 720p');
  });

  it('only allows supported Luma durations', () => {
    const luma = getVideoProvider('luma-720p');

    expect(luma.supportsDuration(9)).toBe(true);
    expect(luma.supportsDuration(5)).toBe(true);
    expect(luma.supportsDuration(10)).toBe(false);
  });
});
