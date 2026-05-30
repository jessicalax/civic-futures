'use client';

import { useEffect, useState } from 'react';

interface ThemeData {
  name: string;
  summary: string;
  color: string;
  count: number;
  samples: { id: string; quote: string; createdAt: number }[];
}

interface StateData {
  themes: ThemeData[];
  totalCount: number;
  generatedAt: number;
}

export default function DisplayPage() {
  const [state, setState] = useState<StateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as StateData;
        if (!cancelled) {
          setState(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'fetch failed');
        }
      }
    }

    tick();
    const interval = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!state) {
    return (
      <div className="display-wrap">
        <div className="empty-state">
          <h2>Loading…</h2>
          {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
        </div>
      </div>
    );
  }

  const hasSubmissions = state.totalCount > 0 && state.themes.length > 0;

  return (
    <div className="display-wrap">
      <div className="display-header">
        <div className="display-title">Our civic futures</div>
        <div className="display-count">
          {state.totalCount} {state.totalCount === 1 ? 'vision' : 'visions'} ·{' '}
          {state.themes.length} {state.themes.length === 1 ? 'theme' : 'themes'}
        </div>
      </div>

      {!hasSubmissions ? (
        <div className="empty-state">
          <h2>Waiting for the first vision…</h2>
          <p>Scan the QR code to share yours.</p>
        </div>
      ) : (
        <div className="themes-grid">
          {state.themes.map((theme) => (
            <div
              key={theme.name}
              className="theme-card"
              style={{ ['--theme-color' as string]: theme.color }}
            >
              <div className="theme-name">{theme.name}</div>
              <div className="theme-count">
                {theme.count} {theme.count === 1 ? 'voice' : 'voices'}
              </div>
              <div className="theme-summary">{theme.summary}</div>
              <div className="theme-quotes">
                {theme.samples.map((s) => (
                  <div key={s.id} className="theme-quote">
                    &ldquo;{s.quote}&rdquo;
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
