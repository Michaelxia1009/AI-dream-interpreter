'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { ChatThread } from '@/components/ChatThread';
import { MicButton } from '@/components/MicButton';
import { PageShell, GlassPanel, Button } from '@/components/ui';
import {
  useDream,
  type InterviewTurn,
  type InterviewCategory,
  type InterviewQuestionMeta,
} from '@/lib/state';
import { toast } from 'sonner';

const OPENING: InterviewTurn = {
  role: 'assistant',
  content: 'What did you dream about?',
};

const MOODS = [
  { value: 'peaceful', label: 'Peaceful', glyph: 'moon' },
  { value: 'anxious', label: 'Anxious', glyph: 'spiral' },
  { value: 'joyful', label: 'Joyful', glyph: 'spark' },
  { value: 'strange', label: 'Strange', glyph: 'mirror' },
  { value: 'scary', label: 'Scary', glyph: 'shadow' },
  { value: 'sad', label: 'Sad', glyph: 'rain' },
];

const DREAM_TYPES = ['normal', 'nightmare', 'recurring', 'prophetic'] as const;

const CATEGORY_LABELS: Record<InterviewCategory, string> = {
  figuresAppearance: 'FIGURES & APPEARANCE',
  environment: 'ENVIRONMENT',
  emotion: 'EMOTION',
  lighting: 'LIGHTING',
  motion: 'MOTION',
  color: 'COLOR',
  keyObject: 'KEY OBJECT',
  sound: 'SOUND',
  twist: 'TWIST',
};

function buildEnrichedDream(
  turns: InterviewTurn[],
  mood: string,
  dreamType: string,
): string {
  const initialUser = turns.find(t => t.role === 'user' && !t.answeredCategory);
  const labeled = turns
    .filter(t => t.role === 'user' && t.answeredCategory)
    .map(t => `${CATEGORY_LABELS[t.answeredCategory!]}: ${t.content}`);
  const lines: string[] = [];
  lines.push('INITIAL DREAM:');
  lines.push(initialUser?.content ?? '');
  lines.push('');
  lines.push(`MOOD: ${mood}`);
  lines.push(`DREAM TYPE: ${dreamType}`);
  if (labeled.length) {
    lines.push('');
    lines.push(...labeled);
  }
  return lines.join('\n');
}

