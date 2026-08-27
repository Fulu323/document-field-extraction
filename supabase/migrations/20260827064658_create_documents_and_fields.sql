-- Schema for the document field extraction app: documents, their extracted
-- fields, and the storage bucket holding the uploaded files.
-- See apps/specs/SPEC-001-supabase-schema.md and apps/adr/ADR-002-supabase-schema.md.

create table documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_size bigint not null,
  storage_path text not null,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed')),
  uploaded_at timestamptz not null default now()
);

comment on table documents is 'One row per uploaded document and its extraction status.';
comment on column documents.file_name is 'Original file name as uploaded by the user.';
comment on column documents.file_size is 'File size in bytes.';
comment on column documents.storage_path is 'Path to the file within the documents storage bucket.';
comment on column documents.status is 'Extraction lifecycle: processing, completed, or failed.';
comment on column documents.uploaded_at is 'When the file was uploaded.';

create table extracted_fields (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  label text not null,
  value text not null default '',
  confidence numeric(3, 2) not null default 0
    check (confidence >= 0 and confidence <= 1)
);

comment on table extracted_fields is 'Fields extracted from a document, editable individually by the user.';
comment on column extracted_fields.document_id is 'Parent document; fields are deleted when the document is deleted.';
comment on column extracted_fields.label is 'Field name, e.g. "Invoice Number".';
comment on column extracted_fields.value is 'Extracted (or user-corrected) value.';
comment on column extracted_fields.confidence is 'Extraction confidence score, 0 to 1.';

create index extracted_fields_document_id_idx on extracted_fields (document_id);

-- supabase/config.toml leaves auto_expose_new_tables unset, so new tables are not
-- reachable via the Data API roles without these explicit grants (no auth exists yet,
-- so anon is included; RLS/ownership scoping is tracked separately).
grant select, insert, update on documents to anon, authenticated;
grant select, insert, update on extracted_fields to anon, authenticated;

-- Private bucket for uploaded document files, referenced by documents.storage_path.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
