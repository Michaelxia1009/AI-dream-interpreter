import { Loader2 } from 'lucide-react';
import { PageShell } from '@/components/ui';

export default function LoadingDreamDetail() {
  return (
    <PageShell>
      <div className="grid flex-1 place-items-center">
        <span className="inline-flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening dream...
        </span>
      </div>
    </PageShell>
  );
}
