import { describe, it, expect } from 'vitest';
import { parseInterviewOutput, shouldStopInterview } from '@/lib/ai/interview';

describe('parseInterviewOutput', () => {
  it('returns done:true for <DONE> token', () => {
    expect(parseInterviewOutput('<DONE>')).toEqual({ done: true });
    expect(parseInterviewOutput('  <DONE>  ')).toEqual({ done: true });
    expect(parseInterviewOutput('done')).not.toEqual({ done: true });
  });

  it('returns question for a question output', () => {
    expect(parseInterviewOutput('What color was the sky?')).toEqual({
      done: false,
      question: 'What color was the sky?',
    });
  });
});

describe('shouldStopInterview', () => {
  it('stops after 4 questions regardless of model', () => {
    expect(shouldStopInterview(4)).toBe(true);
    expect(shouldStopInterview(3)).toBe(false);
  });
});
