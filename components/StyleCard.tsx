'use client';

import type { Style } from '@/lib/styles';

/* Mood-keyed gradients — procedural thumbnails keep the app vibrant
   while real style artwork is commissioned. */
const MOOD_GRADIENTS: Record<string, string> = {
  wonder:      'linear-gradient(135deg, #A78BFA 0%, #5EEAD4 100%)',
  nature:      'linear-gradient(135deg, #5EEAD4 0%, #FDE68A 100%)',
  flight:      'linear-gradient(135deg, #A78BFA 0%, #F0ABFC 100%)',
  nostalgia:   'linear-gradient(135deg, #FDE68A 0%, #F472B6 100%)',
  gentle:      'linear-gradient(135deg, #C4B5FD 0%, #FBCFE8 100%)',
  childhood:   'linear-gradient(135deg, #FBCFE8 0%, #FDE68A 100%)',
  family:      'linear-gradient(135deg, #FDE68A 0%, #C4B5FD 100%)',
  reflective:  'linear-gradient(135deg, #A78BFA 0%, #1A1233 100%)',
  melancholy:  'linear-gradient(135deg, #312E81 0%, #5EEAD4 100%)',
  mystery:     'linear-gradient(135deg, #1A1233 0%, #A78BFA 100%)',
  chase:       'linear-gradient(135deg, #DC2626 0%, #1A1233 100%)',
  tension:     'linear-gradient(135deg, #F472B6 0%, #1A1233 100%)',
  urban:       'linear-gradient(135deg, #5EEAD4 0%, #312E81 100%)',
  suspense:    'linear-gradient(135deg, #1A1233 0%, #F472B6 100%)',
  nightmare:   'linear-gradient(135deg, #7F1D1D 0%, #F472B6 100%)',
  creepy:      'linear-gradient(135deg, #3F0D12 0%, #84CC16 100%)',
  uncanny:     'linear-gradient(135deg, #84CC16 0%, #F472B6 100%)',
  fear:        'linear-gradient(135deg, #1A1233 0%, #7F1D1D 100%)',
  dark:        'linear-gradient(135deg, #0A0718 0%, #312E81 100%)',
  grand:       'linear-gradient(135deg, #FDE68A 0%, #92400E 100%)',
  mythic:      'linear-gradient(135deg, #FDE68A 0%, #7C2D12 100%)',
  religious:   'linear-gradient(135deg, #FDE68A 0%, #F472B6 100%)',
  epic:        'linear-gradient(135deg, #A78BFA 0%, #FDE68A 100%)',
  heroic:      'linear-gradient(135deg, #FDE68A 0%, #F97316 100%)',
  euphoric:    'linear-gradient(135deg, #F472B6 0%, #5EEAD4 100%)',
  floating:    'linear-gradient(135deg, #FBCFE8 0%, #5EEAD4 100%)',
  surreal:     'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
  joyful:      'linear-gradient(135deg, #FDE68A 0%, #F472B6 100%)',
  mundane:     'linear-gradient(135deg, #71717A 0%, #A78BFA 100%)',
  quiet:       'linear-gradient(135deg, #312E81 0%, #A78BFA 100%)',
  tech:        'linear-gradient(135deg, #5EEAD4 0%, #F472B6 100%)',
  dystopian:   'linear-gradient(135deg, #F472B6 0%, #1A1233 100%)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #A78BFA 0%, #F472B6 50%, #5EEAD4 100%)';

function thumbnailStyle(moodTags: string[]): React.CSSProperties {
  const match = moodTags.find(t => MOOD_GRADIENTS[t]);
  return { backgroundImage: match ? MOOD_GRADIENTS[match] : DEFAULT_GRADIENT };
}

interface Props {
  style: Style;
  showNarrator: boolean;
  onSelect(): void;
}

export function StyleCard({ style, showNarrator, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-ring/60 active:scale-[0.99]"
    >
      <div
        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl"
        style={thumbnailStyle(style.moodTags)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg">{style.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{style.vibe}</p>
        {showNarrator && (
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/80">
            {style.narratorPersona}
          </p>
        )}
      </div>
      <span className="text-muted-foreground">&rsaquo;</span>
    </button>
  );
}
