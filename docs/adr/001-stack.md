# ADR-001: TypeScript monorepo — React+Vite SPA, Hono API, BullMQ workers

Status: Accepted · Date: 2026-10-23

## Context
The product is a browser editor (heavy on the client, mobile + desktop) plus long-running async AI jobs (30–120 s). Goals: maintainability and performance. Only one developer.

## Decision
- **TypeScript strict everywhere**, pnpm workspaces: `web`, `api`, `shared` (LayeredDocument types + zod schemas).
- **web:** React + Vite SPA, Konva (`react-konva`) canvas, Zustand + pure reducer, vanilla CSS.
- **api:** Hono on Node, zod validation, Postgres + Drizzle, BullMQ + Redis workers.
- **imaging:** sharp (normalise/TIFF), ag-psd (PSD with live text).
- **AI:** Replicate/fal.ai + Google Vision OCR, each behind an adapter.
- **storage:** Cloudflare R2. **hosting:** Cloudflare Pages (web), Fly.io/Railway (api + workers).
- **tests:** Vitest + Playwright. **later:** Better Auth, Stripe.

## Alternatives rejected
- **Next.js:** no SEO/SSR need; serverless doesn't suit long jobs; couples web and API deploys.
- **Python backend:** only worth it if we self-host models; we call cloud APIs, and one language gives us shared types.
- **Fabric.js / PixiJS:** Fabric is weaker with React; Pixi has no editing tools.

## Consequences
- Two deployments (web, api) to manage, in exchange for independent scaling and a static, fast editor.
- Changes to the LayeredDocument schema go through `shared` with a `schemaVersion` bump.
