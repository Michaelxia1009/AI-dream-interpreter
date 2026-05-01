import Link from 'next/link';
import { LandingHeader } from '@/components/LandingHeader';

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
    <main className="aurora-bg min-h-dvh">
      <LandingHeader />
      <section className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Questions</p>
          <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-7xl">
            Things people <span className="aurora-text">wonder.</span>
          </h1>
          <div className="mt-12 space-y-5">
            {QUESTIONS.map(item => (
              <details key={item.q} className="surface-glass group rounded-2xl p-6 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between gap-4 font-serif text-xl tracking-tight">
                  {item.q}
                  <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
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
