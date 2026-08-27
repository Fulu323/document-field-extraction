export type DocumentStatus = 'processing' | 'completed' | 'failed';

export interface ExtractedField {
  id: string;
  label: string;
  value: string;
  confidence: number; // 0..1
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string; // ISO timestamp
  status: DocumentStatus;
  fields: ExtractedField[];
}
