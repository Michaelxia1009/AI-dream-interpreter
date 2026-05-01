'use client';

import { useDream } from '@/lib/state';
import { InterpretChat } from '@/components/InterpretChat';
import { PageShell, PageHeader, Button } from '@/components/ui';

/**
 * `/interpret` — open-ended chat over the dream currently in session.
 *
 * The dream text is taken from `useDream().session.enrichedDream`. The chat is
 * client-only so the dream never leaves the browser until the user actually
 * asks a question; we never persist interpretations server-side at this stage.
 */
export default function InterpretPage() {
  const { session } = useDream();
  const dream = session.enrichedDream ?? '';

  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Interpret"
        title={<>Read your dream <span className="aurora-text">closely.</span></>}
        subtitle="Three lenses, three voices. Pick one or weave between them — your dream is the only ground truth."
        className="mb-8"
      />

      <InterpretChat dream={dream} />

      <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
        <Button variant="secondary" size="sm" as="link" href="/capture">
          &larr; New dream
        </Button>
        <Button variant="secondary" size="sm" as="link" href="/leaderboard">
          Gallery &rarr;
        </Button>
      </div>
    </PageShell>
  );
}
