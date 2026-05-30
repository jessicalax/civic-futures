import { NextRequest, NextResponse } from 'next/server';
import { getAllSubmissions, getThemes } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') ?? '';
  const expected = process.env.ADMIN_PASSWORD ?? 'reset';
  if (password !== expected) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  try {
    const [submissions, themes] = await Promise.all([
      getAllSubmissions(),
      getThemes(),
    ]);

    // Themes sorted by count desc, then most recent first
    const sortedThemes = [...themes].sort((a, b) => b.count - a.count);

    return NextResponse.json({
      themes: sortedThemes.map((t) => ({
        name: t.name,
        summary: t.summary,
        color: t.color,
        count: t.count,
      })),
      submissions: submissions.map((s) => ({
        id: s.id,
        quote: s.quote,
        rawText: s.rawText,
        theme: s.theme,
        createdAt: s.createdAt,
      })),
      totalCount: submissions.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
