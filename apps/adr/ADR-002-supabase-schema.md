# ADR-002: Supabase Schema for Documents and Extracted Fields

**Status:** Accepted
**Date:** 2026-08-27
**Deciders:** Fulufhelo Siebe
**Technical Story:** [Issue #1](https://github.com/Fulu323/document-field-extraction/issues/1) — Design Supabase schema for documents and extracted fields

## Context

Per [ADR-001](ADR-001-react-frontend.md), the frontend was built against an in-memory mock store
(`frontend/src/documentStore.ts`) so UI/UX work would not be blocked on backend readiness. The
`supabase/` project had no tables, migrations, or storage buckets defined. This ADR records the
schema decisions made to back the app with real Supabase tables and storage, as detailed in
[SPEC-001](../specs/SPEC-001-supabase-schema.md).

## Decision

Add a migration (`supabase/migrations/20260827064658_create_documents_and_fields.sql`) that
creates:
- A `documents` table mirroring the frontend's `DocumentRecord` type (`file_name`, `file_size`,
  `storage_path`, `status`, `uploaded_at`), with `status` constrained via a check constraint to
  `processing` | `completed` | `failed`.
- A normalized `extracted_fields` table (not a JSON column) with `document_id`, `label`, `value`,
  and `confidence`, cascading deletes from `documents`.
- A private `documents` storage bucket, created via SQL (`insert into storage.buckets`) rather
  than `supabase/config.toml`, so the same migration provisions the bucket in any environment.
- Explicit `grant select, insert, update ... to anon, authenticated` on both tables. Local
  `supabase/config.toml` leaves `auto_expose_new_tables` unset, meaning new tables are **not**
  reachable via the Data API roles without explicit grants (this is the current cloud default, not
  legacy auto-exposure) — without these grants the frontend's planned `select`/`insert`/`update`
  calls would fail outright, regardless of RLS.

## Consequences

### Positive
- Schema maps 1:1 to the frontend's existing types, so swapping the mock store for real Supabase
  calls requires no changes to `frontend/src/types.ts`.
- Cascading delete on `extracted_fields.document_id` means deleting a document cannot leave
  orphaned field rows.
- Per-field rows allow `updateFieldValue(documentId, fieldId, value)` to update one field without
  touching the others, matching current frontend behavior.

### Negative
- No `user_id`/ownership column yet — every document is currently globally visible. Acceptable
  for now since auth is tracked separately, but requires a follow-up migration.
- No RLS policies are added by this migration, and the `anon`/`authenticated` grants above give
  any client full read/write access to every document and field until the auth issue lands.

### Neutral
- `confidence` is `numeric(3,2)`, which is sufficient precision (0.00–1.00) for a UI-displayed
  score and matches the frontend's `0..1` float.

## Options Considered

### Option 1: Normalized `extracted_fields` table (chosen)
- **Pros:** Individual fields can be updated independently (matches
  `updateFieldValue`); indexable by `document_id`; extensible with new nullable columns (e.g.
  bounding box, page number) without reshaping existing rows.
- **Cons:** Requires a join to fetch a document with its fields; slightly more migration
  boilerplate than a single column.

### Option 2: JSON/JSONB column on `documents`
- **Pros:** Single-table reads; no join; simpler initial migration.
- **Cons:** Updating one field's value means read-modify-write of the whole array, which is racier
  under concurrent edits and doesn't map cleanly to Postgres check constraints on `confidence`.

### Option 3: UUID vs. text ids
- **Chosen:** `uuid` with `gen_random_uuid()` default, standard for Supabase/Postgres and avoids
  collision handling the frontend's `Math.random().toString(36)` id generator would need if reused
  server-side.

## Related Decisions

- [ADR-001: Use React (Vite + TypeScript) for the Document Field Extraction Frontend](ADR-001-react-frontend.md)
- [SPEC-001: Supabase Schema for Documents and Extracted Fields](../specs/SPEC-001-supabase-schema.md)

## Notes

Migration has been written but not applied/deployed as part of this change — `supabase db reset`
(or equivalent) still needs to be run to apply it locally.
