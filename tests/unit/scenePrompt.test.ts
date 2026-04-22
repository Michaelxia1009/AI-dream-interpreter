import { describe, it, expect } from 'vitest';
import { CarouselPromptsSchema, VideoPromptSchema } from '@/lib/ai/scenePrompt';

describe('scene prompt schemas', () => {
  it('carousel accepts 4-6 prompts', () => {
    expect(() =>
      CarouselPromptsSchema.parse({ prompts: ['scene one here', 'scene two here', 'scene three here', 'scene four here'] }),
    ).not.toThrow();
    expect(() => CarouselPromptsSchema.parse({ prompts: ['scene one here'] })).toThrow();
    expect(() =>
      CarouselPromptsSchema.parse({ prompts: Array(7).fill('a valid scene prompt') }),
    ).toThrow();
  });

  it('video accepts one prompt', () => {
    expect(() => VideoPromptSchema.parse({ prompt: 'a scene' })).not.toThrow();
    expect(() => VideoPromptSchema.parse({})).toThrow();
  });
});
