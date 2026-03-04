# Phase 6 — Polish & Public Domain Artwork Sourcing

## Goal

Refine the end-to-end experience: composition reload, session management on the home page, and integrate public domain artwork APIs to replace manual uploads as the primary artwork source.

## Dependencies

- Phases 1–5 complete
- Access to at least one public domain API (Met Museum recommended — free, no key required)

---

## Features

### 6A — Session Home Page Polish

Improve the home page session list with composition thumbnails and better session management.

#### Acceptance Criteria

- [ ] Home page shows all sessions sorted by `updated_at` desc
- [ ] Each session card displays: title (or auto_title if not renamed), creation date, latest composition thumbnail
- [ ] Thumbnail sourced from most recent `compositions.thumbnail_url` for the session; placeholder shown if no compositions saved yet
- [ ] Sessions can be deleted from the home page (with confirmation)
- [ ] "New Session" CTA prominent on home page

---

### 6B — Composition Reload

Allow saved compositions to be fully reloaded and edited.

#### Acceptance Criteria

- [ ] Selecting a saved composition from the session's composition list reloads the canvas
- [ ] Canvas state is rehydrated from `compositions.canvas_state` JSON
- [ ] Each `CanvasElement` re-renders at its saved `{ x, y, width, height }` position
- [ ] GSAP Draggable re-applied to reloaded elements — composition is editable after reload
- [ ] "Save" on a reloaded composition creates a new `compositions` record (does not overwrite the original)

---

### 6C — Public Domain Artwork Integration

Replace manual uploads with artworks pulled from public domain APIs. Met Museum API is the recommended starting point — it requires no API key and has 400k+ open access works.

#### Met Museum API

Base URL: `https://collectionapi.metmuseum.org/public/collection/v1`

Key endpoints:
- `GET /objects?isHighlight=true&hasImages=true` — returns object IDs for highlighted works with images
- `GET /objects/{objectID}` — returns full metadata + `primaryImage` URL for a single work

Relevant fields from object response:
- `objectID`, `title`, `artistDisplayName`, `objectDate`, `primaryImage`, `department`

#### Acceptance Criteria

- [ ] Admin page has option to import artworks from Met API: enter object ID or run a batch import by department/highlight
- [ ] For each imported artwork: fetch metadata + `primaryImage` URL, download image, upload to Supabase Storage, insert `artworks` record with `source = 'met'`
- [ ] Met-sourced artworks appear in the artwork library alongside user-uploaded works
- [ ] Artworks without a `primaryImage` are skipped during import
- [ ] Duplicate imports (same `objectID`) are handled gracefully (upsert or skip)

#### Optional: Rijksmuseum API

- Requires a free API key from `data.rijksmuseum.nl`
- Endpoint: `GET /api/en/collection?key={KEY}&imgonly=true&ps=100`
- Similar import flow as Met

---

### 6D — Slider History Visualization (Model Evaluation)

Surface the `slider_history` log as a simple timeline within the session, showing how dimension weights evolved over the session. This enables retrospective evaluation of which slider states produced the most satisfying generated assets.

#### Acceptance Criteria

- [ ] Session page shows a timeline or table of slider adjustments: dimension, value, timestamp
- [ ] Each generated asset displays the `dimension_weights` snapshot that was active at generation time
- [ ] User can click a historical slider state to see which assets were generated at those weights

---

## Files to Modify

```
app/page.tsx                               — session card thumbnails, delete session action
app/session/[id]/page.tsx                  — composition reload, slider history panel
app/admin/upload/page.tsx                  — add Met API import UI
app/_components/Canvas.tsx                 — support rehydrating canvas_state on load
app/_components/SessionCard.tsx            — add thumbnail, delete button
app/_components/CompositionList.tsx        — click to reload composition
```

## New Files

```
app/_actions/importMetArtwork.ts           — server action: fetch Met object → download image → Supabase Storage → artworks record
app/_actions/deleteSession.ts              — server action: delete session + cascade (inputs, profiles, assets, compositions)
app/_components/SliderHistoryPanel.tsx     — timeline of dimension slider adjustments
```

## New Dependencies

None — Met API requires no key. Rijksmuseum requires a free API key if added.

---

## Notes

- Met API `primaryImage` URLs are direct image links — download server-side and re-host in Supabase Storage to avoid CORS issues on the canvas
- Consider rate limiting the Met import to avoid hammering the API (100ms delay between requests is sufficient)
- Deleting a session should cascade to all related records and Supabase Storage objects — handle storage cleanup explicitly since Supabase does not auto-delete storage files on DB record deletion
