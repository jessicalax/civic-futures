import { NextResponse } from 'next/server';
import { getThemes, getSubmissions, getTotalSubmissionCount, getRecentSubmissionIds } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [themes, totalCount, recentIds] = await Promise.all([
      getThemes(),
      getTotalSubmissionCount(),
      getRecentSubmissionIds(20),
    ]);

    // Hydrate each theme with up to 3 sample quotes (newest first)
    const sampleQuoteIds = themes.flatMap((t) => t.submissionIds.slice(0, 3));
    const allNeededIds = Array.from(new Set([...sampleQuoteIds, ...recentIds]));
    const submissions = await getSubmissions(allNeededIds);
    const byId = new Map(submissions.map((s) => [s.id, s]));

    const themesWithSamples = themes
      .map((t) => ({
        name: t.name,
        summary: t.summary,
        color: t.color,
        count: t.count,
        samples: t.submissionIds
          .slice(0, 3)
          .map((id) => byId.get(id))
          .filter((s): s is NonNullable<typeof s> => Boolean(s))
          .map((s) => ({ id: s.id, quote: s.quote, createdAt: s.createdAt })),
      }))
      // sort by count descending, then by most recent submission
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const aLatest = a.samples[0]?.createdAt ?? 0;
        const bLatest = b.samples[0]?.createdAt ?? 0;
        return bLatest - aLatest;
      });

    const recent = recentIds
      .map((id) => byId.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({
        id: s.id,
        quote: s.quote,
        theme: s.theme,
        createdAt: s.createdAt,
      }));

    return NextResponse.json({
      themes: themesWithSamples,
      totalCount,
      recent,
      generatedAt: Date.now(),
    });
  } catch (err) {
    console.error('state error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
