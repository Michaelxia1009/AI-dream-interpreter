import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BENCH_BASE_URL ?? 'http://localhost:3000';
const PROVIDERS = [
  'hailuo',
  'wan25',
  'seedance-pro',
  'seedance-lite',
  'kling-turbo',
];

const CASES = [
  {
    id: 'sparse',
    prompt: [
      'DREAM TYPE: normal',
      'MOOD: strange',
      'USER: I was walking through a moonlit hallway and every door opened into the same empty room.',
    ].join('\n'),
  },
  {
    id: 'mid',
    prompt: [
      'DREAM TYPE: recurring',
      'MOOD: peaceful',
      'USER: I floated above a city of paper lanterns while my childhood dog ran across the rooftops below.',
    ].join('\n'),
  },
  {
    id: 'vivid',
    prompt: [
      'DREAM TYPE: nightmare',
      'MOOD: anxious',
      'USER: A glass ocean rose into the sky, whales sang through thunderclouds, and my hands turned into bright blue moths.',
    ].join('\n'),
  },
];

const SCORE = {
  metrics: {
    weirdness: { score: 7, oneLiner: 'Surreal benchmark imagery.' },
    imagination: { score: 8, oneLiner: 'Enough visual detail to stress prompt following.' },
    emotionalIntensity: { score: 6, oneLiner: 'Clear mood without overwhelming the scene.' },
    vividness: { score: 8, oneLiner: 'Concrete visual anchors for comparison.' },
  },
  blurb: 'Benchmark dream',
  moderation: { ok: true, flags: [] },
  symbols: ['benchmark', 'dream'],
};

const rows = [];

for (const provider of PROVIDERS) {
  for (const testCase of CASES) {
    rows.push(await runCase(provider, testCase));
  }
}

const now = new Date();
const fileStamp = now.toISOString().replace(/[:.]/g, '-');
const outPath = `bench/video-bench-${fileStamp}.md`;

await mkdir('bench', { recursive: true });
await writeFile(outPath, renderReport(now, rows));
console.log(`Wrote ${outPath}`);

async function runCase(provider, testCase) {
  const url = new URL('/api/generate/video', BASE_URL);
  url.searchParams.set('provider', provider);
  url.searchParams.set('debug', '1');

  const startedAt = Date.now();
  const body = {
    enrichedDream: testCase.prompt,
    styleId: 'ghibli-dream',
    fingerprint: `bench-${provider}-${testCase.id}-${startedAt}`,
    score: SCORE,
    isPublic: false,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    });
    const text = await res.text();
    const json = tryJson(text);
    return {
      caseId: testCase.id,
      provider,
      status: res.status,
      ok: res.ok,
      wallClockMs: Date.now() - startedAt,
      timings: json?._timings ?? {},
      modelLabel: json?._provider?.modelLabel ?? '',
      videoUrl: json?.videoUrl ?? '',
      error: res.ok ? '' : (json?.error ?? truncate(text)),
    };
  } catch (err) {
    return {
      caseId: testCase.id,
      provider,
      status: 'error',
      ok: false,
      wallClockMs: Date.now() - startedAt,
      timings: {},
      modelLabel: '',
      videoUrl: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function renderReport(date, data) {
  const lines = [
    '# Video Provider Benchmark',
    '',
    `Generated: ${date.toISOString()}`,
    `Base URL: ${BASE_URL}`,
    '',
    '| Case | Provider | Model | Status | Scene | Narration | Video | TTS | Mux | Upload | Total | Wall | Video URL / Error |',
    '|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ];

  for (const row of data) {
    const t = row.timings;
    lines.push(`|${[
      row.caseId,
      row.provider,
      row.modelLabel,
      row.status,
      ms(t.scenePromptMs),
      ms(t.narrationMs),
      ms(t.videoMs),
      ms(t.ttsMs),
      ms(t.muxMs),
      ms(t.uploadMs),
      ms(t.totalMs),
      ms(row.wallClockMs),
      row.videoUrl || row.error,
    ].map(cell).join('|')}|`);
  }

  lines.push('', 'Review the 15 clips, pick a winner, then set `VIDEO_PROVIDER=<id>` locally and in deployment env vars.');
  return `${lines.join('\n')}\n`;
}

function ms(value) {
  return Number.isFinite(value) ? `${value}` : '';
}

function cell(value) {
  return ` ${String(value ?? '').replace(/\|/g, '\\|')} `;
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function truncate(text) {
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}
