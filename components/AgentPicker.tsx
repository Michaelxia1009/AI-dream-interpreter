'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AGENTS, type AgentDef, type AgentId } from '@/lib/interpret';
import { Button, GlassPanel } from '@/components/ui';

interface Props {
  agentId: AgentId;
  disabled?: boolean;
  onChange(id: AgentId): void;
}

/**
 * Dropdown that switches the interpreter persona. Renders one row per agent
 * with name on the left, tagline on the right; the description of the active
 * agent stays visible underneath the chat header.
 *
 * Closes on outside-click, Escape, or selection.
 */
export function AgentPicker({ agentId, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active: AgentDef =
    AGENTS.find(a => a.id === agentId) ?? AGENTS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-muted-foreground">Voice</span>
        <span className="font-medium">{active.name}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition ${
            open ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {open && (
        <GlassPanel
          as="div"
          role="listbox"
          size="sm"
          className="absolute right-0 z-30 mt-2 w-80 overflow-hidden p-0 shadow-2xl"
        >
          {AGENTS.map(a => {
            const isActive = a.id === agentId;
            return (
              <button
                key={a.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(a.id);
                  setOpen(false);
                }}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-border/40 px-4 py-3 text-left transition last:border-b-0 ${
                  isActive
                    ? 'bg-secondary/60'
                    : 'hover:bg-secondary/40'
                }`}
              >
                <span className="font-display text-base tracking-tight">
                  {a.name}
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {a.tagline}
                </span>
              </button>
            );
          })}
        </GlassPanel>
      )}
    </div>
  );
}
