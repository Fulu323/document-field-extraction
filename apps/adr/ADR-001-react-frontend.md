# ADR-001: Use React (Vite + TypeScript) for the Document Field Extraction Frontend

**Status:** Accepted  
**Date:** 2026-08-25  
**Deciders:** Fulufhelo Siebe  
**Technical Story:** Berlin Accelerator Dev Track — document-field-extraction agentic feature

## Context

The `document-field-extraction` project needed a user-facing frontend for uploading
documents, viewing fields extracted by the agentic extraction feature, correcting
those fields, and browsing upload history. At the time this decision was made, no
frontend existed in the repo, and the Supabase backend (`supabase/`) had no tables,
migrations, or edge functions defined yet — only an initialized local project
config. The frontend needed to be buildable and demonstrable immediately, without
waiting on backend schema decisions.

## Decision

Build the frontend as a Vite + React + TypeScript single-page application under
`frontend/`, using React Router for client-side routing across three views
(Upload, Documents list, Document detail), and a small in-memory store
(`documentStore.ts`) built on `useSyncExternalStore` to hold document and
extracted-field state. Extraction is currently simulated with mock data and an
artificial delay to mimic asynchronous agentic processing (`processing` →
`completed`). No network or Supabase calls are made yet — this is intentional
so the UI/UX can be iterated on independently of backend schema work.

## Consequences

### Positive
- Fast local iteration with Vite's dev server and HMR.
- TypeScript catches shape mismatches between documents/fields early, especially
  important since this data model will later map to a real Supabase schema.
- Frontend work is fully decoupled from backend readiness — UI/UX can be
  validated and demoed before any database or edge function exists.
- `useSyncExternalStore`-based store gives realistic reactive behavior (live
  status updates) without pulling in a state management library prematurely.

### Negative
- All data is currently mock/in-memory and resets on page reload — no
  persistence, no auth, no real document storage.
- The mock store's shape (`DocumentRecord`, `ExtractedField`) is a guess at
  what the eventual Supabase schema will look like; it will need to be
  reconciled once real tables/edge functions are designed.
- Simulated extraction (random field values, fixed delay) does not exercise
  real error handling paths (upload failures, extraction failures, retries).

### Neutral
- The root `package.json` (used for the Supabase CLI) and the frontend's own
  `frontend/package.json` are separate, unconnected npm projects for now.

## Options Considered

### Option 1: Vite + React + TypeScript (chosen)
- **Pros:** Fast dev server, minimal config, strong typing, no framework-imposed
  routing/data conventions to fight against, straightforward path to add a
  Supabase JS client later.
- **Cons:** No built-in SSR/routing/data-fetching conventions — those are
  assembled by hand (React Router, custom store).

### Option 2: Vite + React (JavaScript)
- **Pros:** Same tooling as Option 1, slightly less setup.
- **Cons:** Loses compile-time safety on the document/field data model right
  when that model is still being defined — higher risk of silent mismatches
  once wired to Supabase.

### Option 3: Next.js
- **Pros:** Built-in routing, SSR/SSG, API routes if server-side logic is
  ever needed directly in the frontend app.
- **Cons:** Heavier framework for what is currently a client-only SPA backed
  by Supabase; SSR/API routes are not needed since Supabase already serves
  as the backend; more upfront complexity than the project requires today.

## Related Decisions

- None yet. A follow-up ADR should be written when the Supabase schema
  (tables/edge functions for documents and extracted fields) is designed,
  since it will determine how `documentStore.ts` is replaced with real
  Supabase calls.

## Notes

The mock store lives at `frontend/src/documentStore.ts` and mock field
generation at `frontend/src/mockExtraction.ts`. When wiring up Supabase,
these two files are the primary integration points to replace — the page
components (`UploadPage`, `DocumentListPage`, `DocumentDetailPage`) consume
the store through `subscribe`/`getSnapshot`, `uploadDocument`, and
`updateFieldValue`, so a Supabase-backed implementation of that same
interface should be able to drop in with minimal changes to the UI layer.
