# Phase 4 — Asset Generation

## Goal

Generate a library of brand assets — summaries, color palettes, abstract images, SVGs, and animations — all grounded in the session's assessed trait profile and dimension slider values. Each asset type is handled by a dedicated endpoint that owns its model choice and prompt presets. Generated assets are stored in Supabase Storage and surfaced in the session asset library panel.

Assets should be as parameterized as possible so the user can adjust and remix them in-browser (Phase 5 canvas) without re-prompting.

## Dependencies

- Phase 3 complete (sessions, dimension sliders, slider_history)
- Supabase Storage bucket: `assets` (public read)
- `OPENROUTER_API_KEY` set in environment

---

## Generation Tasks & Model Routing

Each task is a dedicated server action endpoint. The endpoint owns the model, prompt template, and any presets.

| Task | Model | Output | Notes |
|---|---|---|---|
| **Brand Summary** | Mistral Creative* | Text (1–3 sentences) | Synthesizes trait profile into a brand personality statement; used as context for all other tasks |
| **Hex Color** | Mistral Creative* | Hex code(s) | Derives 1–3 brand colors from summary + traits |
| **Abstract Image** | FLUX.2 Flex | PNG ≤1MP | 3 isolated subjects on white backdrop; extracted client-side via white threshold |
| **SVG** | Claude Sonnet 4.6 | SVG code | Parameterized with CSS variables; renderable in-browser |
| **Animation** | Claude Sonnet 4.6 | GSAP code | Applied to SVG or canvas elements; parameterized duration/easing/scale |

*"Mistral Creative" — model ID: `mistralai/mistral-small-creative`

**Trait inference (Mistral Medium 3)** is already handled by Phase 2 assessment. In a future iteration, the assessment prompt may also send baseline images representing core brand dimensions as visual anchors.

---

## Supabase Schema

### `generated_assets`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `session_id` | `uuid` | FK → `sessions.id` |
| `task` | `text` | `'summary' | 'hex_color' | 'image' | 'svg' | 'animation'` |
| `trait` | `text` | nullable — target trait (for image/svg/animation tasks) |
| `dimension_weights` | `jsonb` | snapshot of all 5 dimension slider values at time of generation |
| `model` | `text` | OpenRouter model ID used |
| `storage_url` | `text` | nullable — Supabase Storage public URL (for binary assets) |
| `content` | `text` | nullable — inline content (summary text, hex code, SVG code, GSAP code) |
| `status` | `text` | `'pending' | 'generating' | 'saving' | 'done' | 'error'` |
| `error_message` | `text` | nullable |
| `created_at` | `timestamptz` | |

---

## Task Specifications

### Task 1 — Brand Summary

**Endpoint:** `generateSummary(sessionId)`
**Model:** Mistral Creative (verify ID)
**Input:** Top 5–10 trait scores from `trait_profiles`, current dimension slider values
**Output:** 1–3 sentence brand personality statement stored in `content`
**Usage:** Displayed in session header; passed as context to image, SVG, and animation tasks

---

### Task 2 — Hex Color

**Endpoint:** `generateHexColor(sessionId)`
**Model:** Mistral Creative (verify ID)
**Input:** Brand summary + top trait scores
**Output:** 1–3 hex color codes stored in `content` as JSON array (e.g. `["#2D1B69", "#E8C547"]`)
**Usage:** Seeds Poline palette in Phase 5 canvas; displayed as color swatches in asset library

---

### Task 3 — Abstract Image (FLUX.2 Flex + Chroma-Key)

**Endpoint:** `generateImage(sessionId, trait)`
**Model:** `black-forest-labs/flux.2-flex`
**Input:** Brand summary + trait + parent dimension slider value (0–5 level)
**Output:** PNG ≤1MP

**Isolation & extraction:**
- Prompt uses the keyword `isolated` — a photographic term FLUX.2 Flex responds to by placing subjects on a clean white backdrop
- Request 3 subjects in a single image (e.g. "three isolated objects representing [trait]"), each naturally separated by white space
- Client-side: canvas pixel manipulation thresholds near-white pixels (RGB > 240, 240, 240) as transparent, producing clean cutouts
- Each extracted object becomes a separate draggable asset on the Phase 5 canvas
- Backdrop color is white by default but could be parameterized to any solid color — `isolated on [color] background` — pending further testing

**Prompt construction:** `contentForTraitAndLevel(trait, level)` from `bflPrompt.ts`, extended with:
- Brand summary as context
- `isolated` keyword and 3-subject instruction

**Storage:** Binary uploaded to Supabase Storage `assets/{session_id}/{asset_id}.png`

---

