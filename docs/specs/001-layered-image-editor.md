# Spec 001: Flat Image → Layered, Editable, Exportable Document

Status: draft, ready for review · Labels: `spec`, `needs-review` (switch to `ready-for-agent` once approved)

## Problem Statement

Designers get flat client images (JPG/PNG/screenshots) such as flyers, product shots, logos and photos. To edit them, someone has to rebuild every element by hand in Photoshop: cut out objects, rebuild the background, re-type the text and upscale. That takes hours per image.

## Solution

A responsive web app (mobile + desktop). The user uploads an image. The system breaks it into a **layered document**: a filled-in background, one layer per object/person, and **live editable text layers** (recognised, re-typed, font-matched). The image is upscaled 2–4× (long edge capped at ~8K). The user can move, hide, reorder and edit layers in the browser, then export a layered **PSD** or a **TIFF**.

## Glossary (use these words everywhere)

| Term | Meaning |
|---|---|
| **Source Image** | The original file the user uploaded. Never changed. |
| **Job** | One async run of the pipeline on one Source Image. |
| **Pipeline** | Server-side steps: normalise → upscale → segment → OCR → inpaint → assemble. |
| **LayeredDocument** | The canonical JSON model: canvas size + ordered Layers. **The single source of truth.** |
| **Layer** | `raster` (PNG asset + transform + mask) or `text` (string, font, size, colour, box, transform). |
| **Proxy** | A downscaled copy of each raster asset (≤2048px), used only for on-screen editing. |
| **Master** | The full-resolution asset, used only for export. |
| **Export** | LayeredDocument + Masters → PSD/TIFF, produced on the server. |

## User Stories

1. As a designer, I want to drag-and-drop, paste (Ctrl+V) or tap-to-upload an image, so that I can start in one step.
2. As a mobile user, I want to pick from my camera roll, including HEIC, so that I can work from my phone.
3. As a user, I want clear rejection messages for unsupported or oversized files, so that I know what to fix.
4. As a user, I want to see live progress by stage (upscaling, finding objects, reading text…), so that I trust the wait.
5. As a user, I want to leave the page and come back to a finished job, so that I don't have to babysit it.
6. As a user, I want the background filled in where objects were removed, so that moving an object leaves no hole.
7. As a user, I want each distinct object/person on its own layer, so that I can move or delete it alone.
8. As a user, I want text turned into editable text layers with a close font match, so that I can change the wording.
9. As a user, I want to see when text recognition has low confidence, so that I can check it.
10. As a user, I want to turn any text layer back into its original pixels, so that a bad font match doesn't ruin the design.
11. As a user, I want a layer panel (rename, hide, lock, reorder, delete), so that I can manage the stack like in Photoshop.
12. As a user, I want to move, scale and rotate layers by touch and mouse, so that editing works on any device.
13. As a user, I want to merge or split layers when the AI got it wrong, so that I can fix bad segmentation.
14. As a user, I want undo/redo, so that I can experiment safely.
15. As a user, I want my edits autosaved, so that a refresh or crash doesn't lose my work.
16. As a user, I want to export a PSD with named layers and live text, so that I can finish in Photoshop.
17. As a user, I want to export a TIFF, so that I can deliver to print workflows.
18. As a user, I want to download the PNG of a single layer, so that I can reuse one asset quickly.
19. As a user, I want a before/after toggle, so that I can check quality against the original.
20. As the operator, I want a per-job cost and timing log, so that I can price the product later.
21. As the operator, I want uploads auto-deleted after N days, so that client images aren't kept longer than needed.

## Implementation Decisions

**Stack (recommended, for review)**
- **Frontend:** Vite + React + TypeScript, vanilla CSS. Canvas editor on **Konva** (touch, transforms, layering). A PWA-friendly responsive layout.
- **API:** Node + TypeScript (Fastify or Hono). Shares the LayeredDocument types with the frontend through one `shared` package.
- **Jobs:** a queue (BullMQ + Redis, or a hosted alternative). The Pipeline is async; HTTP never waits on AI.
- **AI (cloud GPU, Replicate/fal.ai):**
  - upscale: Real-ESRGAN-class model
  - segment: SAM 2 automatic masks plus a filtering/merging step
  - text: OCR with boxes and per-word confidence (Google Vision or PaddleOCR)
  - inpaint: LaMa-class model (removes text and objects from the background)
  - font match: a curated Google Fonts set ranked by visual similarity. If nothing matches well, fall back to a safe default and flag the layer.
- **Storage:** S3-compatible (Cloudflare R2). Source Image, Masters and Proxies are stored as objects. Postgres holds Jobs and LayeredDocuments.
- **Export:** server-side worker. PSD via `ag-psd` (raster + text layers). TIFF via `sharp`/libvips.

**Architecture**
- Upload → presigned URL straight to storage → create Job → queue → Pipeline workers → write LayeredDocument → client polls/SSE for status.
- Every AI provider sits behind its own small adapter (`Upscaler`, `Segmenter`, `TextReader`, `Inpainter`, `FontMatcher`). Models can be swapped without touching the Pipeline.
- The editor only edits the **LayeredDocument + Proxies**. It never loads Masters. Export applies the document's transforms to the Masters on the server.
- The LayeredDocument is versioned (`schemaVersion`). Edits are saved as whole-document snapshots with debounce (simple; switch to patches only if the documents get big).

