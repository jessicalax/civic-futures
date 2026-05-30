'use client';

import { useState } from 'react';

interface ThemeInfo {
  name: string;
  summary: string;
  color: string;
  count: number;
}

interface SubmissionRow {
  id: string;
  quote: string;
  rawText: string;
  theme: string;
  createdAt: number;
}

interface AllData {
  themes: ThemeInfo[];
  submissions: SubmissionRow[];
  totalCount: number;
}

export default function ResultsPage() {
  const [password, setPassword] = useState('');
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/all?password=${encodeURIComponent(password)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Load failed');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (!data) return;
    const rows = [
      ['Submitted at', 'Theme', 'Distilled quote', 'Raw transcription'],
      ...data.submissions.map((s) => [
        new Date(s.createdAt).toISOString(),
        s.theme,
        s.quote,
        s.rawText,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const v = String(cell ?? '');
            if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
            return v;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civic-futures-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!data) {
    return (
      <div className="center-wrap">
        <h1 style={{ fontSize: 32, marginBottom: 8, letterSpacing: '-0.02em' }}>
          All submissions
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Enter the admin password to view</p>
        <div className="admin-form">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') load();
            }}
          />
          <button
            className="btn btn-primary"
            onClick={load}
            disabled={loading || !password}
          >
            {loading ? 'Loading…' : 'View submissions'}
          </button>
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: 'rgba(248,113,113,0.1)',
                color: '#fca5a5',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group submissions by theme, newest first within each theme
  const byTheme = new Map<string, SubmissionRow[]>();
  for (const s of data.submissions) {
    if (!byTheme.has(s.theme)) byTheme.set(s.theme, []);
    byTheme.get(s.theme)!.push(s);
  }
  for (const list of byTheme.values()) {
    list.sort((a, b) => b.createdAt - a.createdAt);
  }

  return (
    <div className="display-wrap">
      <div className="display-header">
        <div>
          <div className="display-title">All submissions</div>
          <div className="display-count" style={{ marginTop: 6 }}>
            {data.totalCount} total · {data.themes.length} themes
          </div>
        </div>
        <button className="btn btn-primary" onClick={downloadCSV} style={{ width: 'auto' }}>
          ⬇ Download CSV
        </button>
      </div>

      {data.themes.length === 0 ? (
        <div className="empty-state">
          <h2>No submissions yet</h2>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {data.themes.map((theme) => {
            const items = byTheme.get(theme.name) ?? [];
            return (
              <section
                key={theme.name}
                className="theme-card"
                style={{ ['--theme-color' as string]: theme.color }}
              >
                <div className="theme-name">{theme.name}</div>
                <div className="theme-count">{theme.count} {theme.count === 1 ? 'voice' : 'voices'}</div>
                <div className="theme-summary">{theme.summary}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  {items.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 10,
                        borderLeft: '3px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      <div style={{ fontSize: 16, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.5 }}>
                        &ldquo;{s.quote}&rdquo;
                      </div>
                      {s.rawText && s.rawText !== s.quote && (
                        <details style={{ fontSize: 13, color: '#94a3b8' }}>
                          <summary style={{ cursor: 'pointer' }}>Raw transcription</summary>
                          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{s.rawText}</div>
                        </details>
                      )}
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
