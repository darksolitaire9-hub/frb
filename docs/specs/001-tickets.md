# Tickets for Spec 001 (vertical slices, in build order)

Each ticket goes end to end and can be shipped on its own. `→` = depends on.

| ID | Ticket | Done when | Risks covered |
|---|---|---|---|
| **T1** | **Prototype: pipeline on 10 real images** (script, no UI): upscale → SAM2 → OCR → inpaint → LayeredDocument JSON + PNGs; PSD via ag-psd | Opens in Photoshop; you rate quality on 10 client images; cost and time per image logged | R1 R2 R3 R5 R7 |
| T2 | Repo scaffold: monorepo (`web`, `api`, `shared`), Vitest, lint, CI, LayeredDocument types + schema validation | CI green; types shared | R12 |
| T3 | Upload: presigned upload, normalisation (HEIC/CMYK/EXIF/alpha), limits, Job record → T2 | Tests for each bad-input fixture pass | R9 R10 |
| T4 | Job queue + status (SSE/poll), stage checkpointing, retries, timeouts → T3 | A killed worker resumes; a failed stage shows a clear message | R8 |
| T5 | AI adapters behind interfaces (Upscaler, Segmenter, TextReader, Inpainter, FontMatcher), fixtures for fakes → T1 T4 | Pipeline seam tests pass on fakes | R8 |
| T6 | Assembler: masks → merged layers, cap ~30, proxies + masters, text layers with confidence + fallback → T5 | Golden LayeredDocument matches | R2 R4 R12 |
| T7 | Upload + Processing screens (responsive, premium UI) → T3 T4 | Works at 375px and desktop | — |
| T8 | Editor core: Konva canvas on proxies, select/move/scale/rotate, touch gestures, document reducer + undo/redo → T6 | Reducer tests; 30-layer doc runs smoothly on a mid-range phone | R4 |
| T9 | Layer panel + mobile bottom sheet: rename/hide/lock/reorder/delete/merge/split → T8 | Reducer tests | R2 |
| T10 | Text editing: edit string/font/colour/size, low-confidence badge, revert to pixels → T8 | Revert round-trips | R1 |
| T11 | Autosave (debounced snapshots, schemaVersion) → T8 | Refresh keeps edits | — |
| T12 | Export worker: PSD (raster + live text + hidden original pixels), flat TIFF, single-layer PNG → T6 | Export seam tests read back correctly | R5 R6 R12 |
| T13 | Guardrails: rate limit, global budget kill switch, N-day auto-delete, cost log per Job → T4 | Budget cap stops new jobs | R7 R10 R11 |
| T14 | Playwright smoke test (mobile + desktop), real-model eval set script → T12 | Green | — |

**Go/no-go gate after T1.** If live text or segmentation quality is poor on your real images, change the scope (e.g. text as raster + optional OCR) before building T2+.
