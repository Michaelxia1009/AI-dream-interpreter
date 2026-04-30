'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MicButton } from '@/components/MicButton';
import { ChatThread } from '@/components/ChatThread';
import { useDream, type InterviewTurn } from '@/lib/state';
import { toast } from 'sonner';

const OPENING: InterviewTurn = {
  role: 'assistant',
  content: 'What did you dream about?',
};

export default function CapturePage() {
  const router = useRouter();
  const { session, isHydrated, update, reset } = useDream();
  const initialTurns = session.enrichedDream
    ? [OPENING]
    : session.history.length
      ? session.history
      : [OPENING];
  const [turns, setTurns] = useState<InterviewTurn[]>(initialTurns);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [qCount, setQCount] = useState(
    initialTurns.filter(t => t.role === 'assistant').length || 1,
  );
  const [done, setDone] = useState(false);
  const initialized = useRef(false);

  // On first hydrate, decide between three states:
  //   1. Completed interview parked in storage (enrichedDream set) → user is
  //      starting a NEW dream (otherwise they wouldn't be on /capture). Reset
  //      so they get a clean chat instead of being silently bounced to /format.
  //   2. Interview in progress (history but no enrichedDream) → restore turns
  //      so a refresh mid-conversation doesn't lose their work.
  //   3. Empty session → just show the opener.
  useEffect(() => {
    if (!isHydrated) return;
    if (initialized.current) return;
    initialized.current = true;
    if (session.enrichedDream) {
      reset();
      return;
    }
  }, [session, isHydrated, reset]);

  async function submit(content: string) {
    const clean = content.trim();
    if (!clean) return;
    const nextTurns = [...turns, { role: 'user' as const, content: clean }];
    setTurns(nextTurns);
    setText('');
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
        setDone(true);
        update({
          history: nextTurns,
          enrichedDream: nextTurns.map(t => `${t.role === 'user' ? 'USER' : 'Q'}: ${t.content}`).join('\n'),
        });
        setTurns([...nextTurns, { role: 'assistant', content: 'Got it — let\u2019s bring your dream to life.' }]);
        // Auto-advance after brief pause
        setTimeout(() => router.push('/format'), 1800);
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

  return (
    <main className="aurora-bg relative flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <span className="font-serif text-lg">Tell us your dream</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <ChatThread turns={turns} pending={pending} />
      </div>

      {/* Public-by-default disclosure */}
      <div className="px-4 pb-1 pt-3 text-center text-[11px] text-muted-foreground/80">
        🌐 Public on the leaderboard by default — easy to toggle off after.
      </div>

      <div className="sticky bottom-0 z-10 border-t border-border bg-background/90 px-4 pb-6 pt-4 backdrop-blur">
        {done ? (
          <button
            onClick={() => router.push('/format')}
            className="aurora-cta w-full rounded-full px-6 py-4 font-semibold tracking-wide"
          >
            Continue &rarr;
          </button>
        ) : (
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type or tap the mic..."
              className="flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(text); }
              }}
            />
            {text.trim() ? (
              <button
                onClick={() => submit(text)}
                disabled={pending}
                className="aurora-cta h-12 rounded-full px-5 font-semibold disabled:opacity-50"
              >
                Send
              </button>
            ) : (
              <MicButton onTranscript={t => setText(prev => prev ? `${prev} ${t}` : t)} disabled={pending} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
