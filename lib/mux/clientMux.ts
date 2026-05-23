'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let _ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg;
  const ffmpeg = new FFmpeg();
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  _ffmpeg = ffmpeg;
  return ffmpeg;
}

export async function muxVideoWithAudio(
  videoUrl: string,
  audioUrl: string,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const videoPath = `video-${runId}.mp4`;
  const audioPath = `audio-${runId}.mp3`;
  const outputPath = `muxed-${runId}.mp4`;

  await ffmpeg.writeFile(videoPath, await fetchFile(videoUrl));
  await ffmpeg.writeFile(audioPath, await fetchFile(audioUrl));

  try {
    await runMux(ffmpeg, videoPath, audioPath, outputPath, false);
  } catch (copyErr) {
    console.warn('stream-copy mux failed; retrying with video transcode', copyErr);
    await runMux(ffmpeg, videoPath, audioPath, outputPath, true);
  }

  try {
    const data = await ffmpeg.readFile(outputPath);
    const bytes = new Uint8Array(data as Uint8Array);
    return new Blob([bytes], { type: 'video/mp4' });
  } finally {
    await Promise.allSettled([
      ffmpeg.deleteFile(videoPath),
      ffmpeg.deleteFile(audioPath),
      ffmpeg.deleteFile(outputPath),
    ]);
  }
}

async function runMux(
  ffmpeg: FFmpeg,
  videoPath: string,
  audioPath: string,
  outputPath: string,
  transcodeVideo: boolean,
): Promise<void> {
  await ffmpeg.exec([
    '-y',
    '-i', videoPath,
    '-i', audioPath,
    '-map', '0:v:0',
    '-map', '1:a:0',
    ...(transcodeVideo
      ? ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23']
      : ['-c:v', 'copy']),
    '-c:a', 'aac',
    '-movflags', '+faststart',
    '-shortest',
    outputPath,
  ]);
}
