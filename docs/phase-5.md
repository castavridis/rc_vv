# Phase 5 — Canvas & Composition

## Goal

A freeform drag-and-drop canvas where generated assets can be arranged into brand compositions. Poline generates a color palette from the session's brand color profile. Compositions are captured via html2canvas and persisted to Supabase Storage.

## Dependencies

- Phase 4 complete (generated assets in Supabase Storage, asset library panel)
- GSAP already installed (`gsap` package, used in existing mask animations)
- Supabase Storage bucket: `compositions`

---

## Supabase Schema

### `compositions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `session_id` | `uuid` | FK → `sessions.id` |
| `canvas_state` | `jsonb` | array of `CanvasElement` objects (see below) |
| `thumbnail_url` | `text` | Supabase Storage URL for html2canvas snapshot |
| `created_at` | `timestamptz` | |

### `CanvasElement` (JSON shape)

```ts
interface CanvasElement {
  id: string           // generated_assets.id
  storage_url: string  // asset image URL
  x: number            // position from canvas left edge (px)
  y: number            // position from canvas top edge (px)
  width: number        // rendered width (px)
  height: number       // rendered height (px)
}
```

---

## Canvas Implementation

**Library:** GSAP Draggable (already installed — used in `BrandMaskVisualization`)

Each asset placed on the canvas is an `<img>` element wrapped in a positioned `<div>` inside the canvas container. `Draggable.create(element, { type: 'x,y', bounds: canvasRef.current })` makes it freely movable within the canvas bounds.

**Canvas container:** Fixed-size `<div>` (e.g., 1200×800px) with `position: relative; overflow: hidden`. Acts as the capture target for html2canvas.

**Placing assets:** Drag from asset library → drop onto canvas. On drop, a new `CanvasElement` is added to local state at the drop coordinates.

**State:** Canvas state is maintained in React state as `CanvasElement[]`. Serialized to JSON on save.

---

## Poline Color Palette

**Library:** `poline` npm package

Poline generates perceptually coherent palettes via sinusoidal interpolation between anchor colors in polar color space.

**Seed colors:** Derived from the session's top-scored traits mapped to brand colors (`color-types.ts`). The top 3–5 colors by trait score become Poline anchor points.

**Output:** 6–8 interpolated colors displayed in a palette panel alongside the canvas. User can click a color to copy its hex value or apply it as a canvas background tint.

---

## Composition Capture

On "Save Composition":

1. Call `html2canvas(canvasRef.current)` → `HTMLCanvasElement`
2. Convert to Blob: `canvas.toBlob(blob => ..., 'image/png')`
3. Upload Blob to Supabase Storage: `compositions/{session_id}/{composition_id}.png`
4. Insert `compositions` record: `{ session_id, canvas_state, thumbnail_url }`
5. Composition appears in saved compositions list within the session

**html2canvas notes:**
- External images must have CORS headers — Supabase Storage URLs include CORS by default
- Canvas background should be set explicitly (default is transparent, which html2canvas handles correctly)

---

## User Stories

- As a user, I can drag assets from the asset library panel onto the canvas
- As a user, I can freely reposition assets on the canvas
- As a user, I can see a Poline-generated color palette derived from my session's top trait colors
- As a user, I can save a composition — it is captured as a PNG and stored in Supabase
- As a user, I can view all saved compositions for a session with thumbnail previews
- As a user, I can reload a saved composition and see assets at their saved positions

---

## Acceptance Criteria

- [ ] Canvas renders as a fixed-size container within the session page
- [ ] GSAP Draggable applied to each asset element placed on the canvas, constrained to canvas bounds
- [ ] Assets can be dragged from the asset library panel and dropped onto the canvas
- [ ] Canvas state (`CanvasElement[]`) updates on each drag end, storing final `{ x, y, width, height }`
- [ ] Poline palette panel shows 6–8 colors seeded from the session's top-scored brand colors
- [ ] "Save Composition" button triggers html2canvas capture → PNG Blob → Supabase Storage upload
- [ ] `compositions` record inserted with `canvas_state` JSON and `thumbnail_url`
- [ ] Saved compositions list shows thumbnails within the session view
- [ ] Loading a saved composition rehydrates canvas state: assets re-rendered at saved `{ x, y, width, height }` positions
- [ ] Canvas background is explicitly set (white or user-selectable) for clean capture

---

## New Files

```
app/_components/Canvas.tsx                 — GSAP Draggable canvas container, manages CanvasElement[] state
app/_components/CanvasAsset.tsx            — individual draggable asset element on canvas
app/_components/PolinePalette.tsx          — Poline palette panel, seeded from session brand colors
app/_components/CompositionList.tsx        — saved compositions thumbnail list within session
app/_actions/saveComposition.ts            — server action: html2canvas blob → Supabase Storage → compositions record
app/_lib/polinePalette.ts                  — derives Poline anchor colors from session trait profile + color-types.ts
```

## Files to Modify

```
app/session/[id]/page.tsx                  — add Canvas, PolinePalette, CompositionList panels
app/_components/AssetLibrary.tsx           — add drag source behavior (drag from library to canvas)
```

## New Dependencies

```
poline                                     — color palette generation
html2canvas                                — DOM-to-PNG capture
```

---

## Notes

- GSAP Draggable requires `gsap/Draggable` to be imported and registered: `gsap.registerPlugin(Draggable)`
- Asset resize is not in scope for this phase — all assets render at a fixed default size (e.g., 200×200px)
- The canvas container ref must be passed to `saveComposition` — handle via a callback or React context
- Poline's `new Poline({ anchorColors, numPoints })` API produces the interpolated palette
