/**
 * Video provider abstraction.
 *
 * Every provider is a `{ id, modelLabel, supportsDuration, generate }`
 * tuple registered in `./index.ts`. The bench script and the request
 * router both read from that registry, so adding a new model is a
 * one-file change (the adapter) plus a one-line registry edit.
 *
 * Product rule: every provider that ships in the bench must support
 * the app's default short-clip duration. The request router falls back
 * to the env/default provider if the requested one fails that gate.
 */

export const VIDEO_PROVIDER_IDS = [
  'seedance-2-fast',
  'hailuo',
  'wan25',
  'seedance-pro',
  'seedance-lite',
  'kling-turbo',
] as const;

export type VideoProviderId = typeof VIDEO_PROVIDER_IDS[number];
export type VideoResolution = '720p' | '1080p';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoGenOpts {
  /** Target clip length. Default 10 for the main dream-video experience. */
  durationSeconds?: number;
  resolution?: VideoResolution;
  /** Negative prompt (where supported). Adapters silently ignore if unsupported. */
  negativePrompt?: string;
  aspectRatio?: VideoAspectRatio;
  /** Narration to fold into prompts for providers with native audio generation. */
  narrationText?: string;
}

export interface VideoProvider {
  /** Stable id used for env vars + ?provider=<id> + bench rows. Lowercase. */
  id: string;
  /** Human-readable label for bench reports. */
  modelLabel: string;
  /** Capability gate. Must return true for any seconds value the bench will pass. */
  supportsDuration(seconds: number): boolean;
  /** True when the returned MP4 is expected to include its own audio track. */
  usesNativeAudio?: boolean;
  /** Run the model and return the raw MP4 bytes. */
  generate(scenePrompt: string, opts?: VideoGenOpts): Promise<Buffer>;
}

export const DEFAULT_DURATION_SECONDS = 10;
export const DEFAULT_RESOLUTION: VideoResolution = '720p';
export const DEFAULT_ASPECT_RATIO: VideoAspectRatio = '9:16';

export function isVideoProviderId(value: string | null | undefined): value is VideoProviderId {
  return VIDEO_PROVIDER_IDS.includes(value as VideoProviderId);
}
