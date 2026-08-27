# Supabase Schema for Documents and Extracted Fields Specification

**Status:** Draft  
**Owner:** Fulufhelo Siebe  
**Created:** 2026-08-25  
**Last Updated:** 2026-08-25

## Overview

Issue [#1](https://github.com/Fulu323/document-field-extraction/issues/1) (follow-up from
[ADR-001](../adr/ADR-001-react-frontend.md)) calls for designing and implementing the Supabase
schema that will back the document field extraction app. The frontend (`frontend/`) currently
runs entirely against an in-memory mock store (`frontend/src/documentStore.ts`) so that UI/UX
work would not be blocked on backend readiness. The `supabase/` project has no tables,
migrations, or edge functions defined yet. This spec defines the schema, storage configuration,
and access rules needed so the mock store can be replaced with a real Supabase-backed
implementation.

## Goals

- Define a `documents` table that captures everything the UI currently tracks per upload
  (file name, file size, uploaded-at timestamp, extraction status).
- Define storage for extracted fields (label, value, confidence) linked to a document.
- Configure a Supabase Storage bucket to hold the actual uploaded files.
- Produce migration files under `supabase/migrations/` that create this schema.
- Document the schema clearly enough that the "Replace mock documentStore with Supabase-backed
  data layer" issue can be implemented directly against it.

## Non-Goals

- Implementing the actual extraction pipeline/agent that produces field values — this spec only
  covers where extraction *results* are stored, not how they are produced.
- Authentication and Row Level Security policies scoping documents to a user — tracked separately
  in the "Add authentication for document upload and access" issue, though this schema should not
  preclude adding a `user_id` column later.
- Rewriting the frontend to call Supabase — tracked in a separate issue/spec.

## User Stories

### As the developer replacing the mock store, I want a documents table matching the existing frontend data model, so that the swap from mock to real data requires minimal UI changes

**Acceptance Criteria:**
- [x] `documents` table has a column for every field on the frontend's `DocumentRecord` type (`fileName`, `fileSize`, `uploadedAt`, `status`).
- [x] `status` is constrained to `processing`, `completed`, `failed`.

### As the developer replacing the mock store, I want extracted fields stored per document, so that the Document detail page can list and update them

**Acceptance Criteria:**
- [x] Each extracted field has a label, a value, and a confidence score between 0 and 1.
- [x] A field can be updated (value edited by the user) without affecting other fields on the same document.
- [x] Fields are deleted automatically when their parent document is deleted.

### As a user uploading a document, I want the actual file stored, so that it can be viewed later from the Document detail page

**Acceptance Criteria:**
- [x] Uploaded files are stored in Supabase Storage, not just referenced by name.
- [x] The `documents` row stores a path/reference to the file in storage.

## Technical Design

### Architecture

No new services are introduced. This is a schema-only change to the existing local Supabase
project (`supabase/config.toml`, `project_id = "document-field-extraction"`). The frontend will
later read/write this schema directly via the Supabase JS client (`@supabase/supabase-js`),
using Supabase's auto-generated REST/PostgREST API — no custom edge functions are required to
satisfy this spec.

### Data Model

**`documents` table**

| Column        | Type                                    | Notes                                                    |
|---------------|------------------------------------------|-----------------------------------------------------------|
| `id`          | `uuid`, primary key, default `gen_random_uuid()` | Matches frontend's `DocumentRecord.id` (currently a random string). |
| `file_name`   | `text`, not null                         | Maps to `fileName`.                                        |
| `file_size`   | `bigint`, not null                       | Bytes; maps to `fileSize`.                                  |
| `storage_path`| `text`, not null                         | Path within the `documents` storage bucket.                |
| `status`      | `text`, not null, default `'processing'` | Constrained via check constraint to `processing`, `completed`, `failed`. Maps to `DocumentStatus`. |
| `uploaded_at` | `timestamptz`, not null, default `now()` | Maps to `uploadedAt`.                                       |

**`extracted_fields` table**

A normalized table (rather than a JSON column on `documents`) is used — see Options Considered
in ADR-002 (to be written) — so individual fields can be updated independently, matching the
frontend's per-field edit behavior (`updateFieldValue(documentId, fieldId, value)`).

