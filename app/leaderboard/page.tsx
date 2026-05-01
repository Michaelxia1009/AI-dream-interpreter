import type { Metadata } from 'next';
import { getLeaderboard } from '@/lib/dreams/leaderboard';
import { isoWeekKey, formatIsoWeekRange, msUntilNextIsoWeek } from '@/lib/dreams/iso-week';
import { LeaderboardView } from '@/components/LeaderboardView';
import { PageShell } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export const metadata: Metadata = {
  title: "This week's top dreams · Dreamweaver",
  description: 'The weirdest, most vivid, and most emotional dreams shared this week.',
};

export default async function LeaderboardPage() {
  // SSR the default tab (Weirdest); the client picks up the other two on mount.
  const entries = await getLeaderboard('weirdness');
  return (
    <PageShell width="wide">
      <LeaderboardView
        initial={{
          metric: 'weirdness',
          isoWeek: isoWeekKey(),
          isoWeekRange: formatIsoWeekRange(),
          msUntilReset: msUntilNextIsoWeek(),
          entries,
        }}
      />
    </PageShell>
  );
}
