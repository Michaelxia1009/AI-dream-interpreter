import { compactInput, runReplicateModel } from './replicate';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION_SECONDS,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

export const klingTurboProvider: VideoProvider = {
  id: 'kling-turbo',
  modelLabel: 'Kling 2.5 Turbo Pro',
  supportsDuration: supportsCommonDuration,
  generate(scenePrompt: string, opts: VideoGenOpts = {}) {
    return runReplicateModel('kwaivgi/kling-v2.5-turbo-pro', compactInput({
      prompt: scenePrompt,
      duration: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
      aspect_ratio: opts.aspectRatio ?? DEFAULT_ASPECT_RATIO,
      negative_prompt: opts.negativePrompt,
    }));
  },
};

function supportsCommonDuration(seconds: number): boolean {
  return seconds >= 5 && seconds <= 10;
}
