import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { addSubmission } from '@/lib/storage';

export const runtime = 'nodejs';

// Realistic seed data spanning ~5 themes, ~8 submissions. Bypasses Claude.
const SEED: Array<{ quote: string; rawText: string; theme: string; themeSummary: string }> = [
  {
    quote: 'Every kid in my city goes to a school where teachers know their name.',
    rawText: 'I imagine a future where every child in my neighborhood walks into a school where the teachers know who they are, what excites them, and what they need.',
    theme: 'Schools that nurture every child',
    themeSummary: 'Public education that knows each student and meets them where they are.',
  },
  {
    quote: 'Our libraries are the busiest buildings on the block.',
    rawText: 'Libraries that are open late, full of people, with childcare, job help, language classes — the heart of the neighborhood.',
    theme: 'Schools that nurture every child',
    themeSummary: 'Public education that knows each student and meets them where they are.',
  },
  {
    quote: 'Local news that actually shows up to the city council meeting.',
    rawText: 'A future where every town has at least one journalist whose job is to attend the boring meetings and tell us what happened.',
    theme: 'Thriving local journalism',
    themeSummary: 'A revitalized local press that holds power accountable and keeps communities informed.',
  },
  {
    quote: 'I trust the news I get from my neighborhood.',
    rawText: 'I want to trust what I read again. Local reporters, paid fairly, doing the work of telling us the truth about our own places.',
    theme: 'Thriving local journalism',
    themeSummary: 'A revitalized local press that holds power accountable and keeps communities informed.',
  },
  {
    quote: 'Neighbors who know each other by name, across every difference.',
    rawText: 'A civic future where I actually know the people on my street — and we look out for each other, even when we disagree.',
    theme: 'Neighborhoods that know each other',
    themeSummary: 'Communities where people across difference actively know and care for one another.',
  },
  {
    quote: 'A block party every season, and it feels easy.',
    rawText: 'Easy, joyful, regular gatherings — where being together is normal again.',
    theme: 'Neighborhoods that know each other',
    themeSummary: 'Communities where people across difference actively know and care for one another.',
  },
  {
    quote: 'Voting feels like Election Day used to feel — a holiday.',
    rawText: 'I want voting to be a celebration, not a test. Same-day registration, civic holiday, music on the corner.',
    theme: 'Democracy that feels alive',
    themeSummary: 'A civic life where participating in democracy is joyful, easy, and widespread.',
  },
  {
    quote: 'Young people running for school board because they want to.',
    rawText: 'A future where 22-year-olds are excited to run for local office because they see it works.',
    theme: 'Democracy that feels alive',
    themeSummary: 'A civic life where participating in democracy is joyful, easy, and widespread.',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json().catch(() => ({ password: '' }));
    const expected = process.env.ADMIN_PASSWORD ?? 'reset';
    if (password !== expected) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }

    let created = 0;
    for (const s of SEED) {
      await addSubmission({
        id: randomUUID(),
        quote: s.quote,
        rawText: s.rawText,
        theme: s.theme,
        themeSummary: s.themeSummary,
        isNewTheme: false,
      });
      created += 1;
    }

    return NextResponse.json({ ok: true, created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
