import { compactInput, runReplicateModel } from './replicate';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_RESOLUTION,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

export const wan25Provider: VideoProvider = {
  id: 'wan25',
  modelLabel: 'Wan 2.5 T2V 720p',
  supportsDuration: supportsCommonDuration,
  generate(scenePrompt: string, opts: VideoGenOpts = {}) {
    return runReplicateModel('wan-video/wan-2.5-t2v-720p', compactInput({
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
