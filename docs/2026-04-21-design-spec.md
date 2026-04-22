# AI Dream Interpreter — Product Design Spec (v1 Prototype)

## Context

Build a web-based prototype of an AI dream interpreter that transforms a user's dream description into either a 10-second narrated video or a swipeable image carousel — plus a shareable "Dream Report Card" with scored metrics. The product is aimed at the **"Daily Sharer"** persona: habitual social-media users who want share-worthy content, where the product itself creates the urge to share. The v1 goal is to validate the core "wow moment" (dream → polished, shareable media) with minimal infrastructure (no accounts, no archive, no in-app social feed) before investing further.

Source of truth: user's 1-page concept doc (`/Users/zhihanxia/Dropbox (Michael Xia)/Mac/Desktop/AI dream interpreter.docx`), refined via a 10-question brainstorming interview (see "Locked Decisions" below).

---

## Product Summary (one paragraph)

Users open a mobile-first web app, describe a dream in voice or text, and go through a short AI-guided interview (2–4 smart follow-up questions) that extracts the detail needed for high-quality generation. The app then scores the dream on four metrics (Weirdness, Imagination, Emotional Intensity, Vividness) with one-liner captions, lets the user choose **10s narrated video** or **image carousel**, and surfaces **3 AI-matched art styles** from a curated library. Each style ships with a paired narrator voice. Generation runs in ~30–90 seconds. The result screen autoplays the output, shows the Dream Report Card, and offers a one-tap download. No account required; abuse is mitigated by an IP+fingerprint rate limit (3 generations/day/device).

---

## Locked Decisions (from brainstorming interview)

| # | Decision | Locked Choice |
|---|---|---|
| 1 | **Primary persona** | Daily Sharer (habitual social-media sharer); UI must actively create share urge |
| 2 | **Output formats** | 10s narrated video **OR** image carousel (user picks per dream) |
| 3 | **Capture approach** | Conversational AI interview (2–4 smart follow-ups after initial capture) |
| 4 | **Style selection** | Curated library with AI auto-matching the 3 most suitable styles per dream |
| 5 | **App shape** | Pure generator tool — no accounts, no archive, no in-app social feed (v1) |
| 6 | **Platform** | Responsive web app, mobile-first |
| 7 | **Narration** | 5–10 curated ElevenLabs narrator personas, **auto-paired to the chosen visual style** |
| 8 | **Interpretation layer** | 4 scored metrics + one-liners: Weirdness, Imagination, Emotional Intensity, Vividness |
| 9 | **Share / export** | Direct download (MP4 for video, image bundle / ZIP for carousel) |
| 10 | **Cost gating** | Hard rate limit: 3 generations/day per IP + browser fingerprint, no login |

---

## User Journey (6 screens + edge states)

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. LANDING        │ Hero: sample dream video autoplays muted in    │
│                   │ background. Single CTA: "Tell us your dream ▸" │
├───────────────────┼────────────────────────────────────────────────┤
│ 2. CAPTURE +      │ Chat-style. AI opens: "What did you dream       │
│    AI INTERVIEW   │ about?" Big mic button (primary) + text input.  │
│                   │ After initial capture, AI asks 2–4 contextual   │
│                   │ follow-ups (setting, characters, mood, sensory, │
│                   │ twist). AI decides when done. "Continue ▸"      │
├───────────────────┼────────────────────────────────────────────────┤
│ 3. FORMAT CHOICE  │ Two large cards:                                │
│                   │  [🎬 10s Narrated Video] [🖼️ Image Carousel]   │
│                   │  Shows: "N generations left today"              │
├───────────────────┼────────────────────────────────────────────────┤
│ 4. STYLE PICKER   │ 3 AI-matched style cards with thumbnails. Each  │
│                   │ card shows style name, 1-line vibe description, │
│                   │ and paired narrator name (on video choice).     │
│                   │ Small "↻ Show different styles" button.         │
├───────────────────┼────────────────────────────────────────────────┤
│ 5. GENERATION     │ Full-screen ambient animation. Rotating copy:   │
│                   │ "Whispering to the dream-weaver…" "Stirring     │
│                   │ the subconscious…" "Painting with starlight…"   │
│                   │ Indeterminate progress + elapsed seconds.       │
│                   │ Target latency: ~30s carousel, ~60–90s video.   │
├───────────────────┼────────────────────────────────────────────────┤
│ 6. RESULT         │ Hero: generated video autoplays loop (muted     │
│                   │ with unmute button) OR carousel swipes.         │
│                   │ Dream Report Card below: 4 metrics scored 1–10  │
│                   │ with one-liners. Buttons: [⬇ Download] primary, │
│                   │ [+ New Dream] secondary.                        │
└──────────────────────────────────────────────────────────────────┘

