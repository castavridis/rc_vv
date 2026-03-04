# Phase 1 — Artwork Library & Taste Calibration

## Goal

Build a personal ground truth dataset by rating a curated library of artworks against Aaker's 42 traits. These ratings define what each trait means to the user and serve as context for all model calls in later phases.

## Dependencies

- Supabase project with Storage enabled
- RC OAuth auth (existing)

---

## Supabase Schema

### `artworks`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `title` | `text` | |
| `artist` | `text` | nullable |
| `year` | `int` | nullable |
| `image_url` | `text` | Supabase Storage URL |
| `source` | `text` | `'upload' | 'met' | 'rijksmuseum' | 'wikiart'` |
| `created_at` | `timestamptz` | |

### `artwork_ratings`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | FK → `users.id` |
| `artwork_id` | `uuid` | FK → `artworks.id` |
| `trait` | `text` | one of 42 Aaker traits |
| `score` | `int` | 0–5 |
| `created_at` | `timestamptz` | |

Unique constraint: `(user_id, artwork_id, trait)`

---

## User Stories

- As a user, I can browse the artwork library and see which artworks I have and haven't rated yet
- As a user, I can open an artwork and assign 0–5 scores to any of the 42 traits
- As a user, I can see my overall taste profile (aggregated trait scores across all rated artworks)
- As a user, I can filter the library to show artworks that share at least one trait score in common with a selected trait
- As a user, I can see artworks sorted by similarity to or opposition with a given trait profile

---

## Acceptance Criteria

- [ ] Artwork library page (`/library`) displays all artworks with rated/unrated indicator
- [ ] Single artwork page (`/library/[id]`) shows the image and a 42-trait rating form grouped by Aaker dimension
- [ ] Rating form inputs are 0–5 (slider or number input), one per trait
- [ ] Submitting ratings saves to `artwork_ratings` in Supabase, one row per `(user_id, artwork_id, trait)` — upsert on conflict
- [ ] Taste profile query: `avg(score)` per trait across all artworks rated by the user
- [ ] Taste profile displayed as a summary on the library page (top 5 traits by score)
- [ ] Similarity filter: returns artworks where at least one trait has `score > 0` matching the reference trait
- [ ] Opposition filter: returns artworks where a trait's score is high when the reference is low (and vice versa)
- [ ] Admin upload flow: form to upload image → Supabase Storage (`artworks/` bucket) → `artworks` record created
- [ ] Unauthenticated users redirected to login

---

## New Files

```
app/library/page.tsx                          — artwork library browse + taste profile summary
app/library/[id]/page.tsx                     — single artwork view + rating form
app/admin/upload/page.tsx                     — artwork upload form (admin only for PoC)
app/_components/ArtworkCard.tsx               — thumbnail + rated/unrated badge
app/_components/TraitRatingForm.tsx           — 42-trait form grouped by dimension (0–5 per trait)
app/_components/TasteProfileSummary.tsx       — top traits summary display
app/_actions/saveArtworkRatings.ts            — server action: upsert ratings to Supabase
app/_actions/uploadArtwork.ts                 — server action: upload image to Storage + insert artworks record
app/_lib/artwork-similarity.ts                — similarity and opposition scoring utilities
app/_lib/taste-profile.ts                     — aggregate ratings → Record<Trait, number>
```

## Files to Modify

```
app/_lib/brand.ts                             — no changes needed, already has full 42-trait list
```

---

## Notes

- For PoC, artwork upload is manual via the admin page — no public domain API yet
- Rating form should allow partial ratings (not all 42 traits required per artwork)
- Similarity/opposition logic will be reused in Phase 2 for model context injection
