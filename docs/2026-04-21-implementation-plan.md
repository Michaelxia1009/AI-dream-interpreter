# AI Dream Interpreter — Implementation Plan (v1 Prototype)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js web prototype that turns a described dream into a 10-second narrated video OR an image carousel, plus a scored "Dream Report Card," with direct-download sharing and IP+fingerprint rate limiting.

**Architecture:** Single Next.js 16 (App Router) app deployed on Vercel. Client state persists via `sessionStorage` + React Context between the 6 screens. Stateless server-side: each API route calls Claude (via Vercel AI Gateway), image/video/TTS providers, and writes generated artifacts to Vercel Blob (24h TTL). Rate limiting in Upstash Redis. Video+audio muxed client-side via `@ffmpeg/ffmpeg` WebAssembly to avoid shipping ffmpeg in a function.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vercel AI SDK v6, Vercel AI Gateway (`anthropic/claude-sonnet-4-6`), Upstash Redis + Ratelimit, Vercel Blob, Replicate (Flux 1.1 Pro for images), Luma Dream Machine (video), ElevenLabs (TTS), `@ffmpeg/ffmpeg` (client mux), `jszip`, `@fingerprintjs/fingerprintjs`, Vitest, Playwright.

**Spec reference:** [`./2026-04-21-design-spec.md`](./2026-04-21-design-spec.md)

---

## File Structure (created by this plan)

```
ai-dream-interpreter/
├── vercel.ts                              # Deployment config (replaces vercel.json)
├── .env.example                           # All required env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── app/
│   ├── layout.tsx                         # Root layout
│   ├── globals.css                        # Tailwind + theme tokens
│   ├── page.tsx                           # Screen 1: Landing
│   ├── capture/page.tsx                   # Screen 2: Capture + AI interview
│   ├── format/page.tsx                    # Screen 3: Format choice
│   ├── style/page.tsx                     # Screen 4: Style picker
│   ├── generate/page.tsx                  # Screen 5: Generation progress
│   ├── result/[id]/page.tsx               # Screen 6: Result display
│   ├── rate-limited/page.tsx              # Edge: rate-limited modal page
│   └── api/
│       ├── interview/route.ts             # POST: streaming interview Qs
│       ├── score/route.ts                 # POST: metrics + style ranks
│       ├── styles/alternates/route.ts     # POST: 3 new style alternates
│       ├── generate/carousel/route.ts     # POST: kickoff carousel gen
│       ├── generate/video/route.ts        # POST: kickoff video gen (returns video URL + TTS URL)
│       ├── generate/status/[jobId]/route.ts # GET: poll generation status
│       └── quota/route.ts                 # GET: remaining generations
├── lib/
│   ├── styles.ts                          # Curated style library + narrator map
│   ├── ratelimit.ts                       # Upstash-backed rate limiter
│   ├── fingerprint.ts                     # Browser fingerprint (client)
│   ├── state.ts                           # sessionStorage + Context dream session
│   ├── ai/
│   │   ├── client.ts                      # AI SDK wrapper configured for Gateway
│   │   ├── interview.ts                   # Interview prompt + runner
│   │   ├── score.ts                       # Metrics + style-match prompt/runner
│   │   ├── scenePrompt.ts                 # Scene prompt builder for image/video gen
│   │   └── narration.ts                   # ~30-40 word narration script builder
│   ├── providers/
│   │   ├── images.ts                      # Replicate/Flux client
│   │   ├── video.ts                       # Luma Dream Machine client
│   │   ├── tts.ts                         # ElevenLabs client
│   │   └── blob.ts                        # Vercel Blob upload helper (24h TTL)
│   └── mux/
│       └── clientMux.ts                   # @ffmpeg/ffmpeg client-side video+audio mux
├── components/
│   ├── ui/                                # shadcn/ui generated
│   ├── MicButton.tsx                      # Record button + Web Speech API
│   ├── ChatThread.tsx                     # Message list + input row
│   ├── FormatCard.tsx                     # Video/Carousel choice card
│   ├── StyleCard.tsx                      # Style option card
│   ├── ReportCard.tsx                     # Dream Report Card (4 metrics)
│   ├── LoadingScene.tsx                   # Screen 5 full-page ambient loader
│   ├── VideoPlayer.tsx                    # Looping muted-autoplay video
│   ├── Carousel.tsx                       # Swipeable image carousel
│   └── HeroLoop.tsx                       # Landing-page background video
├── prompts/
│   ├── interview.system.md
│   ├── score.system.md
│   ├── scene.system.md
│   └── narration.system.md
├── tests/
│   ├── unit/
│   │   ├── styles.test.ts
│   │   ├── ratelimit.test.ts
│   │   ├── interview.test.ts
│   │   ├── score.test.ts
│   │   └── scenePrompt.test.ts
│   └── e2e/
│       ├── happy-path.spec.ts
│       ├── rate-limit.spec.ts
│       └── mic-denied.spec.ts
└── public/
    └── sample-dream.mp4                   # Landing hero loop
```

---

## Phase 0 — Project Bootstrap

### Task 0.1: Scaffold Next.js 16 project

**Files:** Initialize entire project.

- [ ] **Step 1: Create Next.js app**

```bash
cd "/Users/zhihanxia/Dropbox (Michael Xia)/Mac/Desktop/Claude/AI dream interpreter"
npx create-next-app@latest app-src --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --no-turbopack --yes
```

Note: installs into subdir `app-src/` to keep `docs/` at repo root. After install, move contents to repo root:

```bash
shopt -s dotglob && mv app-src/* ./ && rmdir app-src
```

- [ ] **Step 2: Verify scaffold**

```bash
npm run dev
```
Expected: dev server at `http://localhost:3000` renders default Next.js page. Kill with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 16 + TypeScript + Tailwind"
```

### Task 0.2: Install runtime + dev dependencies

**Files:** `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm i ai @ai-sdk/gateway @upstash/redis @upstash/ratelimit @vercel/blob @vercel/analytics zod uuid jszip @fingerprintjs/fingerprintjs @ffmpeg/ffmpeg @ffmpeg/util replicate elevenlabs lumaai framer-motion lucide-react sonner clsx tailwind-merge
```

- [ ] **Step 2: Install dev deps**

```bash
npm i -D vitest @vitest/ui @testing-library/react @testing-library/dom jsdom @playwright/test @types/uuid
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install runtime and test deps"
```

### Task 0.3: Install shadcn/ui and base components

**Files:** `components.json`, `components/ui/*`

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init -y --base-color=zinc
```

- [ ] **Step 2: Install components used throughout**

```bash
npx shadcn@latest add button card dialog input textarea progress toast sonner -y
```

- [ ] **Step 3: Commit**

```bash
git add components.json components/ lib/utils.ts app/globals.css
git commit -m "chore: add shadcn/ui base components"
```

### Task 0.4: Configure env vars, vercel.ts, and test runners

**Files:**
- Create: `.env.example`
- Create: `vercel.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Write `.env.example`**

```bash
# Vercel AI Gateway (routes to Claude)
AI_GATEWAY_API_KEY=

# Image gen (Replicate)
REPLICATE_API_TOKEN=

# Video gen (Luma Dream Machine)
LUMAAI_API_KEY=

# TTS (ElevenLabs)
ELEVENLABS_API_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Public
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Write `vercel.ts`**

```typescript
import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  functions: {
    'app/api/generate/**/route.ts': { maxDuration: 300 },
    'app/api/interview/route.ts': { maxDuration: 60 },
    'app/api/score/route.ts': { maxDuration: 30 },
  },
};
```

- [ ] **Step 3: Write `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 4: Write `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'mobile', use: { ...devices['iPhone 14'] } }],
});
```

- [ ] **Step 5: Add scripts to `package.json`**

Edit `package.json` scripts block:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add .env.example vercel.ts vitest.config.ts playwright.config.ts package.json
git commit -m "chore: configure env, vercel.ts, vitest, playwright"
```

---

## Phase 1 — Curated Style Library

### Task 1.1: Write the style library module

**Files:**
- Create: `lib/styles.ts`
- Test: `tests/unit/styles.test.ts`

- [ ] **Step 1: Write failing test `tests/unit/styles.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { STYLES, getStyleById, listStyleIds } from '@/lib/styles';

