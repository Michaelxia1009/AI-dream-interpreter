import { compactInput, runReplicateModel } from './replicate';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_RESOLUTION,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

export const seedanceLiteProvider: VideoProvider = {
  id: 'seedance-lite',
  modelLabel: 'Seedance 1 Lite',
  supportsDuration: supportsCommonDuration,
  generate(scenePrompt: string, opts: VideoGenOpts = {}) {
    return runReplicateModel('bytedance/seedance-1-lite', compactInput({
      prompt: scenePrompt,
      duration: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
      resolution: opts.resolution ?? DEFAULT_RESOLUTION,
      aspect_ratio: opts.aspectRatio ?? DEFAULT_ASPECT_RATIO,
      negative_prompt: opts.negativePrompt,
    }));
  },
};

function supportsCommonDuration(seconds: number): boolean {
  return seconds >= 5 && seconds <= 10;
}