export default function CapturePage() {
  const router = useRouter();
  const { session, isHydrated, update, reset } = useDream();
  const initialTurns = session.enrichedDream
    ? [OPENING]
    : session.history.length
      ? session.history
      : [OPENING];
  const [turns, setTurns] = useState<InterviewTurn[]>(initialTurns);
  const [dreamText, setDreamText] = useState('');
  const [mood, setMood] = useState('peaceful');
  const [dreamType, setDreamType] = useState<(typeof DREAM_TYPES)[number]>('normal');
  const [sleepy, setSleepy] = useState(true);
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [qCount, setQCount] = useState(
    initialTurns.filter(t => t.role === 'assistant').length || 1,
  );
  const [done, setDone] = useState(false);
  const initialized = useRef(false);

  const hasStartedInterview = useMemo(
    () => turns.some(t => t.role === 'user'),
    [turns],
  );

  // The most recent assistant turn that carries chip metadata AND is unanswered.
  const pendingQuestionTurn = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.role !== 'assistant' || !t.question) continue;
      const hasUserAfter = turns.slice(i + 1).some(x => x.role === 'user');
      if (!hasUserAfter) return t;
      return null;
    }
    return null;
  }, [turns]);

  useEffect(() => {
    if (!isHydrated) return;
    if (initialized.current) return;
    initialized.current = true;
    if (session.enrichedDream) reset();
  }, [session.enrichedDream, isHydrated, reset]);

  async function callInterview(nextTurns: InterviewTurn[], nextQCount: number) {
    setPending(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // Server only needs role/content; strip UI metadata.
          history: nextTurns.map(t => ({ role: t.role, content: t.content })),
          questionsAsked: nextQCount,
        }),
      });
      if (!res.ok) throw new Error('interview failed');
      const data = await res.json();
      if (data.done) {
        const enrichedDream = buildEnrichedDream(nextTurns, mood, dreamType);
        setDone(true);
        update({ history: nextTurns, enrichedDream });
        setTurns([
          ...nextTurns,
          { role: 'assistant', content: 'Got it — let us bring your dream to life.' },
        ]);
        setTimeout(() => router.push('/format'), 1400);
      } else {
        const q = data.question as {
          text: string;
          category: InterviewCategory;
          selectionMode: 'one' | 'many';
          options: string[];
        };
        const meta: InterviewQuestionMeta = {
          category: q.category,
          selectionMode: q.selectionMode,
          options: q.options,
        };
        setQCount(qc => qc + 1);
        setTurns([
          ...nextTurns,
          { role: 'assistant', content: q.text, question: meta },
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  }

  // Initial dream submission (free text).
  async function submitInitialDream() {
    const clean = dreamText.trim();
    if (!clean || pending) return;
    const nextTurns: InterviewTurn[] = [
      ...turns,
      { role: 'user', content: clean },
    ];
    setTurns(nextTurns);
    setDreamText('');
    await callInterview(nextTurns, qCount);
  }

  // Chip-or-Other answer to a structured question.
  async function submitChoice(values: string[], isFreeText: boolean) {
    if (!pendingQuestionTurn || pending) return;
    const cleaned = values.map(v => v.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    const content = cleaned.join(', ');
    const category = pendingQuestionTurn.question!.category;
    const nextTurns: InterviewTurn[] = [
      ...turns,
      {
        role: 'user',
        content,
        answeredCategory: category,
        isFreeText,
      },
    ];
    setTurns(nextTurns);
    await callInterview(nextTurns, qCount);
  }

  return (
    <PageShell
      width="narrow"
      className={sleepy ? 'brightness-90 saturate-[0.85]' : ''}
    >
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1">Tell the night</h1>
          <p className="mt-2 text-lg italic text-muted-foreground">
            Capture it before it fades.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSleepy(s => !s)}
          className="rounded-full border border-border/50 bg-card/30 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          {sleepy ? 'Sleepy mode' : 'Awake mode'}
        </button>
      </header>

      <GlassPanel size="md" className="capture-panel sm:p-7">
        {!hasStartedInterview && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-background/25 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Voice input</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {recording ? 'Listening... tap again to stop.' : 'Optional: dictate your dream.'}
              </p>
            </div>
            <MicButton
              onTranscript={t => setDreamText(prev => prev ? `${prev} ${t}` : t)}
              onRecordingChange={setRecording}
              disabled={pending || done}
            />
          </div>
        )}

        {!hasStartedInterview && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="dream" className="text-sm text-muted-foreground">
                The dream
              </label>
              <textarea
                id="dream"
                value={dreamText}
                onChange={e => setDreamText(e.target.value)}
                placeholder="I was walking through a forest of mirrors..."
                className="min-h-52 w-full resize-y appearance-none rounded-2xl border border-border/50 px-4 py-4 font-serif text-lg leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring/70 focus:ring-4 focus:ring-ring/20"
                style={{ backgroundColor: 'var(--dw-textbox-bg)' }}
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">How did it feel?</p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(item => (
                  <Button
                    key={item.value}
                    variant="secondary"
                    size="sm"
                    onClick={() => setMood(item.value)}
                    className={
                      mood === item.value
                        ? 'border-ring/60 bg-ring/20 text-foreground shadow-[0_0_24px_rgba(167,139,250,0.22)]'
                        : ''
                    }
                  >
                    <span className="mr-1.5 text-[11px] uppercase tracking-[0.12em]">{item.glyph}</span>
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Dream type</p>
              <div className="flex flex-wrap gap-2">
                {DREAM_TYPES.map(type => (
                  <Button
                    key={type}
                    variant="secondary"
                    size="sm"
                    onClick={() => setDreamType(type)}
                    className={`capitalize ${
                      dreamType === type
                        ? 'border-fuchsia-300/50 bg-fuchsia-300/15 text-foreground'
                        : ''
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasStartedInterview && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-border/40 bg-background/25">
            <ChatThread
              turns={turns}
              pending={pending}
              onAnswer={submitChoice}
            />
          </div>
        )}

        <div className="mt-6">
          {done ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/format')}
              className="w-full"
            >
              Continue
            </Button>
          ) : !hasStartedInterview ? (
            <Button
              variant="primary"
              size="lg"
              onClick={submitInitialDream}
              disabled={pending || !dreamText.trim()}
              className="mx-auto w-full max-w-md"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Continue
            </Button>
          ) : null}
        </div>
      </GlassPanel>

      <p className="mx-auto mt-5 max-w-xl text-center text-[11px] text-muted-foreground/80">
        Public on the leaderboard by default — easy to toggle off after generation.
      </p>
    </PageShell>
  );
}
