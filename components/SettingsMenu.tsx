'use client';

import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { useDream } from '@/lib/state';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'zh-CN', label: '中文' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
];

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const { reset } = useDream();
  const [lang, setLang] = useState('en-US');

  function handleLangChange(code: string) {
    setLang(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dream-lang', code);
    }
  }

  function handleReset() {
    reset();
    setOpen(false);
    window.location.href = '/';
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Preferences</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {/* Language */}
              <div>
                <label className="text-xs uppercase tracking-wide text-zinc-400">Voice Language</label>
                <select
                  value={lang}
                  onChange={e => handleLangChange(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Reset session */}
              <div className="border-t border-zinc-800 pt-5">
                <button
                  onClick={handleReset}
                  className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Start Over (New Dream)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
