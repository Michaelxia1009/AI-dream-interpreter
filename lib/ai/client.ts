import { createGateway } from '@ai-sdk/gateway';

export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
});

export const CLAUDE_MODEL = 'anthropic/claude-sonnet-4-6';
