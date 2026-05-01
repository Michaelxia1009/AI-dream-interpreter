import { PageShell, PageHeader, GlassPanel, Button } from '@/components/ui';

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
    <PageShell chrome="landing">
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Features"
          title={
            <>
              A whole observatory for your <span className="aurora-text">inner sky.</span>
            </>
          }
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(item => (
            <GlassPanel key={item.title} size="md" as="article">
              <h2 className="font-display text-2xl tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </GlassPanel>
          ))}
        </div>

        <Button variant="secondary" as="link" href="/journal" className="mt-10">
          Open journal
        </Button>
      </section>
    </PageShell>
  );
}
