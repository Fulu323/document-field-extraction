import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { subscribe, getSnapshot } from '../documentStore';
import StatusBadge from '../components/StatusBadge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function DocumentListPage() {
  const documents = useSyncExternalStore(subscribe, getSnapshot);

  if (documents.length === 0) {
    return (
      <div className="page">
        <h1>Documents</h1>
        <p className="page-subtitle">
          No documents yet. <Link to="/upload">Upload one</Link> to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Documents</h1>
      <table className="doc-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Uploaded</th>
            <th>Status</th>
            <th>Fields</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <Link to={`/documents/${doc.id}`}>{doc.fileName}</Link>
              </td>
              <td>{formatDate(doc.uploadedAt)}</td>
              <td>
                <StatusBadge status={doc.status} />
              </td>
              <td>{doc.status === 'completed' ? doc.fields.length : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