Edge states:
• Rate limited   → Modal: "You've dreamed 3 times today. See you in [countdown]!"
• Gen failed     → "The dream escaped us. Try again?" (doesn't consume quota)
• Mic blocked    → Text-only capture; hide mic button, show inline hint
• Slow network   → After 120s, offer "Keep waiting" or "Try a shorter format"
```

**UX principles baked in:**
- Single-column, thumb-zone CTAs, mobile-first
- One primary action per screen (no decision paralysis)
- Generation wait reframed as anticipation (narrative loading copy) — builds the emotional peak for the "wow moment"
- Result screen IS the share moment — download is huge, metrics card is instantly screenshot-able

---

## Screen-by-Screen Functional Requirements

### Screen 1 — Landing
- Full-viewport background: muted autoplay loop of a pre-generated sample dream video (shows the product in action without any user action)
- H1 headline + short subhead (exact copy TBD)
- One large primary CTA button: `Tell us your dream ▸`
- Minimal footer: brand, legal links, tiny "How it works" disclosure
- **No sign-in, no email capture, no onboarding flow.**

### Screen 2 — Capture + AI Interview (merged chat)
- Chat-thread UI, system-initiated. First bubble: `What did you dream about?`
- Primary input: large mic button at bottom. Tap → record (live transcription shown) → tap again to stop.
- Secondary input: text field for typing.
- User's first message is treated as the seed dream.
- Backend LLM generates **2–4 follow-up questions** dynamically based on the initial dream's missing dimensions (setting, characters, mood, sensory detail, anomalies/twist). LLM decides when enough detail is gathered.
- Each follow-up is a chat bubble; user answers via voice or text.
- When interview completes, show a short "Ready?" summary + `Continue ▸` button.
- Mic permission prompt handled gracefully with text fallback.

### Screen 3 — Format Choice
- Two tall cards, stacked on mobile / side-by-side on wider viewports:
  - **🎬 10s Narrated Video** — "A short cinematic scene, narrated"
  - **🖼️ Image Carousel** — "A sequence of dreamlike images to swipe through"
- Quota badge: `2 of 3 generations left today`
- Tapping a card → advances to Style Picker

### Screen 4 — Style Picker
- 3 style cards, AI-matched from curated library (mood+theme-aware; see Style Library below)
- Each card shows: style name, 1-line vibe, thumbnail (ideally a teaser image generated in that style from the user's dream), paired narrator name (video mode only)
- `↻ Show different styles` — regenerates 3 alternates (does **not** count as a generation)
- Tapping a card → advances to Generation

### Screen 5 — Generation
- Full-screen ambient animation (proposal: slow abstract particle/ink animation over a darkened gradient)
- Rotating whimsical status copy (~6–10 lines, cycle every 3s)
- Elapsed timer or indeterminate progress bar
- No cancel button in v1 (simplifies state); timeout handling after 180s (show error with retry)

### Screen 6 — Result
- Autoplaying output at top (video loops muted with unmute toggle; carousel has swipe + dot indicators)
- **Dream Report Card** component: 4 metrics laid out in a 2×2 grid, each showing:
  - Metric name + score out of 10 (visual bar + number)
  - One-liner caption generated by LLM
- Buttons row:
  - `⬇ Download` (primary) — saves MP4 or ZIP of carousel images to device
  - `+ New Dream` (secondary) — returns to Landing
- Post-download tooltip: `Saved! Open Instagram or TikTok to share 🎉`

---

## Curated Style Library (v1 proposal — finalize with art review)

Proposing **8–10 styles** for v1. Each ships with a paired narrator voice and a mood-match heuristic so the AI matcher can rank styles vs. a dream's vibe.

| Style | Vibe | Mood match | Paired narrator (ElevenLabs voice archetype) |
|---|---|---|---|
| **Studio Ghibli Dream** | Whimsical anime, warm colors | Wonder, flying, nature | Warm storyteller (Rachel-type) |
| **Watercolor Memory** | Soft, painterly, nostalgic | Nostalgia, family, childhood | Soft ASMR-y female narrator |
| **Noir Pulp** | B&W high-contrast cinematic | Mystery, chase, tension | Gravelly detective male |
| **80s VHS Horror** | Analog grain, neon, unease | Nightmare, creepy, uncanny | Deep ominous male |
| **Renaissance Painting** | Oil-painting drama, chiaroscuro | Grand, mythic, religious | Classical British orator |
| **Claymation** | Aardman-style stop-motion | Absurd, playful, weird | Playful British narrator |
| **Vaporwave** | Pastel synthwave, dreamy haze | Euphoric, floating, surreal | Ethereal reverb-heavy female |
| **Pixar Render** | Polished 3D, warm lighting | Family, joyful, heroic | Warm professional voiceover |
| **Lo-fi Sketch** | Pencil/ink, casual linework | Mundane, quiet, reflective | Casual conversational voice |
| **Cyberpunk Neon** | Blade Runner aesthetic | Urban, tech, dystopian | Synthetic/filtered voice |

**Matching heuristic:** An LLM scores the dream on ~6 axes (tone, setting, era, color-temperature, realism, absurdity) and picks the 3 styles whose signature vibes best intersect. Matching logic to be tuned in testing.

---

## Dream Report Card — Metrics

**4 metrics for v1**, scored 1–10, each paired with an LLM-generated one-liner caption:

| Metric | Definition | Example one-liner |
|---|---|---|
| **Weirdness** | How surreal / logic-defying | 9/10 — "The dreamweaver is taking notes." |
| **Imagination** | Creative originality | 7/10 — "A respectable flight of fancy." |
| **Emotional Intensity** | Emotional charge | 4/10 — "Emotionally, a light breeze." |
| **Vividness** | Sensory richness | 8/10 — "Crystal-clear chaos." |

Scores and captions are generated server-side by the same LLM call that produces the generation prompts. Captions rotate from a large pool per score-range so repeat users see variety.

---

## Technical Architecture (high-level proposal)

All components live in a single Next.js monorepo deployable to Vercel.

| Layer | Proposal | Notes |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Fluid Compute default; mobile-first responsive |
| **LLM (interview + scoring + prompt-gen)** | Claude Sonnet 4.6 via Anthropic API or Vercel AI Gateway | Use AI Gateway with `"anthropic/claude-sonnet-4-6"` string for observability |
| **Speech-to-text** | Web Speech API (live transcription in-browser) + OpenAI Whisper API fallback | Whisper for accuracy; browser API for real-time UX |
| **Image generation** | Flux 1.1 Pro (via Replicate) or OpenAI `gpt-image-1` | Pick per style-library visual tests |
| **Video generation** | Runway Gen-3 Alpha Turbo or Luma Dream Machine | 10s clip target; evaluate latency + style control |
| **Narration (TTS)** | ElevenLabs (Creator tier starts ~$22/mo) | Pre-select 5–10 voices; each paired to a style |
| **Rate limiting** | Upstash Redis or Vercel KV | Key = `hash(ip + userAgent + canvasFingerprint)`; TTL = 24h |
| **No database in v1** | — | Stateless; generated media returned inline, not stored |
| **Storage (short-lived)** | Vercel Blob (public bucket) for generated media, 24h TTL | Needed so the browser can download the artifact |
| **Hosting** | Vercel | Default; deploy on `git push` |
| **Telemetry** | Vercel Analytics + a lightweight event logger | Funnel metrics: capture → interview → format → style → generate → download |

**Cost note:** At ~$1/video and ~$0.20/carousel, the 3/day/device cap gives a worst-case daily budget floor of ~$3/device — acceptable for prototype usage. Set a hard monthly spend cap at the Vercel AI Gateway level.

---

## Generation Pipeline (per-dream, happy path)

```
User captures dream
       │
       ▼
LLM INTERVIEW LOOP (Claude)
  • Generates 2-4 follow-up questions dynamically
  • Compiles final "enriched dream narrative"
       │
       ▼
LLM SCORING (Claude, same call)
  • Scores 4 metrics + generates one-liner each
  • Returns style-match rankings for curated library
       │
       ▼
USER PICKS FORMAT + STYLE
       │
       ├── VIDEO path ───────────────────────────────┐
       │    • LLM generates cinematic scene prompt   │
       │    • Video model generates 10s clip         │
       │    • LLM generates narration script (~30-40 │
       │      words, ~10s spoken)                    │
       │    • ElevenLabs TTS with style-paired voice │
       │    • Server muxes audio onto video (ffmpeg  │
       │      in a Vercel Function or Runway-side)   │
       │                                              │
       └── CAROUSEL path ────────────────────────────┤
            • LLM breaks dream into 4-6 scene beats  │
            • Image model generates 4-6 images in    │
              chosen style                           │
            • LLM generates per-slide caption text   │
            • Server packages into ZIP (or sequence) │
                                                     │
                                                     ▼
                                 Upload to Vercel Blob (24h TTL)
                                 Return signed URL to browser
                                 Render on Result screen
```

---

## Explicitly Out of Scope (v1 cuts)

To keep the prototype shippable:

- ❌ User accounts, login, passwords
- ❌ Dream archive / personal library
- ❌ In-app social feed, likes, comments
- ❌ Friend-follow / private-circle sharing
- ❌ Paid tier / Stripe checkout
- ❌ Email capture / waitlist
- ❌ Native iOS or Android apps
- ❌ Regenerate / restyle existing dream
- ❌ Voice cloning of user's own voice
- ❌ Dream-pattern tracking over time
- ❌ Platform-direct sharing (IG/TikTok/LinkedIn deep links)
- ❌ Shareable hosted URLs (download only)
- ❌ Watermarking on exports
- ❌ Localization / i18n (English only)

---

## Critical Files to Create

Since this is greenfield, these are the major files the implementation plan will scaffold:

```
app/
  page.tsx                          # Screen 1: Landing
  capture/page.tsx                  # Screen 2: Chat-style capture + interview
  format/page.tsx                   # Screen 3: Format choice
  style/page.tsx                    # Screen 4: Style picker
  generate/page.tsx                 # Screen 5: Generation progress
  result/[id]/page.tsx              # Screen 6: Result display
  api/
    interview/route.ts              # POST: seed dream → follow-up Qs (streaming)
    score/route.ts                  # POST: enriched dream → metrics + style ranks
    generate/video/route.ts         # POST: kickoff video pipeline, stream status
    generate/carousel/route.ts      # POST: kickoff carousel pipeline
    download/[id]/route.ts          # GET: signed download URL to Vercel Blob
lib/
  styles.ts                         # Curated style library + narrator mapping
  ratelimit.ts                      # IP+fingerprint rate limiter (Upstash/KV)
  prompts/                          # System prompts for interview/score/scene/narration
  media/                            # ffmpeg mux + ZIP helpers
components/
  MicButton.tsx, ChatThread.tsx, StyleCard.tsx, FormatCard.tsx,
  ReportCard.tsx, LoadingScene.tsx, VideoPlayer.tsx, Carousel.tsx
vercel.ts                           # Per knowledge update: use vercel.ts not vercel.json
```

Exact stack choices (Next.js version, AI SDK version, chosen image/video models) to be finalized during the writing-plans phase.

---

## Open Questions for Implementation Phase

1. **Brand / product name** — is "AI Dream Interpreter" the shipping name, or should we brainstorm a cleaner brand? (affects domain, logo, copy)
2. **Final model selections** — which image model (Flux vs gpt-image-1 vs Ideogram) for which styles? Which video model (Runway Gen-3 vs Luma Dream Machine)? Requires side-by-side visual tests.
3. **Style library final set** — confirm the 10 proposed styles, commission reference images for each, lock the mood-match heuristic.
4. **Narrator voice casting** — shortlist ElevenLabs voices, record sample narrations for each paired style, confirm pairings sound right.
5. **Copywriting pass** — landing headline/subhead, interview prompts, loading messages (need a large rotating pool), metric one-liners (need large pools per score range).
6. **Legal** — ToS + privacy policy; data handling statement (interview transcripts hit third-party APIs).
7. **Rate-limit edge cases** — corporate NAT (many users behind one IP), mobile carrier CGNAT — how strict is acceptable false-positive rate?
8. **Analytics funnel** — define the conversion funnel events and set targets before launch.

---

## Verification Plan (how we'll know v1 works)

**Functional smoke tests** (manual, on a staging URL):
- Full happy-path flow on: iOS Safari, Android Chrome, desktop Chrome, desktop Firefox
- Complete a video dream end-to-end; confirm MP4 downloads and plays in iOS Photos + Instagram upload
- Complete a carousel dream end-to-end; confirm ZIP (or image bundle) downloads and images upload cleanly to IG
- Exhaust rate limit (4 generations on one device); confirm friendly blocker with countdown
- Retry a simulated generation failure; confirm quota is NOT consumed on failure
- Deny mic permission; confirm text-only fallback works
- Return after 24h and confirm quota resets

**Quality tests** (subjective, but important):
- Generate 20 dreams of varying mood/theme; confirm style matches feel appropriate
- Confirm narrator voices match their paired styles convincingly
- Confirm metrics scoring feels "about right" (not every dream scores 8+, real variance)
- Show result screen to 5 target users; measure: do they ask to download? Do they say "I'd post this"?

**Ops tests:**
- Trigger high-latency scenarios; confirm 180s timeout handling
- Confirm Vercel Blob TTL actually expires files
- Confirm total per-user/day spend cap is enforceable at the gateway level
- Confirm Vercel Analytics funnel events fire correctly

**Success criteria for prototype (qualitative):**
- ≥50% of users who complete the interview reach the Download button
- ≥30% of users who download report they shared externally (via a follow-up survey or a later v1.1 share-tracking instrument)
- Generation failure rate <5%
- p75 total time-to-result: <3 minutes
