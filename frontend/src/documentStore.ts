import type { DocumentRecord } from './types';
import { generateMockFields } from './mockExtraction';

type Listener = () => void;

const listeners = new Set<Listener>();

let documents: DocumentRecord[] = [
  {
    id: 'seed-1',
    fileName: 'acme-invoice-0417.pdf',
    fileSize: 184_320,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: 'completed',
    fields: generateMockFields(),
  },
  {
    id: 'seed-2',
    fileName: 'northwind-purchase-order.pdf',
    fileSize: 92_114,
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: 'completed',
    fields: generateMockFields(),
  },
];

function emitChange() {
  for (const listener of listeners) listener();
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): DocumentRecord[] {
  return documents;
}

export function getDocumentById(id: string): DocumentRecord | undefined {
  return documents.find((doc) => doc.id === id);
}

export function uploadDocument(file: File): DocumentRecord {
  const record: DocumentRecord = {
    id: randomId(),
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    status: 'processing',
    fields: [],
  };
  documents = [record, ...documents];
  emitChange();
  simulateExtraction(record.id);
  return record;
}

function simulateExtraction(id: string) {
  const delay = 1800 + Math.random() * 1400;
  setTimeout(() => {
    documents = documents.map((doc) =>
      doc.id === id ? { ...doc, status: 'completed', fields: generateMockFields() } : doc,
    );
    emitChange();
  }, delay);
}

export function updateFieldValue(documentId: string, fieldId: string, value: string) {
  documents = documents.map((doc) =>
    doc.id === documentId
      ? {
          ...doc,
          fields: doc.fields.map((field) =>
            field.id === fieldId ? { ...field, value, confidence: 1 } : field,
          ),
        }
      : doc,
  );
  emitChange();
}
