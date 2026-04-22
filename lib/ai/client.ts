import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const gateway = (model: string) => {
  // Strip "anthropic/" prefix if present (was used for gateway routing)
  const modelId = model.replace(/^anthropic\//, '');
  return anthropic(modelId);
};

export const CLAUDE_MODEL = 'anthropic/claude-sonnet-4-6';
