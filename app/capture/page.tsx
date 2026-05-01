'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mic, Sparkles } from 'lucide-react';
import { BreathingOrb } from '@/components/BreathingOrb';
import { ChatThread } from '@/components/ChatThread';
import { MicButton } from '@/components/MicButton';
import { useDream, type InterviewTurn } from '@/lib/state';
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
  const [replyText, setReplyText] = useState('');
  const [mood, setMood] = useState('peaceful');
  const [dreamType, setDreamType] = useState<(typeof DREAM_TYPES)[number]>('normal');
  const [sleepy, setSleepy] = useState(true);
  const [pending, setPending] = useState(false);
  const [qCount, setQCount] = useState(
    initialTurns.filter(t => t.role === 'assistant').length || 1,
  );
  const [done, setDone] = useState(false);
  const initialized = useRef(false);

  const hasStartedInterview = useMemo(
    () => turns.some(t => t.role === 'user'),
    [turns],
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (initialized.current) return;
    initialized.current = true;
    if (session.enrichedDream) reset();
  }, [session.enrichedDream, isHydrated, reset]);

  async function submit(content: string) {
    const clean = content.trim();
    if (!clean || pending) return;
    const nextTurns = [...turns, { role: 'user' as const, content: clean }];
    setTurns(nextTurns);
    setDreamText('');
    setReplyText('');
    setPending(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          history: nextTurns,
          questionsAsked: qCount,
        }),
      });
      if (!res.ok) throw new Error('interview failed');
      const data = await res.json();
      if (data.done) {
        const enrichedDream = [
          `MOOD: ${mood}`,
          `DREAM TYPE: ${dreamType}`,
          ...nextTurns.map(t => `${t.role === 'user' ? 'USER' : 'Q'}: ${t.content}`),
        ].join('\n');
        setDone(true);
        update({ history: nextTurns, enrichedDream });
        setTurns([...nextTurns, { role: 'assistant', content: 'Got it — let us bring your dream to life.' }]);
        setTimeout(() => router.push('/format'), 1400);
      } else {
        setQCount(q => q + 1);
        setTurns([...nextTurns, { role: 'assistant', content: data.question }]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  }

  const setActiveText = hasStartedInterview ? setReplyText : setDreamText;

  return (
    <main
      className={`aurora-bg min-h-dvh px-4 py-8 transition-all sm:px-6 ${
        sleepy ? 'brightness-90 saturate-[0.85]' : ''
      }`}
    >
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Tell the night</h1>
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

        <section className="surface-glass rounded-2xl p-5 sm:p-7">
          <div className="flex flex-col items-center py-4">
            <div className="relative grid place-items-center">
              <BreathingOrb size={150} className={pending ? 'opacity-60' : ''}>
                <Mic className="h-9 w-9 text-foreground/90" />
              </BreathingOrb>
            </div>
            <div className="mt-3">
              <MicButton
                onTranscript={t => setActiveText(prev => prev ? `${prev} ${t}` : t)}
                disabled={pending || done}
              />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tap to dictate, or type below.
            </p>
          </div>

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
                  className="min-h-52 w-full resize-y appearance-none rounded-2xl border border-border/50 px-4 py-4 font-serif text-lg italic leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring/70 focus:ring-4 focus:ring-ring/20"
                  style={{ backgroundColor: 'var(--dw-textbox-bg)' }}
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">How did it feel?</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setMood(item.value)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        mood === item.value
                          ? 'border-ring/60 bg-ring/20 text-foreground shadow-[0_0_24px_rgba(167,139,250,0.22)]'
                          : 'border-border/40 bg-card/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="mr-1.5 text-[11px] uppercase tracking-[0.12em]">{item.glyph}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Dream type</p>
                <div className="flex flex-wrap gap-2">
                  {DREAM_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDreamType(type)}
                      className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                        dreamType === type
                          ? 'border-fuchsia-300/50 bg-fuchsia-300/15 text-foreground'
                          : 'border-border/40 bg-card/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasStartedInterview && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-border/40 bg-background/25">
              <ChatThread turns={turns} pending={pending} />
            </div>
          )}

          <div className="mt-6">
            {done ? (
              <button
                type="button"
                onClick={() => router.push('/format')}
                className="aurora-cta inline-flex w-full items-center justify-center rounded-full px-6 py-4 font-semibold tracking-wide"
              >
                Continue
              </button>
            ) : hasStartedInterview ? (
              <div className="flex items-end gap-3">
                <textarea
                  rows={1}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Answer the follow-up..."
                  className="min-h-12 flex-1 resize-none appearance-none rounded-2xl border border-border/50 px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring/70"
                  style={{ backgroundColor: 'var(--dw-textbox-bg)' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit(replyText);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => submit(replyText)}
                  disabled={pending || !replyText.trim()}
                  className="aurora-cta inline-flex h-12 items-center justify-center rounded-full px-5 font-semibold disabled:opacity-50"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => submit(dreamText)}
                disabled={pending || !dreamText.trim()}
                className="aurora-cta mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Continue
              </button>
            )}
          </div>
        </section>

        <p className="mx-auto mt-5 max-w-xl text-center text-[11px] text-muted-foreground/80">
          Public on the leaderboard by default — easy to toggle off after generation.
        </p>
      </div>
    </main>
  );
}
