import { compactInput, runReplicateModel } from './replicate';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_RESOLUTION,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

export const seedance2FastProvider: VideoProvider = {
  id: 'seedance-2-fast',
  modelLabel: 'Seedance 2.0 Fast',
  supportsDuration(seconds: number) {
    return seconds >= 1 && seconds <= 15;
  },
  generate(scenePrompt: string, opts: VideoGenOpts = {}) {
    return runReplicateModel('bytedance/seedance-2.0-fast', compactInput({
      prompt: scenePrompt,
      duration: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
      resolution: opts.resolution === '1080p' ? DEFAULT_RESOLUTION : (opts.resolution ?? DEFAULT_RESOLUTION),
      aspect_ratio: opts.aspectRatio ?? DEFAULT_ASPECT_RATIO,
      generate_audio: false,
    }));
  },
};
