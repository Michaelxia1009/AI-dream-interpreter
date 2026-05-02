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
  results: ArrayLike<{
    0: { transcript: string };
    isFinal?: boolean;
  }>;
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
      toast.error('Voice dictation is not supported in this browser. Chrome works best for this feature.');
      return null;
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = localStorage.getItem('dream-lang') || 'en-US';

    rec.onresult = e => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      bufferRef.current = text;
    };

    rec.onerror = e => {
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
      toast.error('Voice dictation is not supported in this browser. Chrome works best for this feature.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('This browser cannot access the microphone here. Please try Chrome or Safari over localhost/HTTPS.');
      return;
    }

    // Explicitly request mic permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      const name = err instanceof DOMException ? err.name : 'unknown';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error('Microphone access is blocked. Allow microphone permission for this site, then try again.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('No microphone was found on this computer.');
      } else {
        toast.error(`Could not access the microphone (${name}). Please check your browser settings.`);
      }
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
      toast.error('Could not start voice dictation. Please try Chrome, or type your dream instead.');
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
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-xl transition ${
        recording ? 'bg-destructive animate-pulse text-white' : 'aurora-cta'
      } disabled:opacity-40`}
    >
      {recording
        ? <Square className="h-[18px] w-[18px] fill-current" />
        : <Mic className="h-5 w-5" />}
    </button>
  );
}