describe('style library', () => {
  it('exports exactly 10 styles', () => {
    expect(STYLES).toHaveLength(10);
  });

  it('every style has required fields', () => {
    for (const s of STYLES) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
      expect(s.name).toBeTruthy();
      expect(s.vibe).toBeTruthy();
      expect(s.imagePromptSuffix).toBeTruthy();
      expect(s.narratorVoiceId).toMatch(/^elv_/);
      expect(s.narratorPersona).toBeTruthy();
      expect(Array.isArray(s.moodTags)).toBe(true);
      expect(s.moodTags.length).toBeGreaterThan(0);
    }
  });

  it('all ids unique', () => {
    const ids = STYLES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getStyleById returns correct style', () => {
    expect(getStyleById('ghibli-dream')?.name).toBe('Studio Ghibli Dream');
    expect(getStyleById('nonexistent')).toBeUndefined();
  });

  it('listStyleIds returns all ids', () => {
    expect(listStyleIds()).toEqual(STYLES.map(s => s.id));
  });
});
```

- [ ] **Step 2: Verify test fails**

```bash
npm test
```
Expected: FAIL — "Cannot find module '@/lib/styles'"

- [ ] **Step 3: Implement `lib/styles.ts`**

```typescript
export interface Style {
  id: string;
  name: string;
  vibe: string;                // 1-line description shown on style card
  imagePromptSuffix: string;   // appended to scene prompt for image/video gen
  narratorVoiceId: string;     // ElevenLabs voice id (replace with real ids post-casting)
  narratorPersona: string;     // shown on style card in video mode
  moodTags: string[];          // used for style-match heuristic
}

export const STYLES: Style[] = [
  {
    id: 'ghibli-dream',
    name: 'Studio Ghibli Dream',
    vibe: 'Whimsical anime in warm, painterly light',
    imagePromptSuffix: 'in the style of Studio Ghibli, hand-painted animation cel, warm cinematic color, soft volumetric lighting',
    narratorVoiceId: 'elv_rachel_warmstoryteller',
    narratorPersona: 'Warm Storyteller',
    moodTags: ['wonder', 'nature', 'flight', 'nostalgia', 'gentle'],
  },
  {
    id: 'watercolor-memory',
    name: 'Watercolor Memory',
    vibe: 'Soft, painterly, bleeding-ink nostalgia',
    imagePromptSuffix: 'loose watercolor painting, bleeding ink edges, cream paper texture, muted palette, analog imperfection',
    narratorVoiceId: 'elv_bella_asmr',
    narratorPersona: 'Soft Whisper',
    moodTags: ['nostalgia', 'childhood', 'family', 'reflective', 'melancholy'],
  },
  {
    id: 'noir-pulp',
    name: 'Noir Pulp',
    vibe: 'High-contrast B&W cinematic tension',
    imagePromptSuffix: 'film noir black and white, deep shadows, chiaroscuro, venetian-blind light, 1940s pulp aesthetic, 35mm grain',
    narratorVoiceId: 'elv_adam_detective',
    narratorPersona: 'Gravelly Detective',
    moodTags: ['mystery', 'chase', 'tension', 'urban', 'suspense'],
  },
  {
    id: 'vhs-horror',
    name: '80s VHS Horror',
    vibe: 'Analog grain, neon, creeping unease',
    imagePromptSuffix: '1980s VHS horror aesthetic, heavy analog grain, chromatic aberration, neon magenta rim light, CRT scanlines',
    narratorVoiceId: 'elv_antoni_deep',
    narratorPersona: 'Ominous Voice',
    moodTags: ['nightmare', 'creepy', 'uncanny', 'fear', 'dark'],
  },
  {
    id: 'renaissance',
    name: 'Renaissance Painting',
    vibe: 'Oil-painting drama, gold-leaf gravitas',
    imagePromptSuffix: 'Italian Renaissance oil painting, dramatic chiaroscuro lighting, gold leaf, classical composition, museum texture',
    narratorVoiceId: 'elv_arnold_classical',
    narratorPersona: 'Classical Orator',
    moodTags: ['grand', 'mythic', 'religious', 'epic', 'heroic'],
  },
  {
    id: 'claymation',
    name: 'Claymation',
    vibe: 'Aardman-style stop-motion whimsy',
    imagePromptSuffix: 'Aardman claymation stop-motion, visible fingerprints on clay, studio lighting, slightly asymmetric handmade charm',
    narratorVoiceId: 'elv_clyde_british',
    narratorPersona: 'Playful British Narrator',
    moodTags: ['absurd', 'playful', 'weird', 'humor', 'whimsical'],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    vibe: 'Pastel synthwave, dreamy haze',
    imagePromptSuffix: 'vaporwave aesthetic, pastel pink and cyan, checkered floors, classical statues, dreamy haze, 90s web graphics',
    narratorVoiceId: 'elv_dorothy_ethereal',
    narratorPersona: 'Ethereal Voice',
    moodTags: ['euphoric', 'floating', 'surreal', 'dreamy', 'otherworldly'],
  },
  {
    id: 'pixar-render',
    name: 'Pixar Render',
    vibe: 'Polished 3D, golden-hour warmth',
    imagePromptSuffix: 'Pixar-style 3D render, subsurface scattering, golden-hour lighting, expressive character design, Disney-Pixar aesthetic',
    narratorVoiceId: 'elv_drew_vo',
    narratorPersona: 'Warm Voiceover',
    moodTags: ['family', 'joyful', 'heroic', 'hopeful', 'adventure'],
  },
  {
    id: 'lofi-sketch',
    name: 'Lo-fi Sketch',
    vibe: 'Casual pencil and ink, the everyday',
    imagePromptSuffix: 'loose pencil sketch with ink wash, visible hatching, white margins, zine aesthetic, casual linework',
    narratorVoiceId: 'elv_josh_casual',
    narratorPersona: 'Casual Narrator',
    moodTags: ['mundane', 'quiet', 'reflective', 'everyday', 'calm'],
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    vibe: 'Blade Runner rain, neon-drenched city',
    imagePromptSuffix: 'cyberpunk neon cityscape, Blade Runner aesthetic, holographic advertisements, rain-soaked streets, volumetric neon fog',
    narratorVoiceId: 'elv_ethan_synth',
    narratorPersona: 'Synthetic Voice',
    moodTags: ['urban', 'tech', 'dystopian', 'dark', 'future'],
  },
];

export const getStyleById = (id: string): Style | undefined =>
  STYLES.find(s => s.id === id);

export const listStyleIds = (): string[] => STYLES.map(s => s.id);
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/styles.ts tests/unit/styles.test.ts
git commit -m "feat: curated style library with narrator mappings"
```

---

## Phase 2 — Rate Limiter

### Task 2.1: IP+fingerprint rate limiter

**Files:**
- Create: `lib/ratelimit.ts`
- Test: `tests/unit/ratelimit.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/ratelimit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRateLimitKey } from '@/lib/ratelimit';

