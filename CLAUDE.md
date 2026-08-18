# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

اتاق فرار هاتف / "Hatef's Escape Room" — a single-player, browser-based, fully Persian (RTL) educational escape-room game that teaches the LLM pipeline in six layers: Tokenization → Embedding → Attention → Generation → Retrieval/RAG → Prompt Engineering. Built for a live classroom (~60 students, each on their own machine). 12-minute timer, six keys.

Deployed at <https://hatef-escape-room.vercel.app> (auto-deploys on push to `master`).

## Commands

```bash
npm install
npm run dev      # dev server on :3000 (falls through to :3001 if taken)
npm run build    # production build — the only real typecheck gate
npm start        # serve the production build
npm run lint     # next lint
```

There is no test suite and no test runner configured. `npm run build` (tsc via Next, `strict: true`) is what catches type errors.

## Configuration

Copy `.env.example` → `.env.local`. Everything is optional — the game is fully completable with no keys at all. Only Layer 6 consults the environment, in this priority order (see [app/api/oracle/route.ts](app/api/oracle/route.ts)):

1. `OPENROUTER_API_KEY` — player's prompt goes to a free OpenRouter model. `OPENROUTER_MODELS` in the route is a fallback chain: on 429 or any error/empty output it walks to the next model, which is what keeps a 60-student class from being blocked by one rate limit. `OPENROUTER_MODEL` overrides only the first entry.
2. `ANTHROPIC_API_KEY` — falls back to the Claude API via `@anthropic-ai/sdk`.
3. Neither set → **offline mode**: `promptCoversRequirements()` regex-checks that the player's prompt mentions شعر/آزادی/آکروستیک and returns a canned `fallbackPoem`. This path exists so the game never becomes uncompletable in a classroom without internet or keys.

## Architecture

**All game content lives in [lib/puzzles.ts](lib/puzzles.ts)** — Persian narration, per-layer intro/outro/hints, and the puzzle data + answers for every layer (`layer1Tokens`, `layer2Clusters`, `layer3Answer`, `layer4Steps`, `layer5Docs`/`layer5Answers`, `layer6Goal`), plus the tuning constants `TOTAL_TIME_SECONDS`, `HINT_PENALTY_SECONDS`, `MAX_HINTS_PER_LAYER`. Change wording, answers, or difficulty here, not in components.

**State** is a single Zustand store in [lib/store.ts](lib/store.ts), persisted to localStorage under `hatef-escape-room`. The timer is *not* a countdown variable: the store keeps `startTimestamp` + `penaltySeconds` and `remainingSeconds()` derives the value, so a page refresh resumes correctly. [components/Timer.tsx](components/Timer.tsx) polls it once a second and calls `loseGame()` at zero. Because state is persisted, `app/game/page.tsx` gates on a `mounted` flag to avoid hydration mismatch and redirects to `/` if there's no `startTimestamp`.

**Layer flow.** [app/game/page.tsx](app/game/page.tsx) renders exactly one layer, keyed on `currentLayer`. Each layer is wrapped in [components/LayerShell.tsx](components/LayerShell.tsx), which owns a three-stage local machine: `intro` (Hatef narration) → `puzzle` → `outro` (key reveal + teaching note), and only then calls `solveLayer(id)` to advance the store. A puzzle component is a leaf that receives a single `onSolved` callback via render prop — it never touches the store's layer progression itself. Layer 6 solved → `phase: "win"`. The persisted store carries `version: 2`; bump it (with a `migrate` that resets) whenever the layer count or layer meaning changes, so stale localStorage from a previous class doesn't resume into the wrong layer.

**Layer 5** (Retrieval/RAG) is pure client state: the player sends the two genuinely grounding documents to the context — the highest-similarity doc and the outdated doc are traps — then picks the answer that is fully backed by them.

**Layer 6** is the only layer with a server round-trip: [components/puzzles/Layer6Prompt.tsx](components/puzzles/Layer6Prompt.tsx) POSTs to `/api/oracle`, and the route judges the model's *output* with `checkAcrostic()` from [lib/acrostic.ts](lib/acrostic.ts) — the player wins by writing a prompt that makes some real model emit a three-line Persian poem whose initials spell «رها». The acrostic check normalizes Arabic diacritics and alef variants before comparing first letters.

**Audio** ([lib/audio.ts](lib/audio.ts)) is generated at runtime with Tone.js and can only start after a user gesture (autoplay policy) — `startAudio()` is called from the game page mount. If `public/audio/ambient.mp3` exists it is played instead of the synth pad. `updateTension(ratio)` is driven by the Timer so the music tightens as time runs out.

**Assets degrade gracefully.** [components/SceneBackground.tsx](components/SceneBackground.tsx) tries `/images/{name}.png` and falls back to a per-scene CSS gradient via `onError`, so missing art never breaks a scene.

## Conventions

- **Everything user-facing is Persian and RTL.** `<html lang="fa" dir="rtl">` is set in the root layout. Numbers shown to the player must go through `toFa()` in [lib/scoring.ts](lib/scoring.ts) — Latin digits in the UI are a bug.
- Code comments in this repo are written in Persian; match that when editing existing files.
- Commit messages are in Persian.
- Shared visual primitives are plain CSS classes in [app/globals.css](app/globals.css) — `.panel`, `.btn-glow`, `.text-glow`, `.scanlines`, `.grain`, `.shake` — used alongside the custom Tailwind tokens (`ink-*`, `cyanGlow`, `amberGlow`, `dangerGlow`, `shadow-glow`, and the `pulseGlow`/`flicker`/`scan`/`float` animations) in [tailwind.config.ts](tailwind.config.ts).
- Path alias `@/*` maps to the repo root.
- `siavash.py` is an unrelated scratch file, not part of the app.
