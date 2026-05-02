import { describe, it, expect } from 'vitest';
import { CarouselPromptsSchema, VideoPromptSchema } from '@/lib/ai/scenePrompt';

describe('scene prompt schemas', () => {
  it('carousel accepts exactly 5 prompts', () => {
    expect(() =>
      CarouselPromptsSchema.parse({ prompts: Array(5).fill('a valid scene prompt') }),
    ).not.toThrow();
    expect(() => CarouselPromptsSchema.parse({ prompts: Array(4).fill('a valid scene prompt') })).toThrow();
    expect(() => CarouselPromptsSchema.parse({ prompts: Array(6).fill('a valid scene prompt') })).toThrow();
  });

  it('video accepts one prompt', () => {
    expect(() => VideoPromptSchema.parse({ prompt: 'a scene' })).not.toThrow();
    expect(() => VideoPromptSchema.parse({})).toThrow();
  });
});
