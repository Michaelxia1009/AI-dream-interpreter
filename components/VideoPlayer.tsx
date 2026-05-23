'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function VideoPlayer({ src, audioSrc }: { src: string; audioSrc?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);

  function syncAudio() {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;
    if (Math.abs(audio.currentTime - video.currentTime) > 0.35) {
      audio.currentTime = video.currentTime;
    }
  }

  function setAudioPlaying(playing: boolean) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && !muted) {
      syncAudio();
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }

  function toggleMuted() {
    const nextMuted = !muted;
    setMuted(nextMuted);
    const audio = audioRef.current;
    const video = videoRef.current;
    if (audio) {
      audio.muted = nextMuted;
      if (!nextMuted && video && !video.paused) {
        syncAudio();
        audio.play().catch(() => undefined);
      } else {
        audio.pause();
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        playsInline
        muted={audioSrc ? true : muted}
        className="h-full w-full object-cover"
        onPlay={() => setAudioPlaying(true)}
        onPause={() => setAudioPlaying(false)}
        onSeeking={syncAudio}
        onTimeUpdate={syncAudio}
      />
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
          muted={muted}
          preload="auto"
        />
      )}
      <button
        onClick={toggleMuted}
        className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
