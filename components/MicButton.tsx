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
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
}

export function MicButton({ onTranscript, onRecordingChange, disabled }: Props) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [permGranted, setPermGranted] = useState(false);

  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const bufferRef = useRef<string>('');
  // Use refs for callbacks so the SpeechRecognition instance doesn't need to be recreated
  const onTranscriptRef = useRef(onTranscript);
  const onRecordingChangeRef = useRef(onRecordingChange);
  onTranscriptRef.current = onTranscript;
  onRecordingChangeRef.current = onRecordingChange;

  // Create SpeechRecognition instance once on mount
  useEffect(() => {
    const Ctor: SpeechRecognitionCtor | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
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
        setPermGranted(false);
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
    return () => { rec.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Request microphone permission explicitly
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately — we only needed the permission grant
      stream.getTracks().forEach(t => t.stop());
      setPermGranted(true);
      return true;
    } catch {
      toast.error('Microphone access is required for voice input. Please allow it and try again.');
      setPermGranted(false);
      return false;
    }
  }, []);

  async function start() {
    if (!recRef.current || disabled) return;

    // Always request permission before first use (or if previously denied)
    if (!permGranted) {
      const ok = await requestPermission();
      if (!ok) return;
    }

    try {
      // Update lang in case user changed it in settings
      recRef.current.lang = localStorage.getItem('dream-lang') || 'en-US';
      bufferRef.current = '';
      recRef.current.start();
      setRecording(true);
      onRecordingChangeRef.current?.(true);
    } catch (err: any) {
      // If the recognition is already started or permission revoked
      if (err?.message?.includes('already started')) return;
      toast.error('Could not start recording. Please try again.');
    }
  }

  function stop() {
    recRef.current?.stop();
  }

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
