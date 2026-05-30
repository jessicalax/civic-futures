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
      <h1 style={{ fontSize: 40, marginBottom: 8, letterSpacing: '-0.02em' }}>
        Share your civic future
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 18 }}>
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
