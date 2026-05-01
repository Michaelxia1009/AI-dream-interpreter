import Link from 'next/link';
import { LandingHeader } from '@/components/LandingHeader';

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
    <main className="aurora-bg min-h-dvh">
      <LandingHeader />
      <section className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
          <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-7xl">
            Three breaths between you and <span className="aurora-text">understanding.</span>
          </h1>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map(item => (
              <article key={item.title} className="surface-glass rounded-2xl p-6">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.step}</p>
                <h2 className="font-serif text-2xl tracking-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
          <Link href="/capture" className="aurora-cta mt-10 inline-flex rounded-full px-6 py-3 text-sm font-semibold">
            Start journaling
          </Link>
        </div>
      </section>
    </main>
  );
}
