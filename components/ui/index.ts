/**
 * Dreamweaver UI primitives — the canonical building blocks for every page.
 *
 * Import from this barrel rather than reaching into individual files:
 *
 *   import { PageShell, PageHeader, GlassPanel, Button, Eyebrow, Badge } from '@/components/ui';
 *
 * The shadcn primitives (`button.tsx`, `card.tsx`, `dialog.tsx` etc.) are
 * deliberately NOT re-exported here — they live alongside as form/dialog
 * helpers and should be deep-imported when needed.
 */

export { Button } from './dream-button';
export type { ButtonProps, DreamButtonVariant, DreamButtonSize } from './dream-button';

export { GlassPanel } from './glass-panel';
export type { GlassPanelSize, GlassPanelRadius } from './glass-panel';

export { Eyebrow } from './eyebrow';
export { Badge } from './badge';
export type { BadgeVariant } from './badge';

export { PageHeader } from './page-header';
export { PageShell } from './page-shell';
export type { PageShellChrome, PageShellWidth } from './page-shell';
