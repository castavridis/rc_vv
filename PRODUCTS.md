# VV (Visible Vibes) — Product Requirements Document

## Overview

**Product name:** VV (Visible Vibes)
**Audience:** Personal tool for brand visual identity exploration
**Core loop:** Calibrate taste via artwork ratings → assess new inputs against brand traits → generate assets → compose on a freeform canvas → save compositions
**Framework:** Jennifer Aaker's Brand Personality Framework (5 dimensions → 15 facets → 42 traits)

### Aaker's Brand Personality Hierarchy

| Dimension | Facets | Traits |
|---|---|---|
| Sincerity | Down-to-Earth, Honest, Wholesome, Cheerful | Down-to-Earth, Family Oriented, Small-Town, Honest, Sincere, Real, Wholesome, Original, Cheerful, Sentimental, Friendly |
| Excitement | Daring, Spirited, Imaginative, Up-to-Date | Daring, Trendy, Exciting, Spirited, Cool, Young, Imaginative, Unique, Up-to-Date, Independent, Contemporary |
| Competence | Reliable, Intelligent, Successful | Reliable, Hard Working, Secure, Intelligent, Technical, Corporate, Successful, Leader, Confident |
| Sophistication | Upper Class, Charming | Upper Class, Glamorous, Good Looking, Charming, Feminine, Smooth |
| Ruggedness | Outdoorsy, Tough | Outdoorsy, Masculine, Western, Tough, Rugged |

**Score scale:** 0–5 for all trait assessments (0 = not representative, 5 = maximally representative)

---

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** TailwindCSS
- **Animation / Canvas:** GSAP (Draggable for canvas, existing animations)
- **Composition capture:** html2canvas
- **Color palettes:** Poline
- **Charts:** Observable Plot (radar chart)
- **AI / Models:** OpenRouter (Mistral Medium 3 for text assessment, vision-capable model for image assessment, Black Forest Labs Flux.2-klein-4b for image generation)
- **Database / Storage:** Supabase (Postgres + Storage)
- **Auth:** Recurse Center OAuth 2.0

---

## Supabase Schema

| Table | Key Columns |
|---|---|
| `users` | `id`, `email`, `first_name`, `last_name`, `rc_id` |
| `artworks` | `id`, `title`, `artist`, `year`, `image_url`, `source` (`upload` \| `met` \| `rijksmuseum` \| `wikiart`) |
| `artwork_ratings` | `id`, `user_id`, `artwork_id`, `trait`, `score` (0–5) |
| `sessions` | `id`, `user_id`, `title`, `auto_title`, `created_at`, `updated_at` |
| `session_inputs` | `id`, `session_id`, `type` (`text` \| `image`), `content_url`, `raw_text` |
| `trait_profiles` | `id`, `session_id`, `trait`, `score` (0–5), `model`, `source` (`assessed` \| `manual`) |
| `slider_history` | `id`, `session_id`, `dimension`, `value`, `timestamp` |
| `generated_assets` | `id`, `session_id`, `trait`, `dimension_weights` (JSON), `model`, `storage_url`, `created_at` |
| `compositions` | `id`, `session_id`, `canvas_state` (JSON), `thumbnail_url`, `created_at` |

---

## Products

---

### Product 1 — Artwork Library & Taste Calibration

**Goal:** Build a personal ground truth dataset by rating a curated library of artworks against Aaker's 42 traits. These ratings define what each trait means to the user and serve as context for all model calls.

**Artwork sourcing:**
- **PoC:** User-uploaded artworks (~100 images stored in Supabase Storage)
- **Future:** Public domain APIs (Met Museum, Rijksmuseum, WikiArt) — schema is source-agnostic

#### User Stories

- As a user, I can browse the artwork library and see which artworks I have and haven't rated yet
- As a user, I can open an artwork and assign 0–5 scores to any of the 42 traits
- As a user, I can see my overall taste profile (aggregated trait scores across all rated artworks)
- As a user, I can filter the library to show artworks that share at least one trait score with a selected trait or profile
- As a user, I can see artworks sorted by similarity to or opposition with a given trait profile

#### Acceptance Criteria

- Artwork library displays all artworks with rated/unrated status indicator
- Rating UI shows all 42 traits grouped by dimension, with a 0–5 input per trait
- Ratings are saved to `artwork_ratings` in Supabase per `(user_id, artwork_id, trait)`
- Taste profile aggregates all ratings as `avg(score)` per trait across rated artworks
- Similarity filter: returns artworks with at least one matching trait where both scores > 0
- Opposing filter: returns artworks where score is high on a trait where the reference profile scores low (and vice versa)
- Artwork admin flow: upload image → stored in Supabase Storage → record created in `artworks`

#### Key Files

