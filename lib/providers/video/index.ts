import { hailuoProvider } from './hailuo';
import { klingTurboProvider } from './kling-turbo';
import { seedance2FastProvider } from './seedance-2-fast';
import { seedanceLiteProvider } from './seedance-lite';
import { seedanceProProvider } from './seedance-pro';
import {
  DEFAULT_DURATION_SECONDS,
  isVideoProviderId,
  type VideoGenOpts,
  type VideoProvider,
  type VideoProviderId,
} from './types';
import { wan25Provider } from './wan25';

export * from './types';

export const VIDEO_PROVIDERS = [
  seedance2FastProvider,
  hailuoProvider,
  wan25Provider,
  seedanceProProvider,
  seedanceLiteProvider,
  klingTurboProvider,
] as const satisfies readonly VideoProvider[];

const PROVIDERS_BY_ID = new Map<VideoProviderId, VideoProvider>(
  VIDEO_PROVIDERS.map(provider => [provider.id as VideoProviderId, provider]),
);

export function getDefaultVideoProviderId(): VideoProviderId {
  return isVideoProviderId(process.env.VIDEO_PROVIDER)
    ? process.env.VIDEO_PROVIDER
    : 'seedance-2-fast';
}

export function getVideoProvider(id: VideoProviderId): VideoProvider {
  return PROVIDERS_BY_ID.get(id) ?? seedance2FastProvider;
}

export function selectVideoProvider({
  requestedId,
  allowRequestOverride,
  durationSeconds = DEFAULT_DURATION_SECONDS,
}: {
  requestedId?: string | null;
  allowRequestOverride?: boolean;
  durationSeconds?: number;
} = {}): VideoProvider {
  const requestedProvider = allowRequestOverride && isVideoProviderId(requestedId)
    ? getVideoProvider(requestedId)
    : null;
  const envProvider = getVideoProvider(getDefaultVideoProviderId());
  const provider = requestedProvider ?? envProvider;

  if (provider.supportsDuration(durationSeconds)) return provider;
  if (envProvider.supportsDuration(durationSeconds)) return envProvider;
  return seedance2FastProvider;
}

export async function generateVideo(prompt: string, opts: VideoGenOpts = {}): Promise<Buffer> {
  const durationSeconds = opts.durationSeconds ?? DEFAULT_DURATION_SECONDS;
  const provider = selectVideoProvider({ durationSeconds });
  return provider.generate(prompt, { ...opts, durationSeconds });
}
