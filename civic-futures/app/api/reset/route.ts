import { NextRequest, NextResponse } from 'next/server';
import { resetAll } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json().catch(() => ({ password: '' }));
    const expected = process.env.ADMIN_PASSWORD ?? 'reset';
    if (password !== expected) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }
    await resetAll();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
