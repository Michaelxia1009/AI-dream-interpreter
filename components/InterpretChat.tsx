'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Send, Sparkles } from 'lucide-react';
import {
  AGENTS,
  LENSES,
  buildOpeningUserMessage,
  type AgentId,
  type ChatMessage,
  type Lens,
} from '@/lib/interpret';
import { LensTab } from '@/components/LensTab';
import { AgentPicker } from '@/components/AgentPicker';

interface Props {
  /** The dream the chat is anchored to. May be empty if the user hasn't journaled yet. */
  dream: string;
}

const LENS_KEY = 'interpret-lens-v1';
const AGENT_KEY = 'interpret-agent-v1';

/**
 * Streaming chat for a single dream.
 *
 * - The dream is injected into the very first user message via
 *   `buildOpeningUserMessage`. The chat itself never re-sends the dream as
 *   plain text; the model carries it forward through history.
 * - We read the SSE-free `text/plain` stream directly via `fetch + getReader`
 *   to avoid pulling in `@ai-sdk/react`'s `useChat` (and to keep the bundle
 *   thin, since the rest of the app already has its own state model).
 * - Lens / agent swap mid-conversation: each new turn is sent with whatever
 *   selection is current; old assistant turns stay visible so the dreamer
 *   can compare readings.
 */
export function InterpretChat({ dream }: Props) {
  const trimmedDream = dream.trim();
  const hasDream = trimmedDream.length > 0;

  const [lens, setLens] = useState<Lens>('symbolic');
  const [agentId, setAgentId] = useState<AgentId>('guide');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore last lens/agent so coming back to the page feels continuous.
  // Hydrating React state from localStorage (a platform API) is exactly the
  // external-store carve-out for this rule — but the linter still flags it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const l = window.localStorage.getItem(LENS_KEY) as Lens | null;
    const a = window.localStorage.getItem(AGENT_KEY) as AgentId | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l && LENSES.some(x => x.id === l)) setLens(l);
    if (a && AGENTS.some(x => x.id === a)) setAgentId(a);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(LENS_KEY, lens);
  }, [lens]);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(AGENT_KEY, agentId);
  }, [agentId]);

  // Auto-scroll on new tokens / new turns.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamBuffer]);

  const activeAgent = useMemo(
    () => AGENTS.find(a => a.id === agentId) ?? AGENTS[0],
    [agentId],
  );

  async function send(prompt: string) {
    const cleaned = prompt.trim();
    if (!cleaned) return;
    if (!hasDream) {
      toast.error('Capture a dream first — / capture');
      return;
    }
    if (streaming) return;

    // Build the outgoing history. First turn wraps the dream in <DREAM>…</DREAM>.
    const isFirstUserTurn = messages.length === 0;
    const userTurn: ChatMessage = {
      role: 'user',
      content: isFirstUserTurn
        ? buildOpeningUserMessage(trimmedDream, cleaned)
        : cleaned,
    };
    const next = [...messages, userTurn];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setStreamBuffer('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lens, agent: agentId, messages: next }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setStreamBuffer(acc);
      }
      setMessages(m => [...m, { role: 'assistant', content: acc }]);
      setStreamBuffer('');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled mid-stream — drop the half-finished assistant turn.
        setStreamBuffer('');
      } else {
        console.error(err);
        toast.error('The reading stalled. Try again.');
        // Roll back the user turn so they don't have to retype it.
        setMessages(m => m.slice(0, -1));
        setInput(cleaned);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  // Suggested opening questions, one per lens, to give first-time users a nudge.
  const SEED_QUESTIONS: Record<Lens, string> = {
    symbolic: 'What stands out as the most charged image in this dream?',
    emotional: 'What feeling is sitting underneath this dream?',
    jungian: 'Which part of me is asking for attention through this dream?',
  };

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Lens row + agent picker */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {LENSES.map(l => (
            <LensTab
              key={l.id}
              lens={l}
              active={lens === l.id}
              disabled={streaming}
              onSelect={setLens}
            />
          ))}
        </div>
        <AgentPicker
          agentId={agentId}
          disabled={streaming}
          onChange={setAgentId}
        />
      </div>

      <p className="text-xs text-muted-foreground/80">{activeAgent.description}</p>

      {/* Dream banner — shows what the chat is anchored to. */}
      {hasDream ? (
        <details className="surface-glass rounded-2xl p-4 text-sm">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-muted-foreground">
            ✦ Your dream
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-foreground/90">
            {trimmedDream}
          </p>
        </details>
      ) : (
        <div className="surface-glass rounded-2xl p-5 text-sm text-muted-foreground">
          You don&apos;t have a dream queued yet.{' '}
          <Link href="/capture" className="text-foreground underline underline-offset-4">
            Capture one →
          </Link>
        </div>
      )}

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="surface-glass max-h-[55vh] min-h-[18rem] overflow-y-auto rounded-2xl p-5"
      >
        {messages.length === 0 && !streamBuffer && (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="h-6 w-6 text-accent" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Ask anything about your dream — or start with one of these.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {LENSES.map(l => (
                <button
                  key={l.id}
                  type="button"
                  disabled={!hasDream || streaming}
                  onClick={() => {
                    setLens(l.id);
                    void send(SEED_QUESTIONS[l.id]);
                  }}
                  className="rounded-full border border-border/60 bg-background/30 px-4 py-2 text-xs text-muted-foreground transition hover:border-ring/50 hover:text-foreground disabled:opacity-50"
                >
                  {SEED_QUESTIONS[l.id]}
                </button>
              ))}
            </div>
          </div>
        )}

        <ul className="space-y-5">
          {messages.map((m, i) => {
            // Strip the <DREAM>…</DREAM> wrapper from the first user turn for display.
            const display =
              m.role === 'user' && i === 0
                ? m.content.replace(/^<DREAM>[\s\S]*?<\/DREAM>\n*/, '')
                : m.content;
            return (
              <li key={i} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {m.role === 'user' ? 'You' : activeAgent.name}
                </span>
                <p
                  className={
                    m.role === 'user'
                      ? 'whitespace-pre-wrap text-foreground'
                      : 'whitespace-pre-wrap text-foreground/90 leading-relaxed'
                  }
                >
                  {display}
                </p>
              </li>
            );
          })}
          {streaming && (
            <li className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {activeAgent.name}
              </span>
              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {streamBuffer}
                <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle" />
              </p>
            </li>
          )}
        </ul>
      </div>

      {/* Composer */}
      <form
        onSubmit={e => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={2}
          placeholder={
            hasDream
              ? 'Ask about a symbol, a feeling, or a recurring image…'
              : 'Capture a dream first.'
          }
          disabled={!hasDream || streaming}
          className="flex-1 resize-none rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm placeholder:text-muted-foreground/60 outline-none transition focus:border-ring/80 disabled:opacity-60"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-border/60 bg-background/40 px-5 text-sm transition hover:border-ring/60"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!hasDream || !input.trim()}
            className="aurora-cta inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold tracking-wide shadow-xl transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
            Ask
          </button>
        )}
      </form>
    </div>
  );
}