**LayeredDocument shape (decision-level)**
```ts
type LayeredDocument = {
  schemaVersion: 1; width: number; height: number; // master pixel space
  layers: Layer[]; // index 0 = bottom
};
type Base = { id: string; name: string; visible: boolean; locked: boolean;
  opacity: number; transform: { x: number; y: number; scale: number; rotation: number } };
type RasterLayer = Base & { kind: 'raster'; role: 'background' | 'object';
  masterKey: string; proxyKey: string; bounds: Rect };
type TextLayer = Base & { kind: 'text'; text: string; font: string; size: number;
  color: string; align: 'left' | 'center' | 'right'; box: Rect;
  confidence: number; fallbackRasterKey: string }; // original pixels, for story 10
```

**Limits (v1)**
- Input: JPG/PNG/WebP/HEIC, ≤25 MB, ≤40 MP. Normalise EXIF orientation and colour space to sRGB.
- Output long edge ≤ 8192 px. At most ~30 layers (smaller segments are merged into neighbours).

## Design (UX)

- **Screen 1, Upload:** one large drop zone with a paste hint, and a "Choose image" button (camera roll on mobile). Dark, premium look. Nothing else to do on this screen.
- **Screen 2, Processing:** the Source Image shown blurred, with a stage stepper and estimated time. The Job URL can be shared or bookmarked.
- **Screen 3, Editor:**
  - **Desktop:** canvas in the centre, layer panel on the right, properties (text/font/colour) in a contextual panel, Export button top-right.
  - **Mobile:** full-screen canvas, layers as a bottom sheet, properties as a second sheet, pinch to zoom, two-finger pan, tap to select.
  - Low-confidence text layers get an amber badge.
- Login and payments are left out on purpose. Jobs are owned by an anonymous session ID, so accounts can be attached later without migrating data.

## Where It Could Fail (risk register)

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Live text and font matching** is the hardest part. Stylised, curved, outlined or tiny text is hard to OCR, and fonts rarely match exactly. | Core promise looks broken | Per-layer confidence plus amber badge. Every text layer can be switched back to its original pixels. Curated font set. **Prototype first (T1).** |
| R2 | **Segmentation over- or under-splits** (hair, shadows, glass, a logo split into 12 pieces). | Messy layer stack | Merge small/overlapping masks. Merge/split tools (story 13). Cap the layer count. |
| R3 | **Inpainting artefacts** behind large removed objects. | Visible smears when objects are moved | Inpaint after upscaling only where needed. Accept the limit in v1 and show before/after. |
| R4 | **Browser memory:** one 8K RGBA layer ≈ 130 MB; 30 layers ≈ 4 GB. Mobile Safari crashes at ~1–2 GB. | Editor crashes on phones | **Proxy/Master split** (editor never loads Masters). Export runs on the server. |
| R5 | **PSD text fidelity:** Photoshop rebuilds text layer rendering on open; missing fonts are swapped. | PSD text looks different | Embed the original pixels as a hidden layer under each text layer. Use only fonts the user can install (Google Fonts). Document this. |
| R6 | **"Layered TIFF"** is poorly supported outside Photoshop. | Expectation gap | v1 TIFF = flattened, high quality (LZW, sRGB). Layered TIFF only if users ask for it. |
| R7 | **Cost and latency per image** (5 model calls, 30–120 s, cents to tens of cents). | Margin and UX | Log cost per Job (story 20). Cache by image hash. Async UX. Fix the order: upscale once, reuse everywhere. |
| R8 | **Provider outage / cold starts / rate limits.** | Jobs stuck | Queue retries with backoff. Each stage is idempotent and checkpointed to storage. Adapters allow switching providers. Per-stage timeouts mark the job failed with a clear message. |
| R9 | **Bad inputs:** HEIC, CMYK JPG, EXIF rotation, transparent PNG, tiny 300px images, PDFs. | Wrong or failed output | Normalisation stage with explicit tests for each case. Warn when upscaling needs to go beyond 4×. |
| R10 | **Client images = private and copyrighted data.** | Legal and trust risk | Private bucket, signed short-lived URLs, auto-delete after N days, no training on user data, terms of service before launch. |
| R11 | **Abuse** of open uploads before login exists. | Runaway GPU bill | Per-IP/session rate limit, daily global budget cap with a kill switch. |
| R12 | **Coordinate drift** between proxy space, master space and PSD space. | Exports misaligned | Store everything in master pixel space. Proxies are a display scale only. Golden-file export tests. |

## Testing Decisions

- Test external behaviour at the **highest seams**, of which there are two:
  1. **Pipeline seam:** `Source Image → LayeredDocument`, with AI adapters faked by fixtures (golden JSON + PNGs). It checks layer count, roles, coordinates and the text fallback.
  2. **Export seam:** `LayeredDocument + Masters → PSD/TIFF`. It reads the PSD back with `ag-psd` and checks layer names, order, positions, text content and dimensions.
- The editor is tested through the document reducer (a pure function: `(doc, action) → doc`), covering undo/redo, merge/split and transforms. One Playwright smoke test per device size covers upload → edit → export.
- A small **real-model eval set** (~20 representative client images) runs on demand, not in CI, to track quality and cost per model change.
- Vitest across the board. No prior art yet (new repo).

## Out of Scope (v1)

Login, payments, teams/sharing, brushes/painting, filters, vector (SVG) output, layered TIFF, batch uploads, offline mode, native apps.

## Further Notes

- **Biggest unknown = R1 + R4.** Build the thin vertical prototype (T1) before anything else and judge it on 10 real client images.
- Keep the AI adapters thin. The models in this area improve every few months, so the LayeredDocument schema is the long-lived asset.
