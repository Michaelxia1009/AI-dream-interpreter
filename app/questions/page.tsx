import { PageShell, PageHeader, GlassPanel, Button } from '@/components/ui';

export const metadata = {
  title: 'Questions · Dreamweaver',
  description: 'Common questions about privacy, pricing, capture, and interpretation.',
};

const QUESTIONS = [
  {
    q: 'Do I really not have to sign up?',
    a: 'Right. You can open the app and start journaling anonymously. Prototype claiming lets you attach an email to this device profile later.',
  },
  {
    q: 'What does free include?',
    a: 'Unlimited dream entries, interpretation flow, journal, profile, private patterns, and a limited daily generation quota.',
  },
  {
    q: 'Are my dreams private?',
    a: 'Dreams are private to your device profile unless you publish them to the leaderboard or share them into a Circle.',
  },
  {
    q: 'How does interpretation work?',
    a: 'Dreamweaver asks follow-up questions, then uses your completed dream text for scoring, symbols, art generation, and recurring pattern insights.',
  },
  {
    q: 'Where did Patterns go?',
    a: 'Patterns now live inside Journal so your archive, symbols, rhythm, and weekly letter are in one place.',
  },
];

export default function QuestionsPage() {
  return (
    <PageShell chrome="landing">
      <section className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Questions"
          title={
            <>
              Things people <span className="aurora-text">wonder.</span>
            </>
          }
        />

        <div className="mt-12 space-y-5">
          {QUESTIONS.map(item => (
            <GlassPanel key={item.q} size="md" as="details" className="group [&_summary]:cursor-pointer">
              <summary className="flex items-center justify-between gap-4 font-display text-xl tracking-tight">
                {item.q}
                <span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
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
