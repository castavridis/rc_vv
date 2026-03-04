# Phase 2 — Assessment Pipeline

## Goal

Evaluate user-provided text and image inputs against Aaker's 42 traits using multiple AI models via OpenRouter. Assessed scores seed the session brand profile. Rated artworks from Phase 1 are injected as few-shot context into model prompts to ground abstract trait scores in the user's personal taste.

## Dependencies

- Phase 1 complete (`artworks`, `artwork_ratings` in Supabase, taste profile aggregation)
- `OPENROUTER_API_KEY` set in environment

---

## Models

| Input type | Model | OpenRouter ID |
|---|---|---|
| Text | Mistral Medium 3 | `mistralai/mistral-medium-3` |
| Image | Vision-capable model | `mistralai/pixtral-large-2411` or `anthropic/claude-sonnet-4-6` |

Both return `Record<Trait, 0 | 1 | 2 | 3 | 4 | 5>` using the same prompt schema.

---

## Supabase Schema

### `session_inputs`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `session_id` | `uuid` | FK → `sessions.id` |
| `type` | `text` | `'text' | 'image'` |
| `content_url` | `text` | nullable — Supabase Storage URL for image inputs |
| `raw_text` | `text` | nullable — text content for text inputs |
| `created_at` | `timestamptz` | |

### `trait_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `session_id` | `uuid` | FK → `sessions.id` |
| `trait` | `text` | one of 42 Aaker traits |
| `score` | `numeric` | 0–5 |
| `model` | `text` | model ID that produced this score |
| `source` | `text` | `'assessed' | 'manual'` |
| `created_at` | `timestamptz` | |

---

## Artwork Context Injection

Before calling a model, select artworks from the user's rated library to include in the prompt:

- **Same-direction (top 3):** artworks whose rating vector has highest cosine similarity to the current session trait profile
- **Opposing (top 2):** artworks whose rating vector has highest cosine distance from the current session trait profile

Include each selected artwork as:
- The artwork image (URL or base64 for vision models)
- Its trait scores as a structured list
- A label: "This is a same-direction reference" or "This is an opposing reference"

---

## Prompt Schema

Both text and image prompts follow this structure:

```
[System context: Aaker framework description + 42 trait definitions with 0–5 scale]

[Few-shot examples: up to 5 artworks with images + trait scores]

[Task: assess the following input and return a JSON object mapping each of the 42 traits to a score from 0–5]

[Input: text description OR image]
```

Response must be valid JSON: `{ "Daring": 3, "Rugged": 5, ... }` for all 42 traits.

---

## User Stories

- As a user, I can submit a text description and receive trait scores across all 42 traits
- As a user, I can upload or link an image and receive trait scores
- As a user, I can submit multiple inputs in one session and have scores aggregated
- As a user, I can see which artworks were used as context for the assessment

---

## Acceptance Criteria

- [ ] Text inputs routed to Mistral Medium 3 via OpenRouter
- [ ] Image inputs routed to vision-capable model via OpenRouter
- [ ] Prompt includes: task description, 42-trait definitions (0–5), up to 5 artwork context examples, input to assess
- [ ] Response parsed and validated: all 42 traits present, values clamped to 0–5
- [ ] Scores stored in `trait_profiles` with `model` and `source = 'assessed'`
- [ ] Multiple inputs per session averaged into a single active profile
- [ ] Assessment errors (model failure, parse error, timeout) surface a user-facing error message with option to retry
- [ ] Context artworks displayed to user: "Assessed using these references"

---

## New Files

```
app/_actions/assessInput.ts               — server action: routes to correct model, injects artwork context, returns trait scores
app/_actions/uploadSessionInput.ts        — server action: upload image input to Supabase Storage + insert session_inputs record
app/_lib/assessmentPrompt.ts              — builds system + user prompt for text and image assessment
app/_lib/artworkContext.ts                — selects similar + opposing artworks for prompt injection (uses similarity logic from Phase 1)
app/_lib/traitAggregation.ts             — aggregates multiple assessment results into a single trait profile
app/_components/InputForm.tsx             — text + image input submission UI
app/_components/AssessmentResult.tsx      — displays assessed trait scores + context artworks used
```

## Files to Modify

```
app/_lib/artwork-similarity.ts            — reused from Phase 1, no changes needed
app/_actions/supabase.ts                  — no changes needed
```

---

## Notes

- If no artworks have been rated yet (Phase 1 incomplete), skip context injection and proceed with zero-shot assessment
- Store the `dimension_weights` snapshot at time of assessment for later comparison with slider-adjusted weights
- The aggregated trait profile from this phase is the input to Phase 3 (radar chart + sliders)
