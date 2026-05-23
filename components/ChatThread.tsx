'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { InterviewTurn } from '@/lib/state';

interface ChatThreadProps {
  turns: InterviewTurn[];
  pending?: boolean;
  onAnswer?: (values: string[], isFreeText: boolean) => void;
}

export function ChatThread({ turns, pending, onAnswer }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, pending]);

  // The active chip turn is the most recent assistant turn that carries `question`
  // metadata AND has no following user turn yet (i.e. unanswered).
  const activeChipTurnIndex = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.role !== 'assistant' || !t.question) continue;
      const hasUserAfter = turns.slice(i + 1).some(x => x.role === 'user');
      if (!hasUserAfter) return i;
      return -1;
    }
    return -1;
  }, [turns]);

  return (
    <div className="flex flex-col gap-3 px-4 pb-32 pt-6">
      {turns.map((t, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
              t.role === 'assistant'
                ? 'self-start bg-card text-card-foreground border border-border'
                : 'self-end aurora-cta'
            }`}
          >
            {t.content}
          </div>
          {i === activeChipTurnIndex && t.question && onAnswer && !pending && (
            <ChipGroup
              question={t.question}
              onAnswer={onAnswer}
            />
          )}
        </div>
      ))}
      {pending && (
        <div className="self-start rounded-2xl border border-border bg-card px-4 py-3">
          <span className="inline-flex gap-1 [&>span]:h-2 [&>span]:w-2 [&>span]:animate-bounce [&>span]:rounded-full [&>span]:bg-muted-foreground">
            <span /><span style={{ animationDelay: '120ms' }} /><span style={{ animationDelay: '240ms' }} />
          </span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

interface ChipGroupProps {
  question: NonNullable<InterviewTurn['question']>;
  onAnswer: (values: string[], isFreeText: boolean) => void;
}

function ChipGroup({ question, onAnswer }: ChipGroupProps) {
  const isMulti = question.selectionMode === 'many';
  const [selected, setSelected] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState('');

  function handleChip(option: string) {
    if (otherOpen) setOtherOpen(false);
    if (!isMulti) {
      onAnswer([option], false);
      return;
    }
    setSelected(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option],
    );
  }

  function handleOtherToggle() {
    setOtherOpen(o => !o);
    setSelected([]);
  }

  function submitOther() {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    onAnswer([trimmed], true);
  }

  function submitMulti() {
    if (selected.length === 0) return;
    onAnswer(selected, false);
  }

  return (
    <div className="self-start flex w-full max-w-[90%] flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {question.options.map(opt => {
          const active = isMulti && selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => handleChip(opt)}
              className={
                'rounded-full border px-3.5 py-1.5 text-[13px] transition disabled:opacity-50 ' +
                (active
                  ? 'border-ring/60 bg-ring/20 text-foreground shadow-[0_0_18px_rgba(167,139,250,0.22)]'
                  : 'border-border/60 bg-background/40 text-foreground/85 hover:border-ring/50 hover:text-foreground')
              }
            >
              {opt}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={otherOpen}
          onClick={handleOtherToggle}
          className={
            'rounded-full border px-3.5 py-1.5 text-[13px] transition ' +
            (otherOpen
              ? 'border-fuchsia-300/60 bg-fuchsia-300/15 text-foreground'
              : 'border-dashed border-border/60 bg-background/30 text-muted-foreground hover:text-foreground')
          }
        >
          Other…
        </button>
      </div>

      {isMulti && !otherOpen && selected.length > 0 && (
        <div className="self-start">
          <button
            type="button"
            onClick={submitMulti}
            className="rounded-full bg-foreground/90 px-4 py-1.5 text-[13px] font-medium text-background hover:bg-foreground"
          >
            Done · {selected.length}
          </button>
        </div>
      )}

      {otherOpen && (
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            autoFocus
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            placeholder="Your answer…"
            className="min-h-12 flex-1 resize-none appearance-none rounded-2xl border border-border/60 px-3 py-2 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring/70"
            style={{ backgroundColor: 'var(--dw-textbox-bg)' }}
            data-chat-other
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitOther();
              }
            }}
          />
          <button
            type="button"
            onClick={submitOther}
            disabled={!otherText.trim()}
            className="rounded-full bg-foreground/90 px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50 hover:bg-foreground"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
