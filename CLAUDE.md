# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is VV?

VV (Visible Vibes) is an agentic design tool for brand personality exploration based on Jennifer Aaker's Brand Personality Framework (5 dimensions, 15 facets, 42 traits). Users rate artworks against traits to calibrate taste, submit text/image inputs for AI assessment, generate visual assets, and compose them on a freeform canvas. Access is restricted to Recurse Center members via RC OAuth.

## Commands

- `pnpm dev` — starts Next.js dev server with Turbopack on port 3001
- `pnpm build` — production build
- `pnpm lint` / `pnpm lint:fix` — ESLint

No test runner is configured.

## Architecture

Next.js App Router (v16) with React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres + Storage), and OpenRouter for AI model calls.

### Key directories

- `app/_lib/` — shared domain logic (brand personality definitions, prompt construction, scoring, color data)
- `app/_actions/` — Next.js Server Actions (all `'use server'`). These handle DB writes, AI model calls, and file uploads
- `app/_components/` — React components (mix of server and client)
- `app/api/` — Route handlers for auth, bookmarklet script, image saving, library CRUD
- `supabase/migrations/` — SQL migration files (phase-1 through phase-9), run manually in Supabase SQL editor
- `docs/` — Phase planning documents

### Data flow

1. **Auth**: RC OAuth flow (`app/_lib/auth/rc-oauth.ts`) → session cookie (`rc_vv_session`) with user JSON
2. **Taste calibration**: Users rate artworks on 42 traits → stored in `artwork_ratings` → aggregated into a taste profile (`app/_lib/taste-profile.ts`)
3. **Assessment**: Text/image input → server action calls OpenRouter (Mistral Medium 3 for text, Claude Sonnet for images) with artwork context injected as few-shot examples → parsed into 42 trait scores → stored in `trait_profiles`
4. **Session**: Groups inputs, trait profiles, slider state, generated assets, and compositions. Dimension scores computed from trait scores (`app/_lib/dimensionScores.ts`)
5. **Generation**: Server actions call OpenRouter (Flux.2 for images, other models for SVG/animations/summaries) → results saved to Supabase Storage → `generated_assets` table
6. **Canvas**: GSAP Draggable canvas, html-to-image capture → compositions saved to Supabase Storage

### Brand personality model

Defined in `app/_lib/brand.ts`. The hierarchy is: 5 Dimensions → 15 Facets → 42 Traits. Score scale is 0-5 throughout. This file is the source of truth for all trait/dimension/facet names used in DB records, prompts, and UI.

### External services

- **Supabase**: DB and file storage. Single server-side client initialized in `app/_actions/supabase.ts` using `SUPABASE_URL` and `SUPABASE_SECRET`
- **OpenRouter**: All AI model calls go through `https://openrouter.ai/api/v1/chat/completions` using `OPENROUTER_API_KEY`
- **Recurse Center OAuth**: `RC_ID`, `RC_SECRET`, `RC_REDIRECT_URI` env vars

### Bookmarklet

`app/api/bookmarklet-script/route.ts` serves a JS bookmarklet that opens a popup for collecting images from any webpage, rating them on brand traits, and saving to the user's library. It communicates with `/api/save-image` and `/api/update-ratings`.

## Environment variables

Required in `.env`: `PORT`, `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET`, `RC_ID`, `RC_SECRET`, `RC_REDIRECT_URI`
