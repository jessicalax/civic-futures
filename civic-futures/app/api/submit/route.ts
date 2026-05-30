import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { analyzeSubmission } from '@/lib/claude';
import { addSubmission, getThemes } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 60; // give Claude time on slow images

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('photo');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing photo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    if (buffer.length > 9 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 9MB)' }, { status: 413 });
    }

    const mediaType = pickMediaType(file.type);
    const base64 = buffer.toString('base64');

    const themes = await getThemes();
    const themeContexts = themes.map((t) => ({
      name: t.name,
      summary: t.summary,
      count: t.count,
    }));

    const analysis = await analyzeSubmission(base64, mediaType, themeContexts);

    const id = randomUUID();
    const { submission, theme } = await addSubmission({
      id,
      quote: analysis.quote,
      rawText: analysis.rawText,
      theme: analysis.theme,
      themeSummary: analysis.themeSummary,
      isNewTheme: analysis.isNewTheme,
    });

    return NextResponse.json({
      ok: true,
      submission,
      theme: { name: theme.name, summary: theme.summary, color: theme.color, count: theme.count },
    });
  } catch (err) {
    console.error('submit error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function pickMediaType(type: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  if (type === 'image/gif') return 'image/gif';
  return 'image/jpeg';
}
