'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Carousel } from '@/components/Carousel';
import { VideoPlayer } from '@/components/VideoPlayer';
import { muxVideoWithAudio, normalizeVideoForPlayback } from '@/lib/mux/clientMux';

type DreamGeneration =
  | { kind: 'carousel'; imageUrls: string[]; zipUrl?: string }
  | { kind: 'video'; videoUrl: string; audioUrl: string; narrationText?: string };

export function DreamGenerationViewer({ generation }: { generation: DreamGeneration }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(generation.kind === 'video');

  useEffect(() => {
    if (generation.kind !== 'video') {
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      setProcessing(true);
      try {
        if (generation.audioUrl === generation.videoUrl) {
          const blob = await normalizeVideoForPlayback(generation.videoUrl);
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setVideoSrc(objectUrl);
          setAudioSrc(null);
          return;
        }

        const blob = await muxVideoWithAudio(generation.videoUrl, generation.audioUrl);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setVideoSrc(objectUrl);
        setAudioSrc(null);
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setVideoSrc(generation.videoUrl);
        setAudioSrc(generation.audioUrl === generation.videoUrl ? null : generation.audioUrl);
      } finally {
        if (!cancelled) setProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [generation]);

  if (generation.kind === 'carousel') {
    return <Carousel urls={generation.imageUrls} />;
  }

  if (processing) {
    return (
      <div className="grid h-full w-full place-items-center bg-black text-sm text-white/70">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing video...
        </span>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={videoSrc ?? generation.videoUrl}
      audioSrc={audioSrc ?? undefined}
    />
  );
}
