import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nextInterviewStep, InterviewTurn } from '@/lib/ai/interview';

const Body = z.object({
  history: z.array(
    z.object({ role: z.enum(['user', 'assistant']), content: z.string() }),
  ),
  questionsAsked: z.number().int().min(0).max(10),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const { history, questionsAsked } = parsed.data;
  try {
    const result = await nextInterviewStep(
      history as InterviewTurn[],
      questionsAsked,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'interview failed' }, { status: 500 });
  }
}
