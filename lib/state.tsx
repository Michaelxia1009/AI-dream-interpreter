'use client';

import {
  createContext, useCallback, useContext, useEffect, useState, ReactNode,
} from 'react';

export type InterviewCategory =
  | 'figuresAppearance'
  | 'environment'
  | 'emotion'
  | 'lighting'
  | 'motion'
  | 'color'
  | 'keyObject'
  | 'sound'
  | 'twist';

export interface InterviewQuestionMeta {
  category: InterviewCategory;
  selectionMode: 'one' | 'many';
  options: string[];
}

export interface InterviewTurn {
  role: 'user' | 'assistant';
  content: string;
  /** Assistant turns only — present when the bubble carries a structured choice question. */
  question?: InterviewQuestionMeta;
  /** User turns only — copied from the preceding assistant turn so we can label the answer. */
  answeredCategory?: InterviewCategory;
  /** User turns only — true when the answer came from the "Other..." text fallback. */
  isFreeText?: boolean;
}
export interface Metric { score: number; oneLiner: string }
export interface Moderation { ok: boolean; flags: string[] }
export interface ScoreResult {
  metrics: {
    weirdness: Metric;
    imagination: Metric;
    emotionalIntensity: Metric;
    vividness: Metric;
  };
  matchedStyleIds: string[];
  blurb: string;
  moderation: Moderation;
  /** 3–8 short lower-case motifs the LLM extracted (powers /patterns). Optional for back-compat. */
  symbols?: string[];
}

export interface DreamSession {
  history: InterviewTurn[];
  enrichedDream: string | null;
  score: ScoreResult | null;
  format: 'video' | 'carousel' | null;
  styleId: string | null;
  generation: GenerationResult | null;
  /** Whether the dream is currently published to leaderboard / share URL. */
  isPublic: boolean;
  /** The handle the result page should display ("Dreamer #0063" or custom). */
  handle: string | null;
}

export type GenerationResult =
  | { id: string; kind: 'carousel'; zipUrl: string; imageUrls: string[] }
  | { id: string; kind: 'video'; videoUrl: string; audioUrl: string; narrationText: string };

const STORAGE_KEY = 'dream-session-v1';
const empty: DreamSession = {
  history: [],
  enrichedDream: null,
  score: null,
  format: null,
  styleId: null,
  generation: null,
  isPublic: true,
  handle: null,
};

function loadInitialSession(): DreamSession {
  if (typeof window === 'undefined') return empty;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return empty;
  try {
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

interface Ctx {
  session: DreamSession;
  isHydrated: boolean;
  update(partial: Partial<DreamSession>): void;
  reset(): void;
}

const DreamCtx = createContext<Ctx | null>(null);

export function DreamProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DreamSession>(loadInitialSession);
  const [isHydrated] = useState(() => typeof window !== 'undefined');
  const update = useCallback((partial: Partial<DreamSession>) => {
    setSession(s => ({ ...s, ...partial }));
  }, []);
  const reset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(empty);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [isHydrated, session]);

  return (
    <DreamCtx.Provider value={{
      session,
      isHydrated,
      update,
      reset,
    }}>{children}</DreamCtx.Provider>
  );
}

export function useDream(): Ctx {
  const ctx = useContext(DreamCtx);
  if (!ctx) throw new Error('useDream outside DreamProvider');
  return ctx;
}
