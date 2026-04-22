'use client';

import { useEffect, useRef } from 'react';
import type { InterviewTurn } from '@/lib/state';

export function ChatThread({ turns, pending }: { turns: InterviewTurn[]; pending?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, pending]);

  return (
    <div className="flex flex-col gap-3 px-4 pb-32 pt-6">
      {turns.map((t, i) => (
        <div
          key={i}
          className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
            t.role === 'assistant'
              ? 'self-start bg-zinc-800 text-zinc-100'
              : 'self-end bg-white text-black'
          }`}
        >
          {t.content}
        </div>
      ))}
      {pending && (
        <div className="self-start rounded-2xl bg-zinc-800 px-4 py-3">
          <span className="inline-flex gap-1 [&>span]:h-2 [&>span]:w-2 [&>span]:animate-bounce [&>span]:rounded-full [&>span]:bg-zinc-400">
            <span /><span style={{ animationDelay: '120ms' }} /><span style={{ animationDelay: '240ms' }} />
          </span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
