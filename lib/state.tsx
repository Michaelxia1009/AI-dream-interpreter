'use client';

import {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';

export interface InterviewTurn { role: 'user' | 'assistant'; content: string }
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
  /** The handle the result page should display ("Dreamer #A4F2" or custom). */
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

interface Ctx {
  session: DreamSession;
  update(partial: Partial<DreamSession>): void;
  reset(): void;
}

const DreamCtx = createContext<Ctx | null>(null);

export function DreamProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DreamSession>(empty);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) try { setSession({ ...empty, ...JSON.parse(raw) }); } catch {}
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  return (
    <DreamCtx.Provider value={{
      session,
      update: p => setSession(s => ({ ...s, ...p })),
      reset: () => { sessionStorage.removeItem(STORAGE_KEY); setSession(empty); },
    }}>{children}</DreamCtx.Provider>
  );
}

export function useDream(): Ctx {
  const ctx = useContext(DreamCtx);
  if (!ctx) throw new Error('useDream outside DreamProvider');
  return ctx;
}
