import { PageShell, PageHeader, GlassPanel, Button } from '@/components/ui';

export const metadata = {
  title: 'How It Works · Dreamweaver',
  description: 'Three steps from remembered dream to illustrated interpretation.',
};

const STEPS = [
  {
    step: 'Step 1',
    title: 'Capture',
    body: 'Type or speak your dream the moment you wake. Sleepy mode keeps the screen dark and friction low.',
  },
  {
    step: 'Step 2',
    title: 'Illustrate',
    body: 'AI paints a one-of-a-kind dreamscape from your words. Your subconscious becomes a living gallery.',
  },
  {
    step: 'Step 3',
    title: 'Decode',
    body: 'Follow-up questions and interpretation lenses reveal symbols, emotions, and recurring patterns.',
  },
];

export default function HowItWorksPage() {
  return (
    <PageShell chrome="landing">
      <section className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="How it works"
          title={
            <>
              Three breaths between you and <span className="aurora-text">understanding.</span>
            </>
          }
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map(item => (
            <GlassPanel key={item.title} size="md" as="article">
              <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.step}</p>
              <h2 className="font-display text-2xl tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </GlassPanel>
          ))}
        </div>

        <Button variant="primary" as="link" href="/capture" className="mt-10">
          Start journaling
        </Button>
      </section>
    </PageShell>
  );
}
