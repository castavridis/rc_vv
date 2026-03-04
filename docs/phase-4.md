# Phase 4 — Asset Generation

## Goal

Generate geometric shape images representing brand traits at intensity levels informed by the session's current dimension slider values. Generated assets are stored in Supabase Storage and surfaced in the session asset library panel.

## Dependencies

- Phase 3 complete (sessions, dimension sliders, `slider_history`)
- Supabase Storage bucket: `assets`
- `OPENROUTER_API_KEY` set in environment

---

## Supabase Schema

### `generated_assets`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `session_id` | `uuid` | FK → `sessions.id` |
| `trait` | `text` | target trait for generation |
| `dimension_weights` | `jsonb` | snapshot of all 5 dimension slider values at time of generation |
| `model` | `text` | model ID used (e.g. `black-forest-labs/flux.2-klein-4b`) |
| `storage_url` | `text` | Supabase Storage public URL |
| `status` | `text` | `'pending' | 'generating' | 'saving' | 'done' | 'error'` |
| `error_message` | `text` | nullable, populated on failure |
| `created_at` | `timestamptz` | |

---

## Prompt Construction

The generation prompt is built from `contentForTraitAndLevel(trait, level)` (existing in `app/_lib/bflPrompt.ts`) where `level` is derived from the current slider value for the trait's parent dimension.

**Level derivation:**
1. Look up which dimension contains the target trait using `BRAND_PERSONALITY` from `brand.ts`
2. Read that dimension's current slider value from the session's latest `slider_history` entry
3. Round to nearest integer (0–5) for the prompt

**Artwork context (optional):** Top-scoring same-direction artworks from the user's rated library can be included in the generation prompt as style references if the model supports image input.

---

## Generation Queue

Each generation job is a unit: `(session_id, trait, dimension_weights_snapshot)`.

Jobs are processed client-side in sequence or small batches. Status is tracked locally in component state and synced to `generated_assets` on completion.

Queue states per job:
- `pending` — queued, not yet started
- `generating` — OpenRouter request in flight
- `saving` — uploading result to Supabase Storage
- `done` — `storage_url` populated, asset visible in library
- `error` — failed, error message shown, retry available

---

## User Stories

- As a user, I can select one or more traits to generate assets for
- As a user, generated images reflect my current dimension slider values
- As a user, I can see a generation queue with live status per job
- As a user, I can retry failed generation jobs individually
- As a user, generated assets appear in the asset library panel once complete
- As a user, I can see which slider values were active when each asset was generated

---

## Acceptance Criteria

- [ ] Generation calls `black-forest-labs/flux.2-klein-4b` via OpenRouter
- [ ] `level` parameter derived from the target trait's parent dimension slider value at time of generation
- [ ] `dimension_weights` JSON snapshot stored with each `generated_assets` record
- [ ] Generated image (data URI or URL) fetched and uploaded to Supabase Storage under `assets/{session_id}/{asset_id}.{ext}`
- [ ] `generated_assets` record created with `storage_url` and `status = 'done'` on success
- [ ] Asset library panel renders a thumbnail grid of all `done` assets for the session
- [ ] Failed jobs display error message and a "Retry" button that re-queues the job
- [ ] Generation can be triggered for multiple traits at once (queued sequentially)
- [ ] Assets panel updates in real time as jobs complete (polling or optimistic UI)

---

## New Files

```
app/_components/AssetLibrary.tsx           — thumbnail grid of generated assets for the session
app/_components/GenerationQueue.tsx        — job list with per-job status indicator and retry button
app/_components/TraitSelector.tsx          — UI to select one or more traits to generate for
app/_actions/saveAssetToStorage.ts         — server action: upload image blob to Supabase Storage, insert generated_assets record
```

## Files to Modify

```
app/_actions/generateBflImage.ts           — minor: ensure error shape is consistent
app/_actions/saveBflImage.ts               — rewrite: save to Supabase Storage instead of local filesystem
app/_lib/bflPrompt.ts                      — minor: accept dimension_weights object, derive level from parent dimension
app/session/[id]/page.tsx                  — add TraitSelector, GenerationQueue, and AssetLibrary panels
```

---

## Notes

- The existing `/tests/bfl` page and `BflGenerator.tsx` can be retired once this phase is complete, or kept as a scratchpad
- `dimension_weights` snapshot is important for Phase 6 model evaluation — it lets us correlate slider settings with generation outputs over time
- Supabase Storage bucket `assets` should be set to public read for direct URL access in canvas (Phase 5)
