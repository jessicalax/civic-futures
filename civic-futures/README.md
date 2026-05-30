# Civic Futures

A real-time tool for a summit breakout. Participants write their civic future by hand on paper, photograph it with their phone (via QR code), and submissions are read by Claude vision, distilled into a one-line vision, and clustered into emerging themes — all live on a projector screen at the front of the room.

## What it does

- **`/`** — Mobile-friendly upload page. Tap a button, take a photo of handwriting, submit. Confirmation screen shows back the distilled quote + assigned theme.
- **`/display`** — Projector-friendly live view. Theme cards with count + 3 most recent quotes per theme. Auto-refreshes every 2.5 seconds.
- **`/qr`** — A scannable QR code that points back to the upload page. Project this before the breakout so people can scan.
- **`/admin`** — Password-protected reset (clears all submissions). Run this between sessions.

## Pre-event setup (15 minutes)

You'll need three accounts:

1. **Anthropic API key** — sign up at [console.anthropic.com](https://console.anthropic.com), add ~$5 in credits (Settings → Billing). Create an API key (Settings → API Keys). Keep it — you'll paste it into Vercel in a moment.

2. **Vercel** — you already have an account.

3. **Upstash Redis** — you'll add this as a Vercel integration in a moment. No separate signup.

### Deploy

The cleanest path is to push this folder to GitHub, then import into Vercel.

#### Option A — via GitHub (recommended)

1. Create a new repo at [github.com/new](https://github.com/new). Name it `civic-futures`. Don't initialize with a README.
2. From the GitHub repo page, click "uploading an existing file" and drag the contents of this folder in. Commit.
3. Go to [vercel.com/new](https://vercel.com/new) → Import this GitHub repo. Click Deploy (it will fail on the build step — that's fine, we need to add env vars).
4. In the Vercel project dashboard → **Storage** tab → **Create Database** → choose **Upstash** (the Redis option) → accept defaults. Vercel will inject `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
5. In **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from step 1 above
   - `ADMIN_PASSWORD` = whatever you want (e.g. `civic2026`)
6. Go to **Deployments** → click the latest one → **Redeploy**.

#### Option B — via Vercel CLI

If you'd rather install Node + the Vercel CLI:

```bash
# install Node from https://nodejs.org (LTS)
npm i -g vercel
cd civic-futures
vercel        # follow prompts to link/create the project
# then add env vars + Upstash via dashboard as above, then:
vercel --prod
```

### Verify it works

Once deployed, you'll have a URL like `https://civic-futures-xxx.vercel.app`. Visit:
- `/qr` on your laptop → confirm a QR code appears
- Scan it with your phone → upload a test photo of something you wrote
- `/display` on your laptop → confirm a theme card appears within a few seconds

### Day of the summit

1. Open `/display` on the projector laptop, full screen.
2. Open `/qr` on a second screen or briefly to show participants. Or print the QR ahead of time and put it on the tables.
3. Before each new session, hit `/admin` and reset.

## Cost

Roughly **$0.01–$0.03 per submission** depending on image size. 100 submissions ≈ $1–3 in Anthropic credits. Upstash + Vercel are free at this scale.

## Configuration

All in environment variables (set in Vercel dashboard):

| Var | Required | Default | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — | Your Anthropic key |
| `KV_REST_API_URL` | yes | — | Auto-set by Vercel Upstash integration |
| `KV_REST_API_TOKEN` | yes | — | Auto-set by Vercel Upstash integration |
| `ADMIN_PASSWORD` | no | `reset` | Password for the `/admin` reset page |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-5` | If a newer model is available, set it here |

## How theme clustering works

When each submission arrives:
1. The image is sent to Claude with the current list of themes.
2. Claude reads the handwriting, distills the vision to one sentence, and either picks an existing theme name or proposes a new one.
3. The submission is stored and the display updates within ~3 seconds.

The prompt asks Claude to be conservative about creating new themes (prefer reusing existing names when reasonable) and to frame all themes positively/aspirationally rather than as problems.

You can adjust the prompt in `lib/claude.ts`.

## Tweaks you might want

- **Make Claude more/less likely to create new themes**: edit the `SYSTEM_PROMPT` in `lib/claude.ts`. Right now it nudges Claude to reuse themes.
- **Cap the number of themes shown**: in `app/api/state/route.ts`, slice the sorted themes array.
- **Change refresh speed**: in `app/display/page.tsx`, edit the `setInterval(tick, 2500)` value.
- **Different theme card visuals**: edit `.theme-card` etc. in `app/globals.css`.

## Troubleshooting

- **"Submission failed" on phone**: usually means the API key isn't set or has no credit. Check Vercel logs (Deployments → latest → Logs).
- **Themes look weird/duplicated**: hit `/admin` and reset between test runs.
- **Display shows "Loading…" forever**: Upstash env vars aren't set. Check Vercel → Storage → Upstash integration is active.
- **QR code points to wrong URL**: the `/qr` page uses whatever URL it's loaded from. Open it from your final production domain.
