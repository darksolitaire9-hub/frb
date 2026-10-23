# Engineering Standards

Goal: **maintainability and performance**. Every PR is reviewed against this file. If a rule blocks you, change the rule in a PR. Don't ignore it.

## 1. Git workflow
- `main` is always deployable and protected. No direct pushes.
- Branch per ticket: `t<id>-short-slug` (e.g. `t3-upload-normalise`).
- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`. Include the ticket ID in the scope: `feat(t3): normalise HEIC to sRGB`.
- Small PRs (aim for < 400 changed lines), one ticket per PR, squash-merge.
- A PR merges only when CI is green (lint, typecheck, tests, size budget) and one review is done.
- Never commit secrets, `.agents/`, `research/` or real client images (see `.gitignore`).

## 2. Architecture rules (maintainability)
- **The LayeredDocument is the contract.** Its types live only in `shared`. Changing it needs a `schemaVersion` bump plus a migration plus a test.
- **Dependencies point inward:** `web` and `api` → `shared`. `shared` imports nothing from either.
- **AI providers only behind adapters** (`Upscaler`, `Segmenter`, `TextReader`, `Inpainter`, `FontMatcher`). No vendor SDK imports outside `api/adapters/*`.
- **Editor state changes only through the pure reducer** `(doc, action) → doc`. UI components render and dispatch; they never mutate.
- **Deep modules:** small interfaces, logic hidden inside. Add no abstraction until there's a second real use for it.
- TypeScript `strict`, no `any` (use `unknown` and narrow). Validate at the edges (zod) for HTTP, queue payloads and stored documents.
- No dead code, no commented-out code, no TODOs without a ticket ID.

## 3. Performance budgets (enforced in CI where possible)
| Area | Budget |
|---|---|
| Upload page JS (gzip) | ≤ 100 KB; editor code lazy-loaded |
| Editor JS (gzip) | ≤ 300 KB |
| LCP on upload page (mid-range mobile, 4G) | ≤ 2.0 s |
| Editor interaction (drag/transform) | 60 fps on a 30-layer doc; no frame > 50 ms |
| Editor memory on mobile | ≤ 500 MB; **Proxies only (≤ 2048 px), never Masters** |
| API request (non-AI) p95 | ≤ 200 ms; nothing synchronous waits on AI |
| Pipeline per image (p50 / p95) | ≤ 60 s / ≤ 120 s |
| AI cost per image | logged per Job; alert above the target set after T1 |

Hot-path rules:
- No O(N) work per pointer move. Use Konva layer caching and `requestAnimationFrame` batching.
- Decode images off the main thread (`createImageBitmap`, workers). Release bitmaps and object URLs on unmount.
- Clean up every listener, interval and subscription (effect cleanup is required in review).
- Upscale once, then reuse the output for every later stage. Make stages idempotent and checkpoint them to storage.
- Cache pipeline results by Source Image hash.

## 4. Error handling
- Error boundaries around the canvas, layer panel and export. A failed layer renders a placeholder; the app never goes blank.
- Pipeline stages: retry with backoff, per-stage timeout, and a clear user-facing message on failure.
- Structured logs (JSON) with `jobId` on every line. Never log image content or signed URLs.

## 5. Testing
- Vitest. Test behaviour at the seams in Spec 001: **Pipeline seam** (fake adapters + golden fixtures) and **Export seam** (read the PSD back).
- Reducer tests for every editor action. One Playwright smoke test each for mobile and desktop.
- Every bug fix comes with a test that fails without the fix.
- The real-model eval set runs on demand, not in CI.

## 6. Definition of Done
Ticket acceptance met · tests added · budgets pass · no new lint/type errors · docs/spec updated if behaviour changed · reviewed against this file.
