import { useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../documentStore';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setPendingFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpload() {
    if (pendingFiles.length === 0) return;
    pendingFiles.forEach((file) => uploadDocument(file));
    setPendingFiles([]);
    navigate('/documents');
  }

  return (
    <div className="page">
      <h1>Upload documents</h1>
      <p className="page-subtitle">
        Drop files below to send them for automatic field extraction.
      </p>

      <div
        className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <p>Drag and drop files here, or</p>
        <label className="file-input-label">
          Browse files
          <input
            type="file"
            multiple
            className="file-input"
            onChange={(event) => addFiles(event.target.files)}
          />
        </label>
      </div>

      {pendingFiles.length > 0 && (
        <div className="pending-list">
          <h2>Ready to upload</h2>
          <ul>
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="pending-item">
                <span>{file.name}</span>
                <span className="pending-size">{Math.ceil(file.size / 1024)} KB</span>
                <button className="link-button" onClick={() => removeFile(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button className="primary-button" onClick={handleUpload}>
            Upload {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
