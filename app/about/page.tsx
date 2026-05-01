import type { Metadata } from 'next';
import { PageShell, PageHeader, GlassPanel, Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'About · Dreamweaver',
  description:
    'A quiet companion for the half-remembered world between sleep and waking — capture dreams, read them with care, and turn them into gentle art.',
};

export default function AboutPage() {
  return (
    <PageShell chrome="landing">
      <section className="mx-auto flex max-w-3xl flex-col">
        <PageHeader
          eyebrow="About"
          title={
            <>
              About <span className="aurora-text">Dreamweaver.</span>
            </>
          }
        />

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Dreamweaver is a quiet companion for the half-remembered world
            between sleep and waking — a place to capture dreams, read them with
            care, and turn them into gentle art.
          </p>
          <p>
            We use thoughtful prompts and modern AI through a managed gateway.
            Your journal stays yours; you can journal anonymously, share only
            what you choose, and invite trusted people into private circles.
          </p>
          <p>
            Built with curiosity and respect for the strange logic of dreams.
            If something feels off in the product, we want to hear about it.
          </p>
        </div>

        {/* How it works — 3 steps from DreamTok */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: 'Tell',
              body:
                'Type or speak your dream the moment you wake. Sleepy mode keeps the screen dark.',
            },
            {
              step: 'Watch',
              body:
                'AI paints a one-of-a-kind dreamscape from your words — yours to keep, share, or set aside.',
            },
            {
              step: 'Share',
              body:
                'Drop it into a private circle, or send it into the public gallery for the week.',
            },
          ].map((s) => (
            <GlassPanel key={s.step} size="md" className="text-left">
              <h3 className="font-display text-xl tracking-tight">{s.step}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </GlassPanel>
          ))}
        </div>

        {/* Privacy promise */}
        <GlassPanel size="md" className="mt-12">
          <h2 className="font-display text-2xl tracking-tight">Privacy promise</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No accounts required. Your fingerprint stays on your device.
            Dreams expire on their own unless you keep them. Public sharing
            is opt-in, per dream — not on by default.
          </p>
        </GlassPanel>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button variant="primary" size="lg" as="link" href="/capture">
            Start journaling →
          </Button>
          <Button variant="secondary" as="link" href="/pricing">
            Pricing →
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
