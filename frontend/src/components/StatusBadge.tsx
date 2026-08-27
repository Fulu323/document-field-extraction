import type { DocumentStatus } from '../types';

const LABELS: Record<DocumentStatus, string> = {
  processing: 'Extracting…',
  completed: 'Completed',
  failed: 'Failed',
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status]}</span>;
}
