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
  await ffmpeg.writeFile('in.mp4', await fetchFile(videoUrl));
  await ffmpeg.writeFile('in.mp3', await fetchFile(audioUrl));
  await ffmpeg.exec([
    '-i', 'in.mp4',
    '-i', 'in.mp3',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    'out.mp4',
  ]);
  const data = await ffmpeg.readFile('out.mp4');
  const bytes = new Uint8Array(data as Uint8Array);
  return new Blob([bytes], { type: 'video/mp4' });
}
