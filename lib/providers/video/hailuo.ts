import { compactInput, runReplicateModel } from './replicate';
import {
  DEFAULT_DURATION_SECONDS,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

export const hailuoProvider: VideoProvider = {
  id: 'hailuo',
  modelLabel: 'MiniMax Hailuo 2.3',
  supportsDuration: supportsCommonDuration,
  generate(scenePrompt: string, opts: VideoGenOpts = {}) {
    return runReplicateModel('minimax/hailuo-2.3', compactInput({
      prompt: scenePrompt,
      duration: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
      resolution: opts.resolution === '1080p' ? '1080p' : '768p',
      prompt_optimizer: true,
    }));
  },
};

function supportsCommonDuration(seconds: number): boolean {
  return seconds >= 5 && seconds <= 10;
}
