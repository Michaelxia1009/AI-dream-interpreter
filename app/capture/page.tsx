'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { MicButton } from '@/components/MicButton';
import { PageShell, GlassPanel, Button } from '@/components/ui';
import { useDream, type InterviewTurn } from '@/lib/state';

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
  const [dreamText, setDreamText] = useState('');
  const [mood, setMood] = useState('peaceful');
  const [dreamType, setDreamType] = useState<(typeof DREAM_TYPES)[number]>('normal');
  const [sleepy, setSleepy] = useState(true);
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (initialized.current) return;
    initialized.current = true;
    if (session.enrichedDream) reset();
  }, [session.enrichedDream, isHydrated, reset]);

  function submit(content: string) {
    const clean = content.trim();
    if (!clean || pending) return;
    setPending(true);
    const history: InterviewTurn[] = [{ role: 'user', content: clean }];
    const enrichedDream = [
      `MOOD: ${mood}`,
      `DREAM TYPE: ${dreamType}`,
      `USER: ${clean}`,
    ].join('\n');
    update({ history, enrichedDream });
    router.push('/format');
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
            disabled={pending}
          />
        </div>

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

        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            onClick={() => submit(dreamText)}
            disabled={pending || !dreamText.trim()}
            className="mx-auto w-full max-w-md"
          >
            <Sparkles className="h-4 w-4" />
            Continue
          </Button>
        </div>
      </GlassPanel>

      <p className="mx-auto mt-5 max-w-xl text-center text-[11px] text-muted-foreground/80">
        Public on the leaderboard by default — easy to toggle off after generation.
      </p>
    </PageShell>
  );
}
