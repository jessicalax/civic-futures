'use client';

import { useEffect, useState } from 'react';

export default function QRPage() {
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!origin) {
    return <div className="center-wrap">Loading…</div>;
  }

  // Use Google Charts QR endpoint — no extra dependency needed.
  // Renders a high-contrast QR at 480px.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${encodeURIComponent(
    origin
  )}`;

  return (
    <div className="center-wrap">
      <div className="upload-eyebrow" style={{ marginBottom: 16 }}>
        Center for Civic Futures
      </div>
      <h1>Share your civic future</h1>
      <p style={{ color: 'var(--olive-brown-soft)', marginBottom: 32, fontSize: 18 }}>
        Scan with your phone camera
      </p>
      <div className="qr-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="QR code" width={480} height={480} />
      </div>
      <div className="qr-url">{origin}</div>
    </div>
  );
}
