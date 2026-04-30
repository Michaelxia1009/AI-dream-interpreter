/**
 * Dream-interpretation domain: lenses (analytical frames), agents (voices),
 * and the chat message shape exchanged with /api/interpret.
 *
 * Lens × Agent are orthogonal. The lens decides *what* to read for; the agent
 * decides *how it sounds*. They're combined into a single system prompt server-side.
 */

export type Lens = 'symbolic' | 'emotional' | 'jungian';
export type AgentId = 'guide' | 'zhougong' | 'freud';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Short copy used in the lens pill row. */
export interface LensDef {
  id: Lens;
  label: string;
  blurb: string;
  /** Single sentence the model uses to shape its reading. */
  instruction: string;
}

/** Short copy used in the agent picker. */
export interface AgentDef {
  id: AgentId;
  name: string;
  /** Right-side small caption under the name. */
  tagline: string;
  /** Long-form sentence shown when this agent is the active selection. */
  description: string;
  /** Block of voice/style instructions injected into the system prompt. */
  instruction: string;
}

export const LENSES: LensDef[] = [
  {
    id: 'symbolic',
    label: 'Symbolic',
    blurb: 'Archetypes, motifs, recurring symbols.',
    instruction:
      'Read this turn through symbols and motifs. Notice the most charged image first — water, animal, doorway, color, weather, a specific object — and explore one or two such symbols with care. Connect them to common dream-symbol traditions, but always anchor the reading back to what is actually in *this* dreamer\'s text.',
  },
  {
    id: 'emotional',
    label: 'Emotional',
    blurb: 'Feelings beneath the imagery.',
    instruction:
      'Read this turn through feeling. Name the emotional weather of the dream — what the dreamer felt during it, and what residue might be left now. Trace shifts in tone (calm → panic, longing → relief). Treat any emotional contradiction as the most important signal.',
  },
  {
    id: 'jungian',
    label: 'Jungian',
    blurb: 'Shadow, anima, individuation.',
    instruction:
      'Read this turn through Jungian archetypes — Shadow, Anima/Animus, Self, Wise Old One, Trickster, Mother, Child — and the process of individuation. Identify which archetype seems to be approaching the dreamer, and what unintegrated part of the psyche it might represent. Use lay language; do not lecture.',
  },
];

export const AGENTS: AgentDef[] = [
  {
    id: 'guide',
    name: 'Dream guide',
    tagline: 'Same voice as before — your journal, woven reading',
    description:
      'A gentle, modern guide who weaves the chosen lens into a contemporary, plain-spoken reading.',
    instruction:
      'You are the Dream Guide — a quiet, contemporary companion who reads dreams the way a thoughtful friend would. Modern English, no antiquated flourishes. Curious and grounded. Never sentimental, never clinical.',
  },
  {
    id: 'zhougong',
    name: '周公 (Zhou Gong)',
    tagline: 'Duke of Zhou — 《周公解梦》 image & omen lineage',
    description:
      'Reads through the Chinese folk tradition of 《周公解梦》 — image-by-image, omen-by-omen, with classical brevity.',
    instruction:
      'You are 周公 (the Duke of Zhou), speaking in the voice of the 《周公解梦》 dream-divination tradition. Read image by image. Each major image gets a short, pithy gloss in the manner of the tradition (e.g. "梦见水：……主……"). You may write a few key phrases in 中文 with a short English rendering after, but do not require the dreamer to read Chinese. Tone: measured, gently authoritative, never spooky. Avoid astrology or fortune-telling about specific events; speak about disposition, fortune-of-mind, and what to attend to.',
  },
  {
    id: 'freud',
    name: 'Freud',
    tagline: 'Manifest & latent wishes — *Interpretation of Dreams*',
    description:
      'Reads the manifest dream as a coded expression of latent wishes — condensation, displacement, the dream-work.',
    instruction:
      'You are Sigmund Freud, in the spirit of *Die Traumdeutung*. Distinguish the manifest content (what the dream literally shows) from the latent content (the underlying wish). Use the concepts of condensation, displacement, and secondary revision when they fit. Be candid about sexuality and aggression where the text invites it, but never lurid — you are a clinician, not a tabloid. Say "I" and address the dreamer as "you." Continental cadence, but readable English.',
  },
];

export function getLens(id: Lens): LensDef {
  const found = LENSES.find(l => l.id === id);
  if (!found) throw new Error(`Unknown lens: ${id}`);
  return found;
}

export function getAgent(id: AgentId): AgentDef {
  const found = AGENTS.find(a => a.id === id);
  if (!found) throw new Error(`Unknown agent: ${id}`);
  return found;
}

/**
 * Build the first-turn user message that anchors the chat to the specific dream.
 * The system prompt instructs the model to look for `<DREAM>…</DREAM>` in this
 * exact shape, so do not change the wrapper without updating the prompt too.
 */
export function buildOpeningUserMessage(dream: string, openingQuestion: string): string {
  const cleanDream = dream.trim();
  const cleanQ = openingQuestion.trim() || 'What stands out to you in this dream?';
  return `<DREAM>\n${cleanDream}\n</DREAM>\n\n${cleanQ}`;
}
