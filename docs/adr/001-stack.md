# ADR-001: TypeScript monorepo — React+Vite SPA, Hono API, BullMQ workers

Status: Accepted · Date: 2026-10-23

## Context
The product is a browser editor (heavy on the client, mobile + desktop) plus long-running async AI jobs (30–120 s). Goals: maintainability and performance. Only one developer.

## Decision
- **Platform & Host:** Cloudflare (100% Free-Tier Architecture: Pages for unlimited static CDN, Workers for API, R2 for $0 egress storage, D1 for serverless SQL).
- **Frontend (`packages/web`):** React 19 + Vite 6 SPA, Konva 9 (`react-konva`) for hardware-accelerated 2D canvas, Zustand 5 pure reducer, Vanilla CSS Tokens enforcing **Negative Space Thinking** (macro/micro whitespace, Gestalt proximity grouping, line-height 1.5, breathing room over harsh borders), and Radix UI accessible headless primitives with Lucide icons.
- **Backend API (`packages/worker`):** Hono v4 on Cloudflare Workers (0ms cold start, 100k free calls/day, native TypeScript).
- **Vision & Text Engine:** Google AI Studio (Gemini 3.5 / 3.8 Flash free tier: 15 RPM, 1,500 free calls/day) for sub-pixel bounding box localization, OCR, and font extraction.
- **Object Segmentation:** Client-side WebGPU via `@huggingface/transformers` (BiRefNet / RMBG-1.4) executing directly on user hardware for $0 server cost; fallback to Gemini bounding boxes.
- **Background Inpaint:** Cloudflare Workers AI (10,000 free neurons/day) + smart client-side color-fill fallback.
- **Export Engine:** `ag-psd` running client-side / edge for layered Photoshop PSDs with live text; `sharp` for high-res flat TIFF.
- **Contract & Schemas (`packages/shared`):** Canonical `LayeredDocument` schema defined via Zod 3.24+, shared directly across client and worker.
- **Testing & CI/CD:** Vitest for pure reducer and schema validation; **Playwright** for multi-viewport E2E smoke tests (desktop 1280px, mobile 375px touch) running in GitHub Actions CI.

## Alternatives rejected
- **Next.js (OpenNext / Vinext):** Unnecessary SSR overhead for a 100% client-side canvas app; isolate memory leaks and compiler adapter instability on Cloudflare Workers.
- **Legacy AI (Real-ESRGAN / legacy OCR):** Replaced by 2026 SOTA: Gemini 3 Flash spatial vision + WebGPU client segmentation.

## Consequences
- Free tier sustainability: $0/month operational baseline.
- Client-side proxy separation: editor manipulates downscaled proxies (≤2048px); master 8K assets are never buffered in edge isolate memory.

