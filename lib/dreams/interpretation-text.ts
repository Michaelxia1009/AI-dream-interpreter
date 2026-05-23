import type { DreamRecord } from './types';

type DreamForInterpretation = Pick<
  DreamRecord,
  'blurb' | 'styleName' | 'format' | 'metrics' | 'generation' | 'symbols' | 'dreamText'
>;

function scoreLine(label: string, metric: { score: number; oneLiner: string }): string {
  return `${label}: ${metric.score}/10 - ${metric.oneLiner}`;
}

export function dreamTextForInterpretation(dream: DreamForInterpretation): string {
  const stored = dream.dreamText?.trim();
  if (stored) return stored;

  const symbols = dream.symbols?.length ? dream.symbols.join(', ') : 'No recurring symbols were saved.';
  const narration =
    dream.generation.kind === 'video' && dream.generation.narrationText
      ? `\n\nGenerated narration:\n${dream.generation.narrationText}`
      : '';

  return [
    `Dream summary: ${dream.blurb}`,
    `Generated as: ${dream.format} in ${dream.styleName} style.`,
    `Symbols and motifs: ${symbols}`,
    'Report card:',
    scoreLine('Weirdness', dream.metrics.weirdness),
    scoreLine('Imagination', dream.metrics.imagination),
    scoreLine('Emotional intensity', dream.metrics.emotionalIntensity),
    scoreLine('Vividness', dream.metrics.vividness),
  ].join('\n') + narration;
}