| Column       | Type                                            | Notes                                              |
|--------------|--------------------------------------------------|-----------------------------------------------------|
| `id`         | `uuid`, primary key, default `gen_random_uuid()`  | Maps to `ExtractedField.id`.                        |
| `document_id`| `uuid`, not null, references `documents(id)` on delete cascade | Links field to its document.       |
| `label`      | `text`, not null                                  | Maps to `ExtractedField.label`.                     |
| `value`      | `text`, not null, default `''`                    | Maps to `ExtractedField.value`.                     |
| `confidence` | `numeric(3,2)`, not null, default `0`, check between 0 and 1 | Maps to `ExtractedField.confidence`. |

**Storage**

- Bucket name: `documents`.
- One object per uploaded file, keyed by `storage_path` stored on the `documents` row (e.g.
  `{document_id}/{file_name}`).
- Bucket access policy is out of scope here beyond "private by default" — public/authenticated
  read rules are covered by the auth issue.

### API Design

No custom API/edge functions are introduced by this spec. Frontend reads and writes go through
Supabase's auto-generated table APIs:
- `select` on `documents` (list, single-document fetch) and `extracted_fields` (fetch by
  `document_id`).
- `insert` on `documents` on upload; `update` on `documents.status` when extraction completes.
- `insert` on `extracted_fields` when extraction completes; `update` on a single row when a user
  edits a field's value.
- Supabase Storage `upload`/`download`/`createSignedUrl` calls against the `documents` bucket.

### UI/UX Design

No UI changes are introduced by this spec — it only defines the backing schema the existing
Upload / Documents list / Document detail pages will eventually read from and write to (see the
"Replace mock documentStore with Supabase-backed data layer" issue).

## Implementation Plan

### Phase 1: Schema migration
- [x] Add `supabase/migrations/<timestamp>_create_documents_and_fields.sql` creating the
      `documents` and `extracted_fields` tables with the columns/constraints above.
- [x] Add the `documents` storage bucket via migration or `supabase/config.toml`.

### Phase 2: Documentation
- [x] Document each table/column's purpose (this spec + inline SQL comments).
- [x] Write ADR-002 capturing the schema decisions (normalized fields table vs. JSON column,
      UUID vs. text ids, etc.), per issue #6.

## Testing Strategy

- Run `supabase db reset` locally and confirm migrations apply cleanly.
- Manual verification via Supabase Studio (local) that both tables and the storage bucket exist
  with the expected columns/constraints.
- No automated tests in this phase since no application code queries the schema yet; test
  coverage for reads/writes belongs to the "Replace mock documentStore" work.

## Rollout Plan

Local-only for now. Applied via `supabase migration up` / `supabase db push` against the local
dev project. No production Supabase project exists yet for this app, so there is no live
rollout risk at this stage.

## Metrics & Success Criteria

- Migrations apply without error on a clean `supabase db reset`.
- The schema is sufficient, with no changes, to implement the "Replace mock documentStore with
  Supabase-backed data layer" issue without needing new columns/tables.

## Dependencies

- Supabase CLI (already a dev dependency at the repo root, `supabase ^2.115.0`).
- [ADR-001](../adr/ADR-001-react-frontend.md) — establishes that the frontend's data shape
  (`DocumentRecord`, `ExtractedField`) is the source of truth this schema mirrors.

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Schema doesn't anticipate fields needed once a real extraction pipeline is built (e.g. bounding boxes, page numbers) | Medium | Medium | Keep `extracted_fields` normalized and easy to extend with new nullable columns later. |
| Normalized `extracted_fields` table adds join overhead vs. a JSON column | Low | Low | Acceptable at current scale; revisit in ADR-002 if query patterns change. |
| No `user_id`/ownership column yet means schema will need a follow-up migration once auth lands | Medium | High | Design columns so adding `user_id` + RLS later is additive, not a breaking change. |

## Open Questions

- [ ] Should `extracted_fields` support multiple extraction attempts/versions per document, or
      only the latest result (current assumption: latest only)?
- [ ] Do we need a `documents.error_message` column for the `failed` status, to satisfy the
      "Add error handling for upload and extraction failures" issue?

## References

- [ADR-001: Use React (Vite + TypeScript) for the Document Field Extraction Frontend](../adr/ADR-001-react-frontend.md)
- [Issue #1: Design Supabase schema for documents and extracted fields](https://github.com/Fulu323/document-field-extraction/issues/1)
- `frontend/src/types.ts` — current frontend data model this schema mirrors
- `SPEC_TEMPLATE.md` (Berlin Accelerator Dev Track resources)
