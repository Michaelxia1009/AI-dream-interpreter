import Link from 'next/link';
import { LandingHeader } from '@/components/LandingHeader';

export const metadata = {
  title: 'Features · Dreamweaver',
  description: 'AI dream art, private journaling, patterns, circles, and leaderboards.',
};

const FEATURES = [
  {
    title: 'AI Dream Art',
    body: 'Every completed dream can become a painting or short cinematic scene.',
  },
  {
    title: 'Follow-up Interview',
    body: 'Dreamweaver asks gentle follow-up questions before turning the dream into media.',
  },
  {
    title: 'Symbol Constellation',
    body: 'Recurring symbols become a private map of what your dreams keep returning to.',
  },
  {
    title: 'Pattern Insights',
    body: 'Mood trends, dream rhythm, recurring images, and weekly letters live inside Journal.',
  },
  {
    title: 'Dream Leaderboard',
    body: 'Publish selected dreams to a weekly leaderboard when you want to share.',
  },
  {
    title: 'Dream Circles',
    body: 'Private invite-only groups let you share dreams with people who matter.',
  },
];

export default function FeaturesPage() {
  return (
    <main className="aurora-bg min-h-dvh">
      <LandingHeader />
      <section className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Features</p>
          <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-7xl">
            A whole observatory for your <span className="aurora-text">inner sky.</span>
          </h1>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(item => (
              <article key={item.title} className="surface-glass rounded-2xl p-6">
                <h2 className="font-serif text-2xl tracking-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
          <Link href="/journal" className="mt-10 inline-flex rounded-full border border-border/60 bg-background/30 px-6 py-3 text-sm text-muted-foreground backdrop-blur transition hover:text-foreground">
            Open journal
          </Link>
        </div>
      </section>
    </main>
  );
}
