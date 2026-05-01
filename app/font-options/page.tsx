import type { Metadata } from 'next';
import { ArrowRight, Check, Moon, Sparkles } from 'lucide-react';
import { PageShell, GlassPanel, Button, Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Title font options · Dreamweaver',
  description: 'Preview elegant title font directions for the Dreamweaver landing page.',
};

const options = [
  {
    name: 'Fraunces Soft',
    className: 'font-title-fraunces',
    mood: 'Dreamy, editorial, a little enchanted',
    note: 'My favorite for Dreamweaver: elegant without becoming too formal.',
  },
  {
    name: 'Playfair Display',
    className: 'font-title-playfair',
    mood: 'Luxe, romantic, magazine-like',
    note: 'Best if you want the landing page to feel more premium and cinematic.',
  },
  {
    name: 'Cormorant Garamond',
    className: 'wordmark-font',
    mood: 'Poetic, moonlit, classical',
    note: 'Matches the wordmark closely; very graceful, but can feel delicate.',
  },
  {
    name: 'Libre Baskerville',
    className: 'font-title-libre',
    mood: 'Literary, calm, trustworthy',
    note: 'Best if you want the product to feel like a serious journal.',
  },
  {
    name: 'Urbanist Previous',
    className: 'font-title-urbanist',
    mood: 'Clean, modern, app-like',
    note: 'The previous direction. Good UI font, less magical for hero titles.',
  },
];

export default function FontOptionsPage() {
  return (
    <PageShell chrome="landing" width="wide">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 text-eyebrow backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary-glow)]" />
            Title font preview
          </div>
          <h1 className="text-h1">
            Choose the voice of Dreamweaver.
          </h1>
          <p className="mt-4 text-body-lg text-muted-foreground">
            I pulled together five title directions using the actual Dreamweaver
            hero language, so you can judge the mood in context.
          </p>
        </header>

        <div className="grid gap-5">
          {options.map((option, index) => (
            <GlassPanel key={option.name} size="lg" radius="3xl" className="overflow-hidden">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <Badge variant={index === 0 ? 'aurora' : 'outline'}>
                      {index === 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Recommended
                        </span>
                      ) : (
                        `Option ${index + 1}`
                      )}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{option.name}</span>
                  </div>

                  <h2 className={`${option.className} text-5xl font-normal leading-[1.02] tracking-tight text-foreground sm:text-7xl lg:text-8xl`}>
                    Catch your dreams
                    <br />
                    <span className="italic text-gradient-aurora">
                      before they fade
                    </span>
                  </h2>

                  <p className="mt-7 max-w-2xl font-serif-italic text-xl italic leading-relaxed text-muted-foreground">
                    A nightly companion that captures, illustrates, and decodes your dreams.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-eyebrow">Mood</p>
                    <p className="mt-2 text-body-lg text-foreground/90">{option.mood}</p>
                  </div>
                  <p className="text-body text-muted-foreground">{option.note}</p>
                  <div className="rounded-2xl border border-border/50 bg-background/25 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Moon className="h-4 w-4 text-[var(--primary-glow)]" />
                      Smaller heading test
                    </div>
                    <p className={`${option.className} text-3xl leading-tight tracking-tight`}>
                      Your subconscious, illustrated.
                    </p>
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        <div className="flex flex-col gap-3 pb-6 sm:flex-row">
          <Button as="link" href="/" variant="secondary" size="lg">
            Back to landing
          </Button>
          <Button as="link" href="/capture" size="lg">
            Test the app flow
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
