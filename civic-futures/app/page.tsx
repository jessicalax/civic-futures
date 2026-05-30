'use client';

import { useRef, useState } from 'react';

type Status = 'idle' | 'preview' | 'uploading' | 'success' | 'error';

interface SuccessData {
  quote: string;
  theme: { name: string; color: string };
}

export default function UploadPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('preview');
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setStatus('idle');
    setError(null);
    setSuccess(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus('uploading');
    setError(null);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('photo', compressed, 'photo.jpg');

      const res = await fetch('/api/submit', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);

      setSuccess({
        quote: json.submission.quote,
        theme: { name: json.theme.name, color: json.theme.color },
      });
      setStatus('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setStatus('error');
    }
  }

  if (status === 'success' && success) {
    return (
      <div
        className="success-wrap"
        style={{ ['--theme-color' as string]: success.theme.color }}
      >
        <div className="success-icon">✨</div>
        <h1>Thank you</h1>
        <p style={{ color: '#94a3b8', marginTop: '8px' }}>
          Your vision is part of the room.
        </p>
        <div className="success-quote">&ldquo;{success.quote}&rdquo;</div>
        <div className="success-theme">
          Added to <strong>{success.theme.name}</strong>
        </div>
        <button className="btn btn-secondary" onClick={reset}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="upload-wrap">
      <div className="upload-header">
        <h1>Your civic future</h1>
        <p>
          Take a photo of what you wrote. Your vision will join the room&apos;s on the big
          screen.
        </p>
      </div>

      <div className="photo-slot">
        {previewUrl ? (
          <img src={previewUrl} alt="Your submission" />
        ) : (
          <div className="placeholder">
            <div className="big">📷</div>
            <div>Tap below to take a photo</div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="photo-actions">
        {status === 'idle' && (
          <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>
            📷 Take photo
          </button>
        )}

        {status === 'preview' && (
          <>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Submit
            </button>
            <button className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
              Retake
            </button>
          </>
        )}

        {status === 'uploading' && (
          <button className="btn btn-primary" disabled>
            Reading your vision…
          </button>
        )}

        {status === 'error' && (
          <>
            <div className="error-msg">{error}</div>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Try again
            </button>
            <button className="btn btn-secondary" onClick={reset}>
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Resize/recompress to keep uploads small + fast. Long edge max 1600px, JPEG ~85%.
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || file),
      'image/jpeg',
      0.85
    );
  });
}
