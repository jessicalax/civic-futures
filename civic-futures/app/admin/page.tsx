'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleReset() {
    if (!confirm('Erase ALL submissions and themes? This cannot be undone.')) return;
    setStatus('working');
    setMessage('');
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Reset failed');
      setStatus('done');
      setMessage('All submissions cleared.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Reset failed');
    }
  }

  return (
    <div className="center-wrap">
      <h1 style={{ fontSize: 32, marginBottom: 24, letterSpacing: '-0.02em' }}>
        Admin
      </h1>
      <div className="admin-form">
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={handleReset}
          disabled={status === 'working' || !password}
        >
          {status === 'working' ? 'Resetting…' : 'Reset all submissions'}
        </button>
        {message && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: status === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)',
              color: status === 'error' ? '#fca5a5' : '#6ee7b7',
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
