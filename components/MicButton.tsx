'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onTranscript(text: string): void;
  onRecordingChange?(recording: boolean): void;
  disabled?: boolean;
}

// Minimal Web Speech API types
type SpeechRecognitionCtor = new () => SpeechRecognition;
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
}

export function MicButton({ onTranscript, onRecordingChange, disabled }: Props) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const bufferRef = useRef<string>('');

  useEffect(() => {
    const Ctor: SpeechRecognitionCtor | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = localStorage.getItem('dream-lang') || 'en-US';
    rec.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      bufferRef.current = text;
    };
    rec.onerror = () => stop();
    rec.onend = () => {
      setRecording(false);
      onRecordingChange?.(false);
      if (bufferRef.current.trim()) {
        onTranscript(bufferRef.current.trim());
        bufferRef.current = '';
      }
    };
    recRef.current = rec;
    return () => rec.stop();
  }, [onTranscript, onRecordingChange]);

  function start() {
    if (!recRef.current || disabled) return;
    try {
      bufferRef.current = '';
      recRef.current.start();
      setRecording(true);
      onRecordingChange?.(true);
    } catch {}
  }

  function stop() { recRef.current?.stop(); }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      aria-label={recording ? 'Stop recording' : 'Start recording'}
      className={`flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition ${
        recording ? 'bg-destructive animate-pulse text-white' : 'aurora-cta'
      } disabled:opacity-40`}
    >
      {recording
        ? <Square className="h-5 w-5 fill-current" />
        : <Mic className="h-5 w-5" />}
    </button>
  );
}