### Task 4 — SVG

**Endpoint:** `generateSVG(sessionId, trait)`
**Model:** `anthropic/claude-sonnet-4-6`
**Input:** Brand summary + trait + dimension slider values
**Output:** Valid SVG code stored in `content`

**Parameterization requirements:**
- SVG must use CSS custom properties (`--color-primary`, `--scale`, `--opacity`, etc.) for key visual attributes
- These properties become in-browser sliders/pickers in Phase 5
- Rendered directly as an `<svg>` element in the canvas — no rasterization

---

### Task 5 — Animation

**Endpoint:** `generateAnimation(sessionId, trait)`
**Model:** `anthropic/claude-sonnet-4-6`
**Input:** Brand summary + trait + dimension slider values
**Output:** GSAP animation code (JavaScript string) stored in `content`

**Parameterization requirements:**
- Animation should expose `duration`, `ease`, and `scale` as configurable variables
- Code is evaluated client-side and applied to a target SVG or canvas element
- GSAP is already installed in the project

**Safety note:** Evaluated JS from a model output is a known risk. Since this is a personal tool (single authenticated user), this is acceptable for now. Do not expose this endpoint publicly.

---

## Generation Queue

Jobs are processed client-side in sequence. Status tracked locally and synced to `generated_assets` on completion.

States: `pending → generating → saving → done | error`

Multiple tasks can be queued in one session. Retry is available per job.

---

## User Stories

- As a user, I can generate a brand summary from my assessed trait profile
- As a user, I can generate hex color suggestions based on my brand summary and traits
- As a user, I can generate an abstract image for a selected trait, receiving 3 chroma-key extracted panels
- As a user, I can generate a parameterized SVG for a selected trait and adjust its CSS variables in-browser
- As a user, I can generate a GSAP animation for a selected trait and adjust its parameters in-browser
- As a user, I can see all generated assets in the asset library panel, organized by task type
- As a user, I can retry failed generation jobs

---

## Acceptance Criteria

- [ ] `generateSummary` calls Mistral Creative, stores result in `generated_assets.content`
- [ ] `generateHexColor` calls Mistral Creative, stores hex array in `generated_assets.content`
- [ ] `generateImage` calls FLUX.2 Flex, stores PNG in Supabase Storage, stores URL in `storage_url`
- [ ] Image prompt includes chroma-key sectioning instruction; client extracts 3 panels
- [ ] `generateSVG` calls Claude Sonnet, stores SVG code in `content`, uses CSS custom properties
- [ ] `generateAnimation` calls Claude Sonnet, stores GSAP code in `content`
- [ ] All endpoints store `dimension_weights` snapshot at time of generation
- [ ] Asset library panel groups assets by task type
- [ ] Failed jobs show error and retry button
- [ ] `sessions.updated_at` touched on any new asset

---

## New Files

```
app/_actions/generateSummary.ts          — Mistral Creative: brand summary
app/_actions/generateHexColor.ts         — Mistral Creative: hex color palette
app/_actions/generateImage.ts            — FLUX.2 Flex: abstract image + chroma-key
app/_actions/generateSVG.ts             — Claude: parameterized SVG
app/_actions/generateAnimation.ts        — Claude: GSAP animation code
app/_actions/saveAssetToStorage.ts       — upload binary asset to Supabase Storage
app/_components/AssetLibrary.tsx         — asset grid panel grouped by task type
app/_components/GenerationControls.tsx   — task selector + generate button + queue
app/_components/GenerationQueue.tsx      — per-job status + retry
app/_lib/isolationExtract.ts             — client-side white-background removal utility (canvas pixel threshold)
```

## Files to Modify

```
app/_actions/generateBflImage.ts         — retire or redirect to generateImage
app/_actions/saveBflImage.ts             — retire or redirect to saveAssetToStorage
app/_lib/bflPrompt.ts                    — extend to include brand summary + chroma-key instruction
app/session/[id]/page.tsx               — add GenerationControls and AssetLibrary panels
```

---

## Open Questions

- **Mistral Creative model ID** — confirmed: `mistralai/mistral-small-creative`
- **FLUX.2 Flex model ID** — confirmed: `black-forest-labs/flux.2-flex`
- **Isolation extraction** — `isolated` keyword works well in Flex; test whether 3-subject prompts produce cleanly separable objects; white threshold (RGB > 240) should handle most cases but may need tuning for off-white backgrounds
- **Animation safety** — evaluated GSAP code from model output; acceptable for personal tool but worth revisiting if scope expands
- **SVG complexity** — Claude may produce overly complex SVGs; may need to constrain prompt to simple geometric compositions consistent with the Flux image style