describe('buildRateLimitKey', () => {
  it('combines ip + user agent + fingerprint into stable sha256 prefix', () => {
    const k1 = buildRateLimitKey('1.2.3.4', 'Mozilla/5.0', 'fp-abc');
    const k2 = buildRateLimitKey('1.2.3.4', 'Mozilla/5.0', 'fp-abc');
    expect(k1).toBe(k2);
    expect(k1).toMatch(/^rl:[a-f0-9]{16}$/);
  });

  it('different inputs produce different keys', () => {
    const a = buildRateLimitKey('1.2.3.4', 'ua', 'fp');
    const b = buildRateLimitKey('1.2.3.5', 'ua', 'fp');
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Verify it fails**

```bash
npm test
```
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `lib/ratelimit.ts`**

```typescript
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createHash } from 'node:crypto';

const DAILY_LIMIT = 3;

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (_ratelimit) return _ratelimit;
  const redis = Redis.fromEnv();
  _ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(DAILY_LIMIT, '24 h'),
    prefix: 'dream-rl',
    analytics: false,
  });
  return _ratelimit;
}

export function buildRateLimitKey(
  ip: string,
  userAgent: string,
  fingerprint: string,
): string {
  const raw = `${ip}|${userAgent}|${fingerprint}`;
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `rl:${hash}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

export async function checkAndConsume(
  key: string,
): Promise<RateLimitResult> {
  const rl = getRatelimit();
  const { success, remaining, reset } = await rl.limit(key);
  return { allowed: success, remaining, resetAt: reset };
}

export async function peek(key: string): Promise<RateLimitResult> {
  const redis = Redis.fromEnv();
  const count = (await redis.get<number>(`dream-rl:${key}`)) ?? 0;
  const ttl = await redis.pttl(`dream-rl:${key}`);
  return {
    allowed: count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - count),
    resetAt: Date.now() + (ttl > 0 ? ttl : 24 * 60 * 60 * 1000),
  };
}

export const DAILY_GENERATION_LIMIT = DAILY_LIMIT;
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ratelimit.ts tests/unit/ratelimit.test.ts
git commit -m "feat: ip+fingerprint rate limiter (3/day)"
```

### Task 2.2: Browser fingerprint helper

**Files:**
- Create: `lib/fingerprint.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/fingerprint.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let _cached: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (_cached) return _cached;
  if (typeof window === 'undefined') return 'ssr';
  const fp = await FingerprintJS.load();
  const { visitorId } = await fp.get();
  _cached = visitorId;
  return visitorId;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/fingerprint.ts
git commit -m "feat: client-side browser fingerprint"
```

### Task 2.3: Quota endpoint

**Files:**
- Create: `app/api/quota/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/api/quota/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildRateLimitKey, peek, DAILY_GENERATION_LIMIT } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp') ?? 'no-fp';
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';
  const key = buildRateLimitKey(ip, ua, fp);
  const result = await peek(key);
  return NextResponse.json({
    limit: DAILY_GENERATION_LIMIT,
    remaining: result.remaining,
    resetAt: result.resetAt,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/quota/route.ts
git commit -m "feat: /api/quota returns remaining generations"
```

---

## Phase 3 — LLM Interview API

### Task 3.1: Interview system prompt

**Files:**
- Create: `prompts/interview.system.md`

- [ ] **Step 1: Write prompt**

```markdown
You are a gentle, imaginative dream interpreter guiding a user through describing their dream so it can be turned into a short video or image sequence.

RULES:
- Ask ONE follow-up question at a time.
- Ask a MAXIMUM of 4 follow-ups. Usually 2-3 is enough.
- When the dream has enough detail to generate cinematic scenes, STOP asking and emit a special control token: `<DONE>`.
- Focus follow-ups on whichever of these dimensions are most underspecified in the dream: setting, characters, mood/emotion, sensory details (light, color, sound), key objects, the "twist" or strangest moment.
- Never ask about symbolism or "what it means." Never offer interpretations. You are collecting raw detail, not analyzing.
- Tone: curious, warm, brief. Max one sentence per question.
- Never break character or mention that you are an AI.

INPUT: The user's dream so far (may be fragmented).
OUTPUT: Either one brief question (no preamble) OR the literal token `<DONE>` on its own line.

EXAMPLES:
Input: "I was running through a forest and suddenly I could fly."
Output: "What was the forest like — dense, misty, sunlit?"

Input: "I was in my old kitchen. My grandmother was there. She didn't speak. We just stood."
Output: "What was the light like in the kitchen?"

Input: "I was flying over a city made of teeth. The sky was green. I felt calm but also nervous. Below me people were waving. The buildings kept shifting shape."
Output: "<DONE>"
```

- [ ] **Step 2: Commit**

```bash
git add prompts/interview.system.md
git commit -m "feat: interview system prompt"
```

### Task 3.2: Interview runner + unit test

**Files:**
- Create: `lib/ai/client.ts`
- Create: `lib/ai/interview.ts`
- Test: `tests/unit/interview.test.ts`

- [ ] **Step 1: Write test for `parseInterviewOutput`**

```typescript
// tests/unit/interview.test.ts
import { describe, it, expect } from 'vitest';
import { parseInterviewOutput, shouldStopInterview } from '@/lib/ai/interview';

describe('parseInterviewOutput', () => {
  it('returns done:true for <DONE> token', () => {
    expect(parseInterviewOutput('<DONE>')).toEqual({ done: true });
    expect(parseInterviewOutput('  <DONE>  ')).toEqual({ done: true });
    expect(parseInterviewOutput('done')).not.toEqual({ done: true });
  });

  it('returns question for a question output', () => {
    expect(parseInterviewOutput('What color was the sky?')).toEqual({
      done: false,
      question: 'What color was the sky?',
    });
  });
});

describe('shouldStopInterview', () => {
  it('stops after 4 questions regardless of model', () => {
    expect(shouldStopInterview(4)).toBe(true);
    expect(shouldStopInterview(3)).toBe(false);
  });
});
```

- [ ] **Step 2: Verify fails**

```bash
npm test
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/ai/client.ts`**

```typescript
// lib/ai/client.ts
import { createGateway } from '@ai-sdk/gateway';

export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
});

export const CLAUDE_MODEL = 'anthropic/claude-sonnet-4-6';
```

- [ ] **Step 4: Implement `lib/ai/interview.ts`**

```typescript
// lib/ai/interview.ts
import { generateText } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gateway, CLAUDE_MODEL } from './client';

const MAX_QUESTIONS = 4;

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/interview.system.md'),
  'utf8',
);

export interface InterviewTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewStepResult {
  done: boolean;
  question?: string;
}

export function parseInterviewOutput(raw: string): InterviewStepResult {
  const trimmed = raw.trim();
  if (trimmed === '<DONE>') return { done: true };
  return { done: false, question: trimmed };
}

export function shouldStopInterview(questionsAsked: number): boolean {
  return questionsAsked >= MAX_QUESTIONS;
}

export async function nextInterviewStep(
  history: InterviewTurn[],
  questionsAsked: number,
): Promise<InterviewStepResult> {
  if (shouldStopInterview(questionsAsked)) return { done: true };

  const { text } = await generateText({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    messages: history,
    maxOutputTokens: 80,
    temperature: 0.8,
  });
  return parseInterviewOutput(text);
}

export function compileEnrichedDream(history: InterviewTurn[]): string {
  return history
    .map(t => (t.role === 'user' ? `USER: ${t.content}` : `Q: ${t.content}`))
    .join('\n');
}
```

- [ ] **Step 5: Run test**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ai/client.ts lib/ai/interview.ts tests/unit/interview.test.ts
git commit -m "feat: interview LLM runner with parsing"
```

### Task 3.3: /api/interview route

**Files:**
- Create: `app/api/interview/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/api/interview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nextInterviewStep, InterviewTurn } from '@/lib/ai/interview';

const Body = z.object({
  history: z.array(
    z.object({ role: z.enum(['user', 'assistant']), content: z.string() }),
  ),
  questionsAsked: z.number().int().min(0).max(10),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const { history, questionsAsked } = parsed.data;
  try {
    const result = await nextInterviewStep(
      history as InterviewTurn[],
      questionsAsked,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'interview failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/interview/route.ts
git commit -m "feat: /api/interview endpoint"
```

---

## Phase 4 — Scoring + Style-Match API

### Task 4.1: Scoring system prompt

**Files:**
- Create: `prompts/score.system.md`

- [ ] **Step 1: Write prompt**

```markdown
You are an entertainment-mode dream analyzer. You receive a compiled dream (user's initial description plus follow-up Q&A) and return two things:

1. Four metric scores, each 1-10 with a single short one-liner caption.
2. The three best-matching art styles from a given style library, ranked.

METRICS:
- weirdness: how surreal, logic-defying, impossible the dream is
- imagination: how creatively original (not cliché) the dream is
- emotionalIntensity: how emotionally charged (positive or negative)
- vividness: how sensorily rich (light, color, sound, touch)

ONE-LINER RULES:
- Under 10 words.
- Playful, never clinical or therapy-sounding.
- Never imply psychological meaning. Never use "subconscious," "repressed," "anxiety," etc.
- Good example for weirdness 9/10: "The dreamweaver is taking notes."
- Good example for vividness 3/10: "Rendered in soft-focus memory."

STYLE MATCHING:
- The user provides a list of available styles, each with moodTags.
- Return EXACTLY three style ids, ordered best-match first.
- Reasoning: consider tone, era, realism, color temperature, absurdity level.

OUTPUT: Strict JSON matching the schema provided. No markdown, no preamble.
```

- [ ] **Step 2: Commit**

```bash
git add prompts/score.system.md
git commit -m "feat: scoring + style-match system prompt"
```

### Task 4.2: Scoring runner + test

**Files:**
- Create: `lib/ai/score.ts`
- Test: `tests/unit/score.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/unit/score.test.ts
import { describe, it, expect } from 'vitest';
import { ScoreResultSchema } from '@/lib/ai/score';

describe('ScoreResultSchema', () => {
  it('accepts a valid payload', () => {
    const payload = {
      metrics: {
        weirdness: { score: 8, oneLiner: 'Mildly feral.' },
        imagination: { score: 7, oneLiner: 'Inspired.' },
        emotionalIntensity: { score: 5, oneLiner: 'Moderate.' },
        vividness: { score: 9, oneLiner: 'HD dreamspace.' },
      },
      matchedStyleIds: ['ghibli-dream', 'watercolor-memory', 'vaporwave'],
    };
    expect(() => ScoreResultSchema.parse(payload)).not.toThrow();
  });

  it('rejects out-of-range score', () => {
    const bad = {
      metrics: {
        weirdness: { score: 11, oneLiner: 'x' },
        imagination: { score: 7, oneLiner: 'x' },
        emotionalIntensity: { score: 5, oneLiner: 'x' },
        vividness: { score: 9, oneLiner: 'x' },
      },
      matchedStyleIds: ['a', 'b', 'c'],
    };
    expect(() => ScoreResultSchema.parse(bad)).toThrow();
  });

  it('rejects wrong number of matched ids', () => {
    const bad = {
      metrics: {
        weirdness: { score: 8, oneLiner: 'x' },
        imagination: { score: 7, oneLiner: 'x' },
        emotionalIntensity: { score: 5, oneLiner: 'x' },
        vividness: { score: 9, oneLiner: 'x' },
      },
      matchedStyleIds: ['a', 'b'],
    };
    expect(() => ScoreResultSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Verify it fails**

```bash
npm test
```
Expected: FAIL.

- [ ] **Step 3: Implement `lib/ai/score.ts`**

```typescript
// lib/ai/score.ts
import { generateObject } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { gateway, CLAUDE_MODEL } from './client';
import { STYLES, listStyleIds } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/score.system.md'),
  'utf8',
);

