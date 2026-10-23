# Handoff — read this first in a new session

Last updated: 2026-10-23. Repo: https://github.com/darksolitaire9-hub/frb (public).

## Product
Upload a flat client image → AI breaks it into a layered, upscaled (≤8K) document with live text → edit in a responsive web editor → export PSD / flat TIFF. Login and payments come later.

## Source of truth
- Spec: `docs/specs/001-layered-image-editor.md` (stories, design, risks R1–R12, test seams)
- Tickets: `docs/specs/001-tickets.md` (T1–T14, build order, CI/CD per ticket)
- Rules: `docs/ENGINEERING.md` (git flow, perf budgets, secrets)
- Stack: `docs/adr/001-stack.md` (accepted)

## Repo setup (done)
- `main` protected: PR required, squash-only, linear history, no force-push or delete, `gitleaks` is a required check.
- GitHub secret scanning + push protection on. Local hook: `git config core.hooksPath .githooks` (needs `winget install gitleaks.gitleaks`).
- Private and never committed: `.agents/` (Matt Pocock skills), `research/`, `samples/` (real client images).

## Next steps (in order)
1. Open: GitHub Issues for T1–T14 have not been created yet (`gh` is authenticated).
2. **T1 prototype** on branch `t1-pipeline-prototype`. Needs ~10 real client images in `samples/` plus a Replicate/Google Vision key in `.env`. Go/no-go gate on text and segmentation quality.
3. T2 scaffold according to ADR-001, with CI: lint/typecheck/vitest.

## Open questions
- Dependabot security updates: the enable call wasn't confirmed; retry it.
- Should `enforce_admins` be on? (currently off)
