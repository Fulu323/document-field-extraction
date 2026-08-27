import { useSyncExternalStore } from 'react';
import { Link, useParams } from 'react-router-dom';
import { subscribe, getSnapshot, updateFieldValue } from '../documentStore';
import StatusBadge from '../components/StatusBadge';

function confidenceClass(confidence: number): string {
  if (confidence >= 0.9) return 'confidence-high';
  if (confidence >= 0.75) return 'confidence-medium';
  return 'confidence-low';
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const documents = useSyncExternalStore(subscribe, getSnapshot);
  const document = documents.find((doc) => doc.id === id);

  if (!document) {
    return (
      <div className="page">
        <h1>Document not found</h1>
        <Link to="/documents">Back to documents</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/documents" className="back-link">
        ← Back to documents
      </Link>
      <div className="detail-header">
        <h1>{document.fileName}</h1>
        <StatusBadge status={document.status} />
      </div>
      <p className="page-subtitle">
        Uploaded {new Date(document.uploadedAt).toLocaleString()} ·{' '}
        {Math.ceil(document.fileSize / 1024)} KB
      </p>

      {document.status === 'processing' && (
        <p className="processing-note">Extracting fields, this usually takes a few seconds…</p>
      )}

      {document.status === 'completed' && (
        <div className="field-list">
          {document.fields.map((field) => (
            <div key={field.id} className="field-row">
              <label className="field-label">{field.label}</label>
              <input
                className="field-input"
                value={field.value}
                onChange={(event) =>
                  updateFieldValue(document.id, field.id, event.target.value)
                }
              />
              <span className={`confidence-badge ${confidenceClass(field.confidence)}`}>
                {Math.round(field.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
