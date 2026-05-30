import { Redis } from '@upstash/redis';

// Upstash Redis. Works out of the box with the env vars Vercel's Upstash
// marketplace integration injects (KV_REST_API_URL + KV_REST_API_TOKEN).
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
});

export interface Submission {
  id: string;
  quote: string;
  rawText: string;
  theme: string;
  createdAt: number;
}

export interface Theme {
  name: string;
  summary: string;
  color: string;
  count: number;
  // ids of submissions assigned to this theme, newest first
  submissionIds: string[];
}

const SUBMISSIONS_KEY = 'cf:submissions';   // hash: id -> JSON(Submission)
const THEMES_KEY = 'cf:themes';             // hash: name -> JSON(Theme)
const ORDER_KEY = 'cf:order';               // list: submission ids in arrival order
const THEME_ORDER_KEY = 'cf:themeOrder';    // list: theme names in creation order

// CCF brand palette for theme cards. Cycled through as new themes appear.
// Derived from Royal Blue / Olive Brown / Mint / Rosé brand colors.
const COLORS = [
  '#0068cc', // royal blue (brand primary)
  '#524e34', // olive brown (brand neutral)
  '#c73e8e', // rose-deep (brand accent saturated)
  '#4a8c3f', // forest (mint pushed deeper for legibility)
  '#b8893a', // mustard (warm complement)
  '#7a3d8e', // plum (cool complement)
  '#0052a3', // deeper royal blue
  '#3f6b8c', // muted blue-grey
];

export async function getThemes(): Promise<Theme[]> {
  const names = (await redis.lrange<string>(THEME_ORDER_KEY, 0, -1)) ?? [];
  if (names.length === 0) return [];
  const raw = await redis.hmget<Record<string, Theme>>(THEMES_KEY, ...names);
  if (!raw) return [];
  return names
    .map((n) => raw[n])
    .filter((t): t is Theme => Boolean(t));
}

export async function getThemeByName(name: string): Promise<Theme | null> {
  const t = await redis.hget<Theme>(THEMES_KEY, name);
  return t ?? null;
}

export async function getSubmissions(ids: string[]): Promise<Submission[]> {
  if (ids.length === 0) return [];
  const raw = await redis.hmget<Record<string, Submission>>(SUBMISSIONS_KEY, ...ids);
  if (!raw) return [];
  return ids.map((id) => raw[id]).filter((s): s is Submission => Boolean(s));
}

export async function getRecentSubmissionIds(limit: number): Promise<string[]> {
  return (await redis.lrange<string>(ORDER_KEY, 0, limit - 1)) ?? [];
}

export async function getAllSubmissionIds(): Promise<string[]> {
  return (await redis.lrange<string>(ORDER_KEY, 0, -1)) ?? [];
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const ids = await getAllSubmissionIds();
  return getSubmissions(ids);
}

export async function getTotalSubmissionCount(): Promise<number> {
  return (await redis.llen(ORDER_KEY)) ?? 0;
}

export async function addSubmission(opts: {
  id: string;
  quote: string;
  rawText: string;
  theme: string;
  themeSummary: string;
  isNewTheme: boolean;
}): Promise<{ submission: Submission; theme: Theme }> {
  const now = Date.now();
  const submission: Submission = {
    id: opts.id,
    quote: opts.quote,
    rawText: opts.rawText,
    theme: opts.theme,
    createdAt: now,
  };

  // Save submission
  await redis.hset(SUBMISSIONS_KEY, { [opts.id]: submission });
  // Newest first
  await redis.lpush(ORDER_KEY, opts.id);

  // Upsert theme
  let theme = await getThemeByName(opts.theme);
  if (!theme) {
    const existingThemeCount = (await redis.llen(THEME_ORDER_KEY)) ?? 0;
    theme = {
      name: opts.theme,
      summary: opts.themeSummary,
      color: COLORS[existingThemeCount % COLORS.length],
      count: 1,
      submissionIds: [opts.id],
    };
    await redis.rpush(THEME_ORDER_KEY, opts.theme);
  } else {
    theme = {
      ...theme,
      // Refresh the summary if Claude gave us a richer one, otherwise keep existing
      summary: opts.themeSummary && opts.themeSummary.length > theme.summary.length
        ? opts.themeSummary
        : theme.summary,
      count: theme.count + 1,
      submissionIds: [opts.id, ...theme.submissionIds].slice(0, 50),
    };
  }
  await redis.hset(THEMES_KEY, { [opts.theme]: theme });

  return { submission, theme };
}

export async function resetAll(): Promise<void> {
  await Promise.all([
    redis.del(SUBMISSIONS_KEY),
    redis.del(THEMES_KEY),
    redis.del(ORDER_KEY),
    redis.del(THEME_ORDER_KEY),
  ]);
}
