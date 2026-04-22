'use client';

import { useCallback, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onTranscript(text: string): void;
  onRecordingChange?(recording: boolean): void;
  disabled?: boolean;
}

// Minimal Web Speech API types
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
}

function getSpeechCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}

export function MicButton({ onTranscript, onRecordingChange, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const bufferRef = useRef<string>('');
  // Stable refs for callbacks so we don't need to recreate the recognition object
  const onTranscriptRef = useRef(onTranscript);
  const onRecordingChangeRef = useRef(onRecordingChange);
  onTranscriptRef.current = onTranscript;
  onRecordingChangeRef.current = onRecordingChange;

  // Lazily create SpeechRecognition only when user clicks the button
  const getOrCreateRec = useCallback((): SpeechRecognitionInstance | null => {
    if (recRef.current) return recRef.current;

    const Ctor = getSpeechCtor();
    if (!Ctor) {
      toast.error('Speech recognition is not supported in this browser.');
      return null;
    }

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

    rec.onerror = (e: any) => {
      const error = e?.error ?? 'unknown';
      if (error === 'not-allowed' || error === 'permission-denied') {
        toast.error('Microphone access denied. Please allow it in your browser settings.');
      } else if (error !== 'aborted' && error !== 'no-speech') {
        toast.error(`Mic error: ${error}`);
      }
      setRecording(false);
      onRecordingChangeRef.current?.(false);
    };

    rec.onend = () => {
      setRecording(false);
      onRecordingChangeRef.current?.(false);
      if (bufferRef.current.trim()) {
        onTranscriptRef.current(bufferRef.current.trim());
        bufferRef.current = '';
      }
    };

    recRef.current = rec;
    return rec;
  }, []);

  async function start() {
    if (disabled) return;

    // Explicitly request mic permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      toast.error('Microphone access is required for voice input. Please allow it and try again.');
      return;
    }

    const rec = getOrCreateRec();
    if (!rec) return;

    try {
      rec.lang = localStorage.getItem('dream-lang') || 'en-US';
      bufferRef.current = '';
      rec.start();
      setRecording(true);
      onRecordingChangeRef.current?.(true);
    } catch (err: any) {
      if (err?.message?.includes('already started')) return;
      toast.error('Could not start recording. Please try again.');
    }
  }

  function stop() {
    recRef.current?.stop();
  }

  // Hide button entirely if Speech API not available
  if (!getSpeechCtor()) return null;

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
