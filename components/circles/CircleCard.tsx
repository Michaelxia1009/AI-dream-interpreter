'use client';

import Link from 'next/link';
import { Users, MessageCircle } from 'lucide-react';

export interface CircleSummary {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  memberCount: number;
  sharedDreamCount: number;
}

export function CircleCard({ circle }: { circle: CircleSummary }) {
  return (
    <Link
      href={`/circles/${circle.id}`}
      className="surface-glass block rounded-2xl p-5 transition hover:border-ring/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">{circle.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {circle.description || 'A private circle for sharing dreams.'}
          </p>
        </div>
        <span className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
          {circle.inviteCode}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {circle.memberCount} members
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          {circle.sharedDreamCount} dreams
        </span>
      </div>
    </Link>
  );
}
