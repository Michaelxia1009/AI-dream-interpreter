import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

let _provider: ReturnType<typeof createOpenAICompatible> | null = null;

function getProvider() {
  if (_provider) return _provider;
  _provider = createOpenAICompatible({
    name: 'minimax',
    baseURL: 'https://api.minimax.io/v1',
    apiKey: process.env.MINIMAX_API_KEY,
  });
  return _provider;
}

export const minimax = (model: string) => getProvider()(model);

export const MINIMAX_CHAT_MODEL = 'MiniMax-M2.5';

export function isMiniMaxConfigured(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY);
}
