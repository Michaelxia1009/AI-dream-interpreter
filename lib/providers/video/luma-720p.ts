import { compactInput, runReplicateModel } from './replicate';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION_SECONDS,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

export const luma720pProvider: VideoProvider = {
  id: 'luma-720p',
  modelLabel: 'Luma Ray Flash 2 720p',
  supportsDuration(seconds: number) {
    return seconds === 5 || seconds === 9;
  },
  generate(scenePrompt: string, opts: VideoGenOpts = {}) {
    return runReplicateModel('luma/ray-flash-2-720p', compactInput({
      prompt: scenePrompt,
      duration: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
      aspect_ratio: opts.aspectRatio ?? DEFAULT_ASPECT_RATIO,
      loop: false,
    }));
  },
};
