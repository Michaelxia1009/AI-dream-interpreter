import { generateText } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gateway, CLAUDE_MODEL } from './client';

const MAX_QUESTIONS = 4;

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/interview.system.md'),
  'utf8',
);

export interface InterviewTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewStepResult {
  done: boolean;
  question?: string;
}

export function parseInterviewOutput(raw: string): InterviewStepResult {
  const trimmed = raw.trim();
  if (trimmed === '<DONE>') return { done: true };
  return { done: false, question: trimmed };
}

export function shouldStopInterview(questionsAsked: number): boolean {
  return questionsAsked >= MAX_QUESTIONS;
}

export async function nextInterviewStep(
  history: InterviewTurn[],
  questionsAsked: number,
): Promise<InterviewStepResult> {
  if (shouldStopInterview(questionsAsked)) return { done: true };

  const { text } = await generateText({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    messages: history,
    maxOutputTokens: 80,
    temperature: 0.8,
  });
  return parseInterviewOutput(text);
}

export function compileEnrichedDream(history: InterviewTurn[]): string {
  return history
    .map(t => (t.role === 'user' ? `USER: ${t.content}` : `Q: ${t.content}`))
    .join('\n');
}