- `app/library/page.tsx` — artwork library browse page
- `app/library/[id]/page.tsx` — single artwork rating page
- `app/_components/ArtworkCard.tsx` — artwork thumbnail + rating status
- `app/_components/TraitRatingForm.tsx` — 42-trait rating form grouped by dimension
- `app/_lib/artwork-similarity.ts` — similarity and opposition scoring utilities

---

### Product 2 — Assessment Pipeline

**Goal:** Evaluate user-provided text and/or image inputs against Aaker's 42 traits using multiple AI models via OpenRouter. Assessed scores seed the session brand profile. Relevant artworks from the user's rated library are injected as context into model prompts.

**Models:**
- **Text input:** Mistral Medium 3 via OpenRouter (`mistralai/mistral-medium-3`)
- **Image input:** Vision-capable model via OpenRouter (e.g., `mistralai/pixtral-large-2411` or `anthropic/claude-sonnet-4-6`)
- Both return `Record<Trait, 0 | 1 | 2 | 3 | 4 | 5>` using the same prompt schema

**Artwork context injection:**
- Before calling a model, query `artwork_ratings` for:
  - **Same-direction artworks:** artworks where user ratings align with the current session trait profile (top 3 by cosine similarity)
  - **Opposing artworks:** artworks where user ratings diverge most (top 2 by cosine distance)
- Include artwork images + their trait scores in the model prompt as few-shot examples

#### User Stories

- As a user, I can submit text describing a visual aesthetic and receive trait scores
- As a user, I can upload or link an image and receive trait scores
- As a user, I can submit multiple inputs in one session and have scores aggregated
- As a user, I can see which artworks were used as context for the assessment

#### Acceptance Criteria

- Text inputs route to Mistral Medium 3 via OpenRouter
- Image inputs route to a vision-capable model via OpenRouter
- Model prompt includes: task description, 42-trait definitions (0–5 scale), up to 5 artwork context examples (images + ratings), input to assess
- Response is parsed into `Record<Trait, number>` and validated (all values 0–5)
- Scores stored in `trait_profiles` with `model` column and `source = 'assessed'`
- Multiple inputs per session are averaged into a single profile
- Assessment errors (model failure, parse failure) surface a user-facing message

#### Key Files

- `app/_actions/assessInput.ts` — server action: routes to correct model, injects artwork context, returns trait scores
- `app/_lib/assessmentPrompt.ts` — prompt construction for text and image assessment
- `app/_lib/artworkContext.ts` — selects similar + opposing artworks for prompt injection
- `app/_lib/traitAggregation.ts` — aggregates multiple assessment scores into a single profile

---

### Product 3 — Session & Brand Profile

**Goal:** A session wraps a complete brand exploration. It holds the input references, assessed trait profile, dimension slider state, generated assets, and saved compositions. The radar chart and dimension sliders are the primary UI for understanding and adjusting the brand profile.

**Session naming:** Auto-named on creation from top 2–3 assessed traits + date (e.g., "Rugged, Imaginative · Mar 4"). User can rename at any time.

#### User Stories

- As a user, I can create a new session and see it auto-named from my assessed traits
- As a user, I can rename a session
- As a user, I can see a radar chart of my session's 5 dimension scores
- As a user, I can adjust dimension sliders (0–5) to modify the active brand profile
- As a user, slider adjustments are logged so I can see how my profile evolves
- As a user, I can resume a previous session and pick up where I left off
- As a user, I can see all my sessions listed on the home page with composition thumbnails

#### Acceptance Criteria

- Session created on first input submission, auto-named from top traits + date
- Radar chart (Observable Plot) displays all 5 dimension scores, initialized from aggregated trait scores
- 5 dimension sliders (one per Aaker dimension) initialized from assessed dimension averages
- Slider range: 0–5. Manual slider changes write to `slider_history` with timestamp
- Slider values affect downstream asset generation (passed as `dimension_weights` to generation prompt)
- Sessions list on home page, sorted by `updated_at` desc, showing latest composition thumbnail
- Unauthenticated users redirected to login before accessing any session

#### Key Files

- `app/page.tsx` — home page: session list
- `app/session/new/page.tsx` — new session: input submission
- `app/session/[id]/page.tsx` — active session: input panel, radar chart, sliders, canvas, asset library
- `app/_components/RadarChart.tsx` — Observable Plot radar (existing, wire to session profile)
- `app/_components/DimensionSliders.tsx` — 5 sliders, logs to `slider_history`
- `app/_components/SessionCard.tsx` — session list item with thumbnail

---

### Product 4 — Asset Generation

**Goal:** Generate geometric shape images (circles, squares, triangles) representing brand traits at slider-informed intensity levels using Black Forest Labs Flux.2 via OpenRouter. Generated assets are stored in Supabase Storage and surfaced in the session asset library panel.

**Prompt construction:** Incorporates current dimension slider values as trait intensity weights. Top-scoring artworks from the calibration library are optionally injected as visual style references.

#### User Stories

