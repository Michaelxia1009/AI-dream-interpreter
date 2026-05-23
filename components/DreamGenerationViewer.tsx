'use client';

import { Carousel } from '@/components/Carousel';
import { VideoPlayer } from '@/components/VideoPlayer';

type DreamGeneration =
  | { kind: 'carousel'; imageUrls: string[]; zipUrl?: string }
  | { kind: 'video'; videoUrl: string; audioUrl: string; narrationText?: string };

export function DreamGenerationViewer({ generation }: { generation: DreamGeneration }) {
  if (generation.kind === 'carousel') {
    return <Carousel urls={generation.imageUrls} />;
  }

  return (
    <VideoPlayer
      src={generation.videoUrl}
      audioSrc={generation.audioUrl === generation.videoUrl ? undefined : generation.audioUrl}
    />
  );
}
