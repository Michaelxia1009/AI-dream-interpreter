'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}
interface SpeechRecognitionErrorLike {
  error?: string;
}
interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function getSpeechCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function MicButton({ onTranscript, onRecordingChange, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const bufferRef = useRef<string>('');
  // Stable refs for callbacks so we don't need to recreate the recognition object
  const onTranscriptRef = useRef(onTranscript);
  const onRecordingChangeRef = useRef(onRecordingChange);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onRecordingChangeRef.current = onRecordingChange;
  }, [onTranscript, onRecordingChange]);

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

    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      bufferRef.current = text;
    };

    rec.onerror = (e) => {
      const error = e?.error ?? 'unknown';
      if (error === 'not-allowed' || error === 'permission-denied') {
        toast.error('Microphone access denied. Please allow it in your browser settings.');
      } else if (error === 'service-not-allowed' || error === 'network') {
        toast.error('Voice input unavailable — please type your dream instead.');
        // Destroy the instance so next click creates a fresh one
        recRef.current = null;
      } else if (error !== 'aborted' && error !== 'no-speech') {
        toast.error('Voice input failed — please type your dream instead.');
        recRef.current = null;
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
    if (!getSpeechCtor()) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

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
    } catch (err) {
      if (err instanceof Error && err.message.includes('already started')) return;
      toast.error('Could not start recording. Please try again.');
    }
  }

  function stop() {
    recRef.current?.stop();
  }

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