const MetricSchema = z.object({
  score: z.number().int().min(1).max(10),
  oneLiner: z.string().min(1).max(80),
});

export const ScoreResultSchema = z.object({
  metrics: z.object({
    weirdness: MetricSchema,
    imagination: MetricSchema,
    emotionalIntensity: MetricSchema,
    vividness: MetricSchema,
  }),
  matchedStyleIds: z.array(z.string()).length(3),
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;

export async function scoreDream(enrichedDream: string): Promise<ScoreResult> {
  const stylesContext = STYLES.map(s => ({
    id: s.id,
    name: s.name,
    moodTags: s.moodTags,
  }));
  const validIds = listStyleIds();

  const { object } = await generateObject({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    schema: ScoreResultSchema,
    prompt: [
      'DREAM:',
      enrichedDream,
      '',
      'AVAILABLE STYLES:',
      JSON.stringify(stylesContext, null, 2),
    ].join('\n'),
    temperature: 0.4,
  });

  // defensive: ensure returned ids are valid
  const filtered = object.matchedStyleIds.filter(id => validIds.includes(id));
  if (filtered.length !== 3) {
    const fillers = validIds.filter(id => !filtered.includes(id)).slice(0, 3 - filtered.length);
    object.matchedStyleIds = [...filtered, ...fillers];
  }
  return object;
}

export async function rerollStyles(
  enrichedDream: string,
  exclude: string[],
): Promise<string[]> {
  const remaining = listStyleIds().filter(id => !exclude.includes(id));
  if (remaining.length <= 3) return remaining.slice(0, 3);
  const result = await scoreDream(enrichedDream);
  const freshPicks = result.matchedStyleIds.filter(id => !exclude.includes(id));
  const fill = remaining.filter(id => !freshPicks.includes(id));
  return [...freshPicks, ...fill].slice(0, 3);
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/score.ts tests/unit/score.test.ts prompts/score.system.md
git commit -m "feat: scoring + style match with zod schema"
```

### Task 4.3: /api/score and /api/styles/alternates routes

**Files:**
- Create: `app/api/score/route.ts`
- Create: `app/api/styles/alternates/route.ts`

- [ ] **Step 1: Implement `/api/score`**

```typescript
// app/api/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scoreDream } from '@/lib/ai/score';

const Body = z.object({ enrichedDream: z.string().min(10).max(10_000) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  try {
    const result = await scoreDream(parsed.data.enrichedDream);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'scoring failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement `/api/styles/alternates`**

```typescript
// app/api/styles/alternates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rerollStyles } from '@/lib/ai/score';

const Body = z.object({
  enrichedDream: z.string(),
  exclude: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad body' }, { status: 400 });
  try {
    const ids = await rerollStyles(parsed.data.enrichedDream, parsed.data.exclude);
    return NextResponse.json({ matchedStyleIds: ids });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'reroll failed' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/score/route.ts app/api/styles/alternates/route.ts
git commit -m "feat: /api/score and /api/styles/alternates"
```

---

## Phase 5 — Scene & Narration Prompt Builders

### Task 5.1: Scene prompt builder

**Files:**
- Create: `prompts/scene.system.md`
- Create: `lib/ai/scenePrompt.ts`
- Test: `tests/unit/scenePrompt.test.ts`

- [ ] **Step 1: Write prompt `prompts/scene.system.md`**

```markdown
You translate a user's dream into cinematic generation prompts.

Depending on mode:

CAROUSEL mode: produce an array of 4-6 scene prompts, each a single vivid beat of the dream. Each prompt is a single sentence, ≤30 words, present-tense, visually concrete. Include camera framing (e.g., "wide shot", "low angle"). NO dialogue.

VIDEO mode: produce ONE single scene prompt for a 10-second clip. Include camera motion (e.g., "slow push in", "orbit"). Compose a beat that captures the most iconic moment of the dream. ≤40 words.

Always append the provided styleSuffix verbatim to each prompt.

OUTPUT: strict JSON. No markdown.
```

- [ ] **Step 2: Write failing test `tests/unit/scenePrompt.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { CarouselPromptsSchema, VideoPromptSchema } from '@/lib/ai/scenePrompt';

describe('scene prompt schemas', () => {
  it('carousel accepts 4-6 prompts', () => {
    expect(() =>
      CarouselPromptsSchema.parse({ prompts: ['a', 'b', 'c', 'd'] }),
    ).not.toThrow();
    expect(() => CarouselPromptsSchema.parse({ prompts: ['a'] })).toThrow();
    expect(() =>
      CarouselPromptsSchema.parse({ prompts: Array(7).fill('x') }),
    ).toThrow();
  });

  it('video accepts one prompt', () => {
    expect(() => VideoPromptSchema.parse({ prompt: 'a scene' })).not.toThrow();
    expect(() => VideoPromptSchema.parse({})).toThrow();
  });
});
```

- [ ] **Step 3: Verify it fails**

```bash
npm test
```

- [ ] **Step 4: Implement `lib/ai/scenePrompt.ts`**

```typescript
// lib/ai/scenePrompt.ts
import { generateObject } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { gateway, CLAUDE_MODEL } from './client';
import type { Style } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/scene.system.md'),
  'utf8',
);

export const CarouselPromptsSchema = z.object({
  prompts: z.array(z.string().min(5)).min(4).max(6),
});

export const VideoPromptSchema = z.object({
  prompt: z.string().min(5),
});

export async function buildCarouselPrompts(
  enrichedDream: string,
  style: Style,
): Promise<string[]> {
  const { object } = await generateObject({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    schema: CarouselPromptsSchema,
    prompt: `MODE: CAROUSEL\nSTYLE_SUFFIX: ${style.imagePromptSuffix}\nDREAM:\n${enrichedDream}`,
    temperature: 0.85,
  });
  return object.prompts.map(p => `${p}, ${style.imagePromptSuffix}`);
}

export async function buildVideoScenePrompt(
  enrichedDream: string,
  style: Style,
): Promise<string> {
  const { object } = await generateObject({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    schema: VideoPromptSchema,
    prompt: `MODE: VIDEO\nSTYLE_SUFFIX: ${style.imagePromptSuffix}\nDREAM:\n${enrichedDream}`,
    temperature: 0.85,
  });
  return `${object.prompt}, ${style.imagePromptSuffix}`;
}
```

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ai/scenePrompt.ts prompts/scene.system.md tests/unit/scenePrompt.test.ts
git commit -m "feat: scene prompt builders for carousel + video"
```

### Task 5.2: Narration builder

**Files:**
- Create: `prompts/narration.system.md`
- Create: `lib/ai/narration.ts`

- [ ] **Step 1: Write prompt `prompts/narration.system.md`**

```markdown
You write a single short narration for a 10-second dream video.

RULES:
- Exactly 30-40 words. Count carefully.
- First-person or omniscient — pick based on dream framing.
- Poetic, evocative, mysterious. NOT therapeutic or explanatory.
- No greetings or sign-offs. Just the narration text itself.
- Must be speakable naturally in ~10 seconds at a moderate pace.
- Match the narrator persona provided in the prompt.

OUTPUT: plain text narration only. No JSON. No quotes.
```

- [ ] **Step 2: Implement `lib/ai/narration.ts`**

```typescript
// lib/ai/narration.ts
import { generateText } from 'ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gateway, CLAUDE_MODEL } from './client';
import type { Style } from '@/lib/styles';

const SYSTEM_PROMPT = readFileSync(
  path.join(process.cwd(), 'prompts/narration.system.md'),
  'utf8',
);

export async function buildNarrationScript(
  enrichedDream: string,
  style: Style,
): Promise<string> {
  const { text } = await generateText({
    model: gateway(CLAUDE_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `NARRATOR: ${style.narratorPersona}\nDREAM:\n${enrichedDream}`,
    temperature: 0.9,
    maxOutputTokens: 120,
  });
  return text.trim();
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai/narration.ts prompts/narration.system.md
git commit -m "feat: narration script builder"
```

---

## Phase 6 — Media Providers

### Task 6.1: Replicate image provider (Flux 1.1 Pro)

**Files:**
- Create: `lib/providers/images.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/providers/images.ts
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

export async function generateImage(prompt: string): Promise<Buffer> {
  const output = await replicate.run(
    'black-forest-labs/flux-1.1-pro',
    {
      input: {
        prompt,
        aspect_ratio: '9:16',
        output_format: 'jpg',
        output_quality: 90,
        safety_tolerance: 5,
      },
    },
  );
  const url = Array.isArray(output) ? output[0] : (output as string);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function generateImages(prompts: string[]): Promise<Buffer[]> {
  return Promise.all(prompts.map(generateImage));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/providers/images.ts
git commit -m "feat: Replicate Flux 1.1 Pro image provider"
```

### Task 6.2: Luma Dream Machine video provider

**Files:**
- Create: `lib/providers/video.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/providers/video.ts
import LumaAI from 'lumaai';

const client = new LumaAI({ authToken: process.env.LUMAAI_API_KEY! });

export async function generateVideo(prompt: string): Promise<Buffer> {
  let gen = await client.generations.create({
    prompt,
    aspect_ratio: '9:16',
    duration: '10s',
  });

  const deadline = Date.now() + 4 * 60_000;
  while (Date.now() < deadline) {
    gen = await client.generations.get(gen.id);
    if (gen.state === 'completed' && gen.assets?.video) {
      const res = await fetch(gen.assets.video);
      if (!res.ok) throw new Error(`video fetch failed: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
    if (gen.state === 'failed') {
      throw new Error(`video gen failed: ${gen.failure_reason ?? 'unknown'}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('video gen timed out');
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/providers/video.ts
git commit -m "feat: Luma Dream Machine video provider"
```

### Task 6.3: ElevenLabs TTS provider

**Files:**
- Create: `lib/providers/tts.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/providers/tts.ts
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

export async function synthesizeNarration(
  text: string,
  voiceId: string,
): Promise<Buffer> {
  const audio = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_turbo_v2_5',
    output_format: 'mp3_44100_128',
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  });
  const chunks: Buffer[] = [];
  for await (const chunk of audio as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/providers/tts.ts
git commit -m "feat: ElevenLabs TTS provider"
```

### Task 6.4: Vercel Blob uploader

**Files:**
- Create: `lib/providers/blob.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/providers/blob.ts
import { put } from '@vercel/blob';

export async function uploadArtifact(
  pathname: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const { url } = await put(pathname, data, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
    cacheControlMaxAge: 24 * 60 * 60,
  });
  return url;
}
```

Note: blob deletion TTL is currently enforced by manual cleanup. Prototype leaves files for 24h; add a cron job in v1.1 if budget is a concern.

- [ ] **Step 2: Commit**

```bash
git add lib/providers/blob.ts
git commit -m "feat: Vercel Blob uploader"
```

---

## Phase 7 — Generation Endpoints

### Task 7.1: Carousel generation endpoint

**Files:**
- Create: `app/api/generate/carousel/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/api/generate/carousel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import JSZip from 'jszip';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildCarouselPrompts } from '@/lib/ai/scenePrompt';
import { generateImages } from '@/lib/providers/images';
import { uploadArtifact } from '@/lib/providers/blob';

export const maxDuration = 300;

const Body = z.object({
  enrichedDream: z.string().min(10),
  styleId: z.string(),
  fingerprint: z.string().min(4),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad body' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip') ?? '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';
  const key = buildRateLimitKey(ip, ua, parsed.data.fingerprint);
  const rl = await checkAndConsume(key);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  const style = getStyleById(parsed.data.styleId);
  if (!style) return NextResponse.json({ error: 'unknown style' }, { status: 400 });

  try {
    const prompts = await buildCarouselPrompts(parsed.data.enrichedDream, style);
    const images = await generateImages(prompts);

    const zip = new JSZip();
    images.forEach((img, i) => zip.file(`dream-${i + 1}.jpg`, img));
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));

    const id = uuid();
    const zipUrl = await uploadArtifact(
      `carousels/${id}.zip`,
      zipBuffer,
      'application/zip',
    );

    // upload each image individually for in-browser carousel display
    const imageUrls = await Promise.all(
      images.map((img, i) =>
        uploadArtifact(`carousels/${id}/image-${i + 1}.jpg`, img, 'image/jpeg'),
      ),
    );

    return NextResponse.json({
      id,
      kind: 'carousel',
      zipUrl,
      imageUrls,
      remaining: rl.remaining,
    });
  } catch (err) {
    console.error('carousel gen failed', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/generate/carousel/route.ts
git commit -m "feat: /api/generate/carousel endpoint"
```

### Task 7.2: Video generation endpoint

**Files:**
- Create: `app/api/generate/video/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/api/generate/video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildVideoScenePrompt } from '@/lib/ai/scenePrompt';
import { buildNarrationScript } from '@/lib/ai/narration';
import { generateVideo } from '@/lib/providers/video';
import { synthesizeNarration } from '@/lib/providers/tts';
import { uploadArtifact } from '@/lib/providers/blob';

export const maxDuration = 300;

const Body = z.object({
  enrichedDream: z.string().min(10),
  styleId: z.string(),
  fingerprint: z.string().min(4),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad body' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip') ?? '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';
  const key = buildRateLimitKey(ip, ua, parsed.data.fingerprint);
  const rl = await checkAndConsume(key);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  const style = getStyleById(parsed.data.styleId);
  if (!style) return NextResponse.json({ error: 'unknown style' }, { status: 400 });

  try {
    const [scenePrompt, narration] = await Promise.all([
      buildVideoScenePrompt(parsed.data.enrichedDream, style),
      buildNarrationScript(parsed.data.enrichedDream, style),
    ]);
    const [videoBuf, audioBuf] = await Promise.all([
      generateVideo(scenePrompt),
      synthesizeNarration(narration, style.narratorVoiceId),
    ]);

    const id = uuid();
    const [videoUrl, audioUrl] = await Promise.all([
      uploadArtifact(`videos/${id}/video.mp4`, videoBuf, 'video/mp4'),
      uploadArtifact(`videos/${id}/audio.mp3`, audioBuf, 'audio/mpeg'),
    ]);

    return NextResponse.json({
      id,
      kind: 'video',
      videoUrl,
      audioUrl,
      narrationText: narration,
      remaining: rl.remaining,
    });
  } catch (err) {
    console.error('video gen failed', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/generate/video/route.ts
git commit -m "feat: /api/generate/video endpoint"
```

---

## Phase 8 — Client-side Video+Audio Mux

### Task 8.1: ffmpeg client mux helper

**Files:**
- Create: `lib/mux/clientMux.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/mux/clientMux.ts
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
  return new Blob([data as Uint8Array], { type: 'video/mp4' });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/mux/clientMux.ts
git commit -m "feat: client-side ffmpeg mux for video+narration"
```

---

## Phase 9 — Client State + Context

### Task 9.1: Dream session context

**Files:**
- Create: `lib/state.ts`

- [ ] **Step 1: Implement**

```typescript
'use client';

import {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';

export interface InterviewTurn { role: 'user' | 'assistant'; content: string }
export interface Metric { score: number; oneLiner: string }
export interface ScoreResult {
  metrics: {
    weirdness: Metric;
    imagination: Metric;
    emotionalIntensity: Metric;
    vividness: Metric;
  };
  matchedStyleIds: string[];
}

export interface DreamSession {
  history: InterviewTurn[];
  enrichedDream: string | null;
  score: ScoreResult | null;
  format: 'video' | 'carousel' | null;
  styleId: string | null;
  generation: GenerationResult | null;
}

export type GenerationResult =
  | { id: string; kind: 'carousel'; zipUrl: string; imageUrls: string[] }
  | { id: string; kind: 'video'; videoUrl: string; audioUrl: string; narrationText: string };

const STORAGE_KEY = 'dream-session-v1';
const empty: DreamSession = {
  history: [],
  enrichedDream: null,
  score: null,
  format: null,
  styleId: null,
  generation: null,
};

interface Ctx {
  session: DreamSession;
  update(partial: Partial<DreamSession>): void;
  reset(): void;
}

const DreamCtx = createContext<Ctx | null>(null);

export function DreamProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DreamSession>(empty);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) try { setSession(JSON.parse(raw)); } catch {}
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  return (
    <DreamCtx.Provider value={{
      session,
      update: p => setSession(s => ({ ...s, ...p })),
      reset: () => { sessionStorage.removeItem(STORAGE_KEY); setSession(empty); },
    }}>{children}</DreamCtx.Provider>
  );
}

export function useDream(): Ctx {
  const ctx = useContext(DreamCtx);
  if (!ctx) throw new Error('useDream outside DreamProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/state.ts
git commit -m "feat: dream session context with sessionStorage"
```

### Task 9.2: Root layout wires provider + fonts

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { DreamProvider } from '@/lib/state';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const serif = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Dream Interpreter',
  description: 'Turn your dream into a 10-second video or carousel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} dark`}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <DreamProvider>
          {children}
          <Toaster theme="dark" position="top-center" />
        </DreamProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: root layout with fonts, provider, toaster, analytics"
```

---

## Phase 10 — Screen 1: Landing

### Task 10.1: Hero loop component + landing page

**Files:**
- Create: `components/HeroLoop.tsx`
- Modify: `app/page.tsx`
- Place a `public/sample-dream.mp4` file (placeholder — replace with real sample before launch)

- [ ] **Step 1: Implement `HeroLoop.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function HeroLoop() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  return (
    <video
      ref={ref}
      src="/sample-dream.mp4"
      muted
      loop
      playsInline
      autoPlay
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover opacity-60"
    />
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import Link from 'next/link';
import { HeroLoop } from '@/components/HeroLoop';

export default function LandingPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <HeroLoop />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-end px-6 pb-16 pt-32 text-center">
        <h1 className="font-serif text-5xl leading-tight tracking-tight sm:text-6xl">
          Turn your dream into a&nbsp;video.
        </h1>
        <p className="mt-4 max-w-md text-base text-zinc-300">
          Describe what you dreamed. We&apos;ll bring it to life in cinematic 10 seconds — or a carousel you can swipe through.
        </p>
        <Link
          href="/capture"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-medium text-black shadow-xl transition hover:scale-[1.02] hover:bg-zinc-100 active:scale-[0.98]"
        >
          Tell us your dream &rarr;
        </Link>
        <p className="mt-8 text-xs text-zinc-500">
          No account needed. 3 dreams a day on the house.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Place placeholder `public/sample-dream.mp4`**

Download any short muted looping video you have on hand (or generate one from Luma); put it at `public/sample-dream.mp4`. This is a placeholder; replace before launch. If none available, commit a 1-frame black MP4 as placeholder.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```
Open `http://localhost:3000` on a mobile viewport; confirm hero loop plays muted, CTA routes to `/capture`.

- [ ] **Step 5: Commit**

```bash
git add components/HeroLoop.tsx app/page.tsx public/sample-dream.mp4
git commit -m "feat: landing screen with hero video loop"
```

---

## Phase 11 — Screen 2: Capture + AI Interview

### Task 11.1: Mic button with Web Speech API

**Files:**
- Create: `components/MicButton.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onTranscript(text: string): void;
  onRecordingChange?(recording: boolean): void;
  disabled?: boolean;
}

// Minimal Web Speech API types
type SpeechRecognitionCtor = new () => SpeechRecognition;
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
}

export function MicButton({ onTranscript, onRecordingChange, disabled }: Props) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);
  const bufferRef = useRef<string>('');

  useEffect(() => {
    const Ctor: SpeechRecognitionCtor | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      bufferRef.current = text;
    };
    rec.onerror = () => stop();
    rec.onend = () => {
      setRecording(false);
      onRecordingChange?.(false);
      if (bufferRef.current.trim()) {
        onTranscript(bufferRef.current.trim());
        bufferRef.current = '';
      }
    };
    recRef.current = rec;
    return () => rec.stop();
  }, [onTranscript, onRecordingChange]);

  function start() {
    if (!recRef.current || disabled) return;
    try {
      bufferRef.current = '';
      recRef.current.start();
      setRecording(true);
      onRecordingChange?.(true);
    } catch {}
  }

  function stop() { recRef.current?.stop(); }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      aria-label={recording ? 'Stop recording' : 'Start recording'}
      className={`flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition ${
        recording ? 'bg-red-500 animate-pulse' : 'bg-white'
      } disabled:opacity-40`}
    >
      {recording
        ? <Square className="h-7 w-7 text-white fill-white" />
        : <Mic className="h-7 w-7 text-black" />}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/MicButton.tsx
git commit -m "feat: mic button with Web Speech API"
```

### Task 11.2: Chat thread component

**Files:**
- Create: `components/ChatThread.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { InterviewTurn } from '@/lib/state';

export function ChatThread({ turns, pending }: { turns: InterviewTurn[]; pending?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, pending]);

  return (
    <div className="flex flex-col gap-3 px-4 pb-32 pt-6">
      {turns.map((t, i) => (
        <div
          key={i}
          className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
            t.role === 'assistant'
              ? 'self-start bg-zinc-800 text-zinc-100'
              : 'self-end bg-white text-black'
          }`}
        >
          {t.content}
        </div>
      ))}
      {pending && (
        <div className="self-start rounded-2xl bg-zinc-800 px-4 py-3">
          <span className="inline-flex gap-1 [&>span]:h-2 [&>span]:w-2 [&>span]:animate-bounce [&>span]:rounded-full [&>span]:bg-zinc-400">
            <span /><span style={{ animationDelay: '120ms' }} /><span style={{ animationDelay: '240ms' }} />
          </span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ChatThread.tsx
git commit -m "feat: chat thread component"
```

### Task 11.3: /capture page with interview loop

**Files:**
- Create: `app/capture/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MicButton } from '@/components/MicButton';
import { ChatThread } from '@/components/ChatThread';
import { useDream, type InterviewTurn } from '@/lib/state';
import { toast } from 'sonner';

const OPENING: InterviewTurn = {
  role: 'assistant',
  content: 'What did you dream about?',
};

export default function CapturePage() {
  const router = useRouter();
  const { session, update } = useDream();
  const [turns, setTurns] = useState<InterviewTurn[]>(
    session.history.length ? session.history : [OPENING],
  );
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [qCount, setQCount] = useState(
    session.history.filter(t => t.role === 'assistant').length || 1,
  );
  const [done, setDone] = useState(false);

  async function submit(content: string) {
    const clean = content.trim();
    if (!clean) return;
    const nextTurns = [...turns, { role: 'user' as const, content: clean }];
    setTurns(nextTurns);
    setText('');
    setPending(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          history: nextTurns,
          questionsAsked: qCount,
        }),
      });
      if (!res.ok) throw new Error('interview failed');
      const data = await res.json();
      if (data.done) {
        setDone(true);
        update({
          history: nextTurns,
          enrichedDream: nextTurns.map(t => `${t.role === 'user' ? 'USER' : 'Q'}: ${t.content}`).join('\n'),
        });
        setTurns([...nextTurns, { role: 'assistant', content: 'Got it. Ready to see your dream?' }]);
      } else {
        setQCount(q => q + 1);
        setTurns([...nextTurns, { role: 'assistant', content: data.question }]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
        <span className="font-serif text-lg">Tell us your dream</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <ChatThread turns={turns} pending={pending} />
      </div>

      <div className="sticky bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/90 px-4 pb-6 pt-4 backdrop-blur">
        {done ? (
          <button
            onClick={() => router.push('/format')}
            className="w-full rounded-full bg-white px-6 py-4 font-medium text-black"
          >
            Continue &rarr;
          </button>
        ) : (
          <div className="flex items-end gap-3">
            <textarea
              rows={1}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type or tap the mic…"
              className="flex-1 resize-none rounded-2xl bg-zinc-900 px-4 py-3 text-[15px] placeholder:text-zinc-500 focus:outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(text); }
              }}
            />
            {text.trim() ? (
              <button
                onClick={() => submit(text)}
                disabled={pending}
                className="h-12 rounded-full bg-white px-5 font-medium text-black disabled:opacity-50"
              >
                Send
              </button>
            ) : (
              <MicButton onTranscript={submit} disabled={pending} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```
Type a dream; verify (with a real AI Gateway key) the AI asks follow-ups and ultimately returns `<DONE>` + shows Continue.

- [ ] **Step 3: Commit**

```bash
git add app/capture/page.tsx
git commit -m "feat: capture screen with interview loop"
```

---

## Phase 12 — Screen 3: Format Choice

### Task 12.1: Format card + page

**Files:**
- Create: `components/FormatCard.tsx`
- Create: `app/format/page.tsx`

- [ ] **Step 1: Implement `FormatCard.tsx`**

```tsx
'use client';

import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  onSelect(): void;
}

export function FormatCard({ icon, title, description, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="group flex h-full w-full flex-col items-start gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-left transition hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.99]"
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-zinc-300 group-hover:text-white">
        Choose &rarr;
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Implement `app/format/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormatCard } from '@/components/FormatCard';
import { useDream } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';

export default function FormatPage() {
  const router = useRouter();
  const { session, update } = useDream();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!session.enrichedDream) { router.replace('/capture'); return; }
    (async () => {
      const fp = await getFingerprint();
      const res = await fetch(`/api/quota?fp=${encodeURIComponent(fp)}`);
      if (res.ok) { const d = await res.json(); setRemaining(d.remaining); }
    })();
  }, [session.enrichedDream, router]);

  function pick(format: 'video' | 'carousel') {
    update({ format });
    router.push('/style');
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <h1 className="font-serif text-3xl">Pick a format</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {remaining !== null ? `${remaining} of 3 dreams left today` : 'Checking your quota…'}
      </p>
      <div className="mt-8 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        <FormatCard
          icon="🎬"
          title="10s Narrated Video"
          description="A short cinematic scene, narrated in a voice matched to your style."
          onSelect={() => pick('video')}
        />
        <FormatCard
          icon="🖼️"
          title="Image Carousel"
          description="A sequence of dreamlike images to swipe through."
          onSelect={() => pick('carousel')}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/FormatCard.tsx app/format/page.tsx
git commit -m "feat: format choice screen"
```

---

## Phase 13 — Screen 4: Style Picker

### Task 13.1: Style picker

**Files:**
- Create: `components/StyleCard.tsx`
- Create: `app/style/page.tsx`

- [ ] **Step 1: Implement `StyleCard.tsx`**

```tsx
'use client';

import type { Style } from '@/lib/styles';

interface Props {
  style: Style;
  showNarrator: boolean;
  onSelect(): void;
}

export function StyleCard({ style, showNarrator, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition hover:border-zinc-600 active:scale-[0.99]"
    >
      <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900" />
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg">{style.name}</h3>
        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{style.vibe}</p>
        {showNarrator && (
          <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            🎙 {style.narratorPersona}
          </p>
        )}
      </div>
      <span className="text-zinc-500">›</span>
    </button>
  );
}
```

Note: the gradient placeholder avoids needing pre-rendered thumbnails for v1. Replace with AI-rendered teaser images in v1.1.

- [ ] **Step 2: Implement `app/style/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StyleCard } from '@/components/StyleCard';
import { STYLES, getStyleById } from '@/lib/styles';
import { useDream } from '@/lib/state';
import { toast } from 'sonner';

export default function StylePage() {
  const router = useRouter();
  const { session, update } = useDream();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.enrichedDream || !session.format) { router.replace('/capture'); return; }
    (async () => {
      setLoading(true);
      try {
        if (!session.score) {
          const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ enrichedDream: session.enrichedDream }),
          });
          if (!res.ok) throw new Error('score failed');
          const data = await res.json();
          update({ score: data });
          setIds(data.matchedStyleIds);
        } else {
          setIds(session.score.matchedStyleIds);
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not match styles. Showing defaults.');
        setIds(STYLES.slice(0, 3).map(s => s.id));
      } finally {
        setLoading(false);
      }
    })();
  }, [session.enrichedDream, session.format, session.score, router, update]);

  async function shuffle() {
    setLoading(true);
    try {
      const res = await fetch('/api/styles/alternates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enrichedDream: session.enrichedDream, exclude: ids }),
      });
      const data = await res.json();
      setIds(data.matchedStyleIds);
    } catch { toast.error('Shuffle failed.'); }
    finally { setLoading(false); }
  }

  function pick(id: string) {
    update({ styleId: id });
    router.push('/generate');
  }

  const styles = ids.map(id => getStyleById(id)!).filter(Boolean);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <h1 className="font-serif text-3xl">Pick a style</h1>
      <p className="mt-2 text-sm text-zinc-400">
        We picked 3 that fit your dream. Tap one.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {loading
          ? [1, 2, 3].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
            ))
          : styles.map(s => (
              <StyleCard key={s.id} style={s} showNarrator={session.format === 'video'} onSelect={() => pick(s.id)} />
            ))}
      </div>
      <button
        onClick={shuffle}
        disabled={loading}
        className="mt-6 self-center text-sm text-zinc-400 underline-offset-4 hover:underline disabled:opacity-50"
      >
        ↻ Show different styles
      </button>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/StyleCard.tsx app/style/page.tsx
git commit -m "feat: style picker with reroll"
```

---

## Phase 14 — Screen 5: Generation

### Task 14.1: Loading scene

**Files:**
- Create: `components/LoadingScene.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Whispering to the dream-weaver…',
  'Stirring the subconscious…',
  'Painting with starlight…',
  'Asking the dream if it remembers…',
  'Letting the narrator find their voice…',
  'Arranging the impossible in the correct order…',
  'Calling back the shapes that got away…',
  'Rendering something you barely remember…',
];

export function LoadingScene() {
  const [i, setI] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const m = setInterval(() => setI(v => (v + 1) % MESSAGES.length), 3000);
    const e = setInterval(() => setElapsed(v => v + 1), 1000);
    return () => { clearInterval(m); clearInterval(e); };
  }, []);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.25)_0%,_transparent_60%)]" />
      <div className="relative z-10 max-w-xs text-center">
        <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="font-serif text-2xl leading-snug">{MESSAGES[i]}</p>
        <p className="mt-4 text-xs text-zinc-500">{elapsed}s</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LoadingScene.tsx
git commit -m "feat: loading scene with rotating copy"
```

### Task 14.2: Generate page

**Files:**
- Create: `app/generate/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScene } from '@/components/LoadingScene';
import { useDream, type GenerationResult } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';
import { toast } from 'sonner';

export default function GeneratePage() {
  const router = useRouter();
  const { session, update } = useDream();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!session.enrichedDream || !session.format || !session.styleId) {
      router.replace('/capture');
      return;
    }

    (async () => {
      try {
        const fp = await getFingerprint();
        const endpoint = session.format === 'video'
          ? '/api/generate/video'
          : '/api/generate/carousel';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            enrichedDream: session.enrichedDream,
            styleId: session.styleId,
            fingerprint: fp,
          }),
        });
        if (res.status === 429) {
          router.replace('/rate-limited');
          return;
        }
        if (!res.ok) throw new Error('generation failed');
        const data: GenerationResult = await res.json();
        update({ generation: data });
        router.replace(`/result/${data.id}`);
      } catch (err) {
        console.error(err);
        toast.error('The dream escaped us. Try again?');
        router.replace('/style');
      }
    })();
  }, [session, router, update]);

  return <LoadingScene />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/generate/page.tsx
git commit -m "feat: generation screen with kickoff + routing"
```

---

## Phase 15 — Screen 6: Result

### Task 15.1: Report card component

**Files:**
- Create: `components/ReportCard.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import type { ScoreResult } from '@/lib/state';

const METRIC_LABELS: Record<keyof ScoreResult['metrics'], string> = {
  weirdness: 'Weirdness',
  imagination: 'Imagination',
  emotionalIntensity: 'Emotional Intensity',
  vividness: 'Vividness',
};

export function ReportCard({ score }: { score: ScoreResult }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="font-serif text-xl">Dream Report Card</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(Object.keys(METRIC_LABELS) as (keyof ScoreResult['metrics'])[]).map(k => {
          const m = score.metrics[k];
          return (
            <div key={k}>
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wide text-zinc-400">{METRIC_LABELS[k]}</span>
                <span className="font-serif text-xl">{m.score}<span className="text-sm text-zinc-500">/10</span></span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                  style={{ width: `${m.score * 10}%` }}
                />
              </div>
              <p className="mt-2 text-sm italic text-zinc-300">“{m.oneLiner}”</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ReportCard.tsx
git commit -m "feat: Dream Report Card component"
```

### Task 15.2: Video player + carousel viewer

**Files:**
- Create: `components/VideoPlayer.tsx`
- Create: `components/Carousel.tsx`

- [ ] **Step 1: `VideoPlayer.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <video
        ref={ref}
        src={src}
        autoPlay loop playsInline muted={muted}
        className="h-full w-full object-cover"
      />
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `Carousel.tsx`**

```tsx
'use client';

import { useState } from 'react';

export function Carousel({ urls }: { urls: string[] }) {
  const [i, setI] = useState(0);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <div
        className="flex transition-transform duration-300"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {urls.map((u, idx) => (
          <img key={idx} src={u} alt="" className="h-full w-full flex-shrink-0 object-cover" />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {urls.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-1/3" onClick={() => setI(v => Math.max(0, v - 1))} />
      <div className="absolute inset-y-0 right-0 w-1/3" onClick={() => setI(v => Math.min(urls.length - 1, v + 1))} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/VideoPlayer.tsx components/Carousel.tsx
git commit -m "feat: video player + carousel viewer"
```

### Task 15.3: Result page with download

**Files:**
- Create: `app/result/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Carousel } from '@/components/Carousel';
import { ReportCard } from '@/components/ReportCard';
import { useDream } from '@/lib/state';
import { muxVideoWithAudio } from '@/lib/mux/clientMux';
import { toast } from 'sonner';

export default function ResultPage() {
  const router = useRouter();
  const { session, reset } = useDream();
  const [muxedUrl, setMuxedUrl] = useState<string | null>(null);
  const [muxing, setMuxing] = useState(false);

  useEffect(() => {
    if (!session.generation || !session.score) { router.replace('/'); return; }
    if (session.generation.kind === 'video') {
      setMuxing(true);
      (async () => {
        try {
          const blob = await muxVideoWithAudio(
            session.generation!.kind === 'video' ? session.generation.videoUrl : '',
            session.generation!.kind === 'video' ? session.generation.audioUrl : '',
          );
          setMuxedUrl(URL.createObjectURL(blob));
        } catch (err) {
          console.error(err);
          toast.error('Could not combine video and audio. Downloading silent version.');
          if (session.generation!.kind === 'video') setMuxedUrl(session.generation.videoUrl);
        } finally { setMuxing(false); }
      })();
    }
  }, [session.generation, session.score, router]);

  if (!session.generation || !session.score) return null;

  async function download() {
    if (session.generation!.kind === 'video') {
      const url = muxedUrl ?? session.generation!.videoUrl;
      const a = document.createElement('a');
      a.href = url;
      a.download = `dream-${session.generation!.id}.mp4`;
      a.click();
    } else {
      const a = document.createElement('a');
      a.href = session.generation!.zipUrl;
      a.download = `dream-${session.generation!.id}.zip`;
      a.click();
    }
    toast.success('Saved! Open Instagram or TikTok to share 🎉');
  }

  function newDream() { reset(); router.push('/'); }

  return (
    <main className="flex min-h-dvh flex-col gap-6 px-6 py-10">
      {session.generation.kind === 'video' ? (
        muxing ? (
          <div className="aspect-[9/16] animate-pulse rounded-3xl bg-zinc-900" />
        ) : (
          <VideoPlayer src={muxedUrl ?? session.generation.videoUrl} />
        )
      ) : (
        <div className="aspect-[9/16]"><Carousel urls={session.generation.imageUrls} /></div>
      )}

      <ReportCard score={session.score} />

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <button
          onClick={download}
          disabled={muxing}
          className="rounded-full bg-white px-6 py-4 font-medium text-black disabled:opacity-50"
        >
          ⬇ Download
        </button>
        <button
          onClick={newDream}
          className="rounded-full border border-zinc-700 px-6 py-4 font-medium"
        >
          + New Dream
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/result/[id]/page.tsx
git commit -m "feat: result screen with mux + download"
```

---

## Phase 16 — Edge States

### Task 16.1: Rate-limited page

**Files:**
- Create: `app/rate-limited/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFingerprint } from '@/lib/fingerprint';

export default function RateLimitedPage() {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const fp = await getFingerprint();
      const res = await fetch(`/api/quota?fp=${encodeURIComponent(fp)}`);
      if (res.ok) {
        const d = await res.json();
        setMsLeft(Math.max(0, d.resetAt - Date.now()));
      }
    })();
  }, []);

  useEffect(() => {
    if (msLeft === null) return;
    const t = setInterval(() => setMsLeft(v => (v !== null ? Math.max(0, v - 1000) : v)), 1000);
    return () => clearInterval(t);
  }, [msLeft]);

  const hrs = msLeft !== null ? Math.floor(msLeft / 3_600_000) : 0;
  const mins = msLeft !== null ? Math.floor((msLeft % 3_600_000) / 60_000) : 0;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-serif text-3xl">You&apos;ve dreamed 3 times today.</h1>
      <p className="text-zinc-400">
        {msLeft !== null
          ? `Come back in ${hrs}h ${mins}m.`
          : 'Come back tomorrow for more.'}
      </p>
      <Link href="/" className="rounded-full border border-zinc-700 px-6 py-3">Back to start</Link>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/rate-limited/page.tsx
git commit -m "feat: rate-limited page with countdown"
```

---

## Phase 17 — End-to-End Tests

### Task 17.1: Playwright happy-path test

**Files:**
- Create: `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Implement**

Note: this test requires all API keys in `.env.local`. Marked as `test.describe.serial` because we share one rate-limit slot.

```typescript
import { test, expect } from '@playwright/test';

test.describe.serial('happy path', () => {
  test('lands, captures, formats, styles, generates, downloads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading')).toContainText('Turn your dream');
    await page.getByRole('link', { name: /tell us your dream/i }).click();

    await expect(page).toHaveURL(/\/capture/);
    await page.getByPlaceholder(/type or tap the mic/i).fill(
      'I was flying over a city made of teeth and the sky was green. Below me people waved, and the buildings kept changing shape. I felt calm but uneasy.',
    );
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for interview to complete (AI returns <DONE> on rich input)
    await page.getByRole('button', { name: /continue/i }).click({ timeout: 60_000 });

    await expect(page).toHaveURL(/\/format/);
    await page.getByRole('button', { name: /carousel/i }).click();

    await expect(page).toHaveURL(/\/style/);
    await page.locator('button').filter({ hasText: /Dream|Memory|Noir|VHS|Renaissance|Claymation|Vaporwave|Pixar|Sketch|Neon/ }).first().click({ timeout: 30_000 });

    await expect(page).toHaveURL(/\/generate/);
    await expect(page).toHaveURL(/\/result\//, { timeout: 180_000 });

    await expect(page.getByRole('heading', { name: /dream report card/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run** (requires keys + dev server)

```bash
npm run test:e2e
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/happy-path.spec.ts
git commit -m "test: e2e happy path"
```

---

## Phase 18 — Deployment + Final Verification

### Task 18.1: Initial Vercel deploy

- [ ] **Step 1: Create Vercel project**

```bash
npm i -g vercel@latest
vercel login
vercel link
```

- [ ] **Step 2: Set production env vars**

```bash
vercel env add AI_GATEWAY_API_KEY
vercel env add REPLICATE_API_TOKEN
vercel env add LUMAAI_API_KEY
vercel env add ELEVENLABS_API_KEY
vercel env add BLOB_READ_WRITE_TOKEN
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

- [ ] **Step 3: Provision marketplace addons**

From Vercel dashboard: install Upstash Redis integration and Vercel Blob storage. Copy credentials into the envs above.

- [ ] **Step 4: Deploy to production**

```bash
vercel deploy --prod --yes
```

- [ ] **Step 5: Smoke test on the production URL**

Run through the full flow on iOS Safari, Android Chrome, desktop Chrome. Confirm:
- Landing hero plays muted
- Capture interview completes in ≤4 Q&A
- Format, style screens render and match dream
- Video generation completes <120s; carousel <60s
- Download produces a usable MP4 / ZIP
- 4th generation on same device is rate-limited

- [ ] **Step 6: Commit & tag**

```bash
git tag v0.1.0-prototype
git push origin main --tags
```

---

## Self-Review Notes (by author, 2026-04-21)

**Spec coverage check:**
- All 10 locked decisions traced to tasks above (persona & share urge are UX outcomes, encoded in copy + layout).
- 6 screens each have a dedicated phase.
- Rate limiting (Task 2.1), fingerprinting (Task 2.2), quota UI (Tasks 2.3 + 12.1 + 16.1) all present.
- Dream Report Card metrics exactly match the spec: Weirdness, Imagination, Emotional Intensity, Vividness.

**Placeholder scan:** The only placeholders are (a) ElevenLabs voice IDs (require casting before launch — flagged in Task 1.1 and Open Questions in spec), (b) `public/sample-dream.mp4` (flagged in Task 10.1), (c) style-card thumbnails (gradient placeholder in Task 13.1, flagged as v1.1 work). All are legitimate pre-launch content work, not implementation ambiguity.

**Type consistency:** `GenerationResult` discriminated union in `lib/state.ts` matches API response shapes in Tasks 7.1 and 7.2. `ScoreResult` schema in `lib/ai/score.ts` matches context schema in `lib/state.ts`. `Style` interface imported consistently.

**Out-of-scope guardrail:** no tasks for accounts, archive, feed, payments, native apps, deep-link sharing, or watermarking — matches spec.

---

## Execution Handoff

Plan complete and saved to `docs/2026-04-21-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for this plan because each task is self-contained and reviewable.

**2. Inline Execution** — Execute tasks in this session with checkpoints. Higher context load but lets you see every step inline.

Which approach?
