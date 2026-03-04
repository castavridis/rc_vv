# Phase 3 — Session & Brand Profile

## Goal

A session wraps a complete brand exploration. It holds the input references, assessed trait profile, dimension slider state, generated assets, and saved compositions. The radar chart and dimension sliders are the primary UI for understanding and adjusting the brand profile.

## Dependencies

- Phase 2 complete (trait scores in `trait_profiles`, session inputs recorded)

---

## Supabase Schema

### `sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | FK → `users.id` |
| `title` | `text` | user-editable display name |
| `auto_title` | `text` | generated from top traits + date, preserved for reference |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | updated on any session activity |

### `slider_history`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `session_id` | `uuid` | FK → `sessions.id` |
| `dimension` | `text` | one of 5 Aaker dimensions |
| `value` | `numeric` | 0–5 |
| `timestamp` | `timestamptz` | |

---

## Session Auto-Naming

Auto-title is generated on session creation from the top 2–3 traits by score from the initial assessment, combined with the creation date.

Example: `"Rugged, Imaginative · Mar 4"`

Logic:
1. Take assessed `trait_profiles` for the session
2. Sort by `score` descending, take top 3
3. Join names with ", " + " · " + formatted date

---

## Dimension Score Aggregation

Trait scores → dimension scores:

```
dimension_score = avg(trait_scores) for all traits within that dimension
```

Using `BRAND_PERSONALITY` from `app/_lib/brand.ts` to map traits to dimensions.

Dimension scores initialize the 5 sliders. Slider range: 0–5.

---

## User Stories

- As a user, I can create a new session after submitting an input in Phase 2
- As a user, my session is auto-named from the top assessed traits + today's date
- As a user, I can rename my session at any time
- As a user, I can see a radar chart of my session's 5 dimension scores
- As a user, I can adjust any of the 5 dimension sliders to modify the active brand profile
- As a user, slider adjustments are logged to `slider_history`
- As a user, I can resume any previous session from the home page
- As a user, the home page lists all my sessions sorted by most recently updated

---

## Acceptance Criteria

- [ ] Session record created in Supabase on first input submission, with `auto_title` generated from top traits
- [ ] Session page (`/session/[id]`) renders for authenticated users only
- [ ] Radar chart (Observable Plot) displays all 5 dimension scores on labeled axes
- [ ] Dimension scores are computed from `trait_profiles` for the session using `BRAND_PERSONALITY` hierarchy
- [ ] 5 dimension sliders (one per Aaker dimension), range 0–5, initialized from computed dimension averages
- [ ] Slider change writes to `slider_history`: `(session_id, dimension, value, timestamp)`
- [ ] Session title editable inline; saves to `sessions.title` on blur/confirm
- [ ] Home page (`/`) lists sessions for the authenticated user, sorted by `updated_at` desc
- [ ] Each session card on home shows: title, auto_title (if renamed), creation date, latest composition thumbnail (or placeholder)
- [ ] Unauthenticated users redirected to login from all session routes

---

## New Files

```
app/session/[id]/page.tsx                 — active session: input panel, radar chart, sliders (canvas + assets added in later phases)
app/session/new/page.tsx                  — redirects to input form, creates session on submission
app/_components/DimensionSliders.tsx      — 5 sliders, one per dimension, logs to slider_history on change
app/_components/SessionCard.tsx           — session list item: title, date, thumbnail placeholder
app/_components/SessionTitle.tsx          — inline-editable session title
app/_actions/createSession.ts             — server action: insert session record, generate auto_title
app/_actions/updateSessionTitle.ts        — server action: update sessions.title
app/_actions/logSliderChange.ts           — server action: insert slider_history record
app/_lib/dimensionScores.ts              — aggregates trait_profiles → 5 dimension scores using brand.ts hierarchy
app/_lib/autoTitle.ts                     — generates auto_title from top traits + date
```

## Files to Modify

```
app/page.tsx                              — rewrite as session list home page
app/_components/RadarChart.tsx            — wire to session dimension scores (currently uses hardcoded data)
```

---

## Notes

- Slider values in this phase are stored in `slider_history` but not yet used for generation — that happens in Phase 4
- The session page layout should reserve space for the canvas panel (Phase 5) and asset library (Phase 4) — can be empty placeholders for now
- `updated_at` on `sessions` should be touched on any session activity (new input, slider change, new asset, new composition)