- As a user, I can trigger generation for any trait or dimension in my current session
- As a user, generated images reflect my current dimension slider values
- As a user, I can see a generation queue with status per job (pending / generating / saving / done / error)
- As a user, I can retry failed generation jobs individually
- As a user, generated assets appear in the session asset library panel once complete

#### Acceptance Criteria

- Generation calls `black-forest-labs/flux.2-klein-4b` via OpenRouter
- Prompt uses `contentForTraitAndLevel(trait, level)` with `level` derived from current slider value for the trait's parent dimension
- Generated image (data URI or URL) is fetched and uploaded to Supabase Storage under `generated/{session_id}/{asset_id}.{ext}`
- `generated_assets` record created with `session_id`, `trait`, `dimension_weights` (JSON snapshot of slider values at time of generation), `model`, `storage_url`
- Asset appears in library panel immediately on completion
- Failed jobs show error message and a "Retry" button
- `OPENROUTER_API_KEY` must be set in environment

#### Key Files

- `app/_actions/generateBflImage.ts` — OpenRouter Flux call (existing, minor updates)
- `app/_actions/saveBflImage.ts` — upgrade: save to Supabase Storage instead of local filesystem
- `app/_lib/bflPrompt.ts` — prompt construction (existing, wire slider values)
- `app/_components/AssetLibrary.tsx` — asset grid panel in session view
- `app/_components/GenerationQueue.tsx` — job status list

---

### Product 5 — Canvas & Composition

**Goal:** A freeform drag-and-drop canvas where generated assets can be arranged into brand compositions. Poline generates a color palette from the session's brand color profile. Compositions are captured via html2canvas and persisted to Supabase.

#### User Stories

- As a user, I can drag assets from the asset library onto the canvas
- As a user, I can freely reposition assets on the canvas
- As a user, I can see a Poline-generated color palette derived from the session's brand color profile
- As a user, I can save a composition — it is captured as an image and stored
- As a user, I can view and reload previously saved compositions within a session

#### Acceptance Criteria

- Canvas container renders within the session page
- GSAP Draggable applied to each asset element on the canvas
- Assets dropped onto the canvas maintain their position state locally: `{ assetId, x, y, width, height }[]`
- Poline palette panel shows 5–8 colors derived from the session's top-scored brand colors (from `color-types.ts`)
- "Save Composition" triggers html2canvas on the canvas container → PNG Blob
- PNG Blob uploaded to Supabase Storage; `compositions` record created with `canvas_state` (JSON) and `thumbnail_url`
- Saved compositions listed within the session with thumbnail previews
- Composition can be reloaded: canvas state JSON is rehydrated, assets re-rendered at saved positions

#### Key Files

- `app/_components/Canvas.tsx` — GSAP Draggable canvas container
- `app/_components/PolinePalette.tsx` — Poline color palette panel
- `app/_actions/saveComposition.ts` — html2canvas capture → Supabase Storage upload → DB record
- `app/_lib/polinePalette.ts` — derives Poline input colors from session brand profile

---

### Product 6 — Color Explorer (`/colors`)

**Goal:** Secondary reference tool. Browse all 150+ colors mapped to Aaker's brand personality hierarchy. Useful for understanding which colors are associated with a given dimension, facet, or trait.

**Status:** Complete. No changes planned for current build phases.

#### Key Files

- `app/colors/page.tsx`
- `app/_components/ColorPalettePicker/`
- `app/_lib/color-types.ts`, `app/_lib/trait-index.ts`

---

### Product 7 — Authentication (RC OAuth)

**Goal:** Restrict access to Recurse Center members. Session persists across navigation.

**Status:** Complete. No changes planned.

#### Key Files

- `app/api/auth/login/route.ts`, `app/api/auth/rc/route.ts`, `app/api/auth/logout/route.ts`
- `app/_lib/auth/`

---

## Out of Scope (Current Build)

- Public user accounts or multi-user sharing
- Custom brand personality frameworks beyond Aaker
- Export / share compositions externally
- Mobile-optimized UI
- Public domain artwork API integration (Met, Rijksmuseum, WikiArt) — PoC uses uploaded artworks

---

## Build Phases

| Phase | Deliverable |
|---|---|
| **1 — Calibration** | Artwork upload (admin), artwork library browse, 42-trait rating UI, taste profile aggregation in Supabase |
| **2 — Assessment** | Input form (text + image), Mistral Medium 3 + vision model assessment via OpenRouter, artwork context injection, trait scores stored per session |
| **3 — Session + Profile** | Session creation + auto-naming, radar chart + dimension sliders wired to scores, slider history logging, home page session list |
| **4 — Generation** | Flux.2 generation wired to slider values, assets saved to Supabase Storage, asset library panel, generation queue UI |
| **5 — Canvas** | GSAP Draggable canvas, asset drag-and-drop, Poline palette panel, html2canvas → save composition, composition thumbnails |
| **6 — Polish** | Session rename, composition reload, home page thumbnails, Met/WikiArt API artwork sourcing |
