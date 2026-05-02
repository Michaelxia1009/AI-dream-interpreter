'use client';

import { useCallback } from 'react';

interface DreamArchiveCoverProps {
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
}

function videoPreviewUrl(videoUrl: string): string {
  return videoUrl.includes('#') ? videoUrl : `${videoUrl}#t=0.001`;
}

export function DreamArchiveCover({
  thumbnailUrl,
  videoUrl,
  className = 'h-40',
}: DreamArchiveCoverProps) {
  const holdFirstFrame = useCallback((video: HTMLVideoElement) => {
    try {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.currentTime === 0) {
        video.currentTime = 0.001;
      }
    } catch {
      // Some browsers reject tiny seeks until more data is available; the
      // fragment URL still nudges them toward the first rendered frame.
    }
  }, []);

  if (thumbnailUrl) {
    return (
      // Generated Blob URLs are final display assets.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={thumbnailUrl} alt="" className={`${className} w-full object-cover`} />
    );
  }

  if (videoUrl) {
    return (
      <video
        src={videoPreviewUrl(videoUrl)}
        muted
        playsInline
        preload="metadata"
        controls={false}
        aria-label="Video dream preview"
        className={`${className} w-full object-cover`}
        onLoadedMetadata={event => holdFirstFrame(event.currentTarget)}
        onLoadedData={event => holdFirstFrame(event.currentTarget)}
      />
    );
  }

  return (
    <div className={`${className} grid w-full place-items-center bg-secondary/60 text-sm text-muted-foreground`}>
      Dream preview
    </div>
  );
}
