import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

export interface ThemeContext {
  name: string;
  summary: string;
  count: number;
}

export interface AnalysisResult {
  quote: string;        // one-line distilled essence of the submission
  theme: string;        // theme name (existing or new)
  themeSummary: string; // 1-sentence description of the theme
  isNewTheme: boolean;
  rawText: string;      // best-effort transcription
}

const SYSTEM_PROMPT = `You are helping facilitate a live civic-futures workshop. Participants are writing their vision for a better civic future by hand on paper, photographing it, and submitting it. Your job for each submission:

1. READ the handwriting carefully (it may be messy — do your best).
2. DISTILL the core vision into ONE short, vivid sentence (max ~20 words). Use the participant's own voice — first person if they used it, present tense ideally. This is what will show on the big screen, so make it crisp.
3. ASSIGN it to a theme. You will be given the current list of themes. If the submission fits an existing theme reasonably well, USE THAT EXACT theme name. Only create a new theme if the submission is genuinely about something none of the existing themes capture.
4. If you create a new theme, name it as a short noun phrase (2-5 words). Themes should be ASPIRATIONAL and POSITIVE ("Thriving local journalism", "Schools that nurture every child") not problems ("Media decline", "Failing schools"). The vision, not the absence.

Return ONLY valid JSON in this exact shape:
{
  "rawText": "best-effort transcription of what they wrote",
  "quote": "the one-line distilled sentence",
  "theme": "Exact theme name",
  "themeSummary": "One sentence describing what this theme is about, written in present-future tense.",
  "isNewTheme": true | false
}

If the image is unreadable, blank, or clearly not a civic-futures response (e.g. just a face, a meme, a blank page), still return JSON but set:
{ "rawText": "", "quote": "(unreadable submission)", "theme": "Unclear", "themeSummary": "Submissions that could not be read.", "isNewTheme": true }`;

export async function analyzeSubmission(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  existingThemes: ThemeContext[]
): Promise<AnalysisResult> {
  const themesBlock = existingThemes.length
    ? existingThemes
        .map((t, i) => `${i + 1}. "${t.name}" — ${t.summary} (${t.count} submission${t.count === 1 ? '' : 's'} so far)`)
        .join('\n')
    : '(no themes yet — this is one of the first submissions)';

  const userMessage = `Current themes:\n${themesBlock}\n\nAnalyze the attached photo of a handwritten civic-future submission.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          { type: 'text', text: userMessage },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content');
  }

  const parsed = extractJSON(textBlock.text);
  return {
    rawText: String(parsed.rawText ?? ''),
    quote: String(parsed.quote ?? '(unreadable submission)'),
    theme: String(parsed.theme ?? 'Unclear'),
    themeSummary: String(parsed.themeSummary ?? ''),
    isNewTheme: Boolean(parsed.isNewTheme),
  };
}

// Claude sometimes wraps JSON in ```json fences or adds prose — extract leniently.
function extractJSON(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error(`Could not find JSON in Claude response: ${text.slice(0, 300)}`);
  }
  const slice = candidate.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(slice);
  } catch (err) {
    throw new Error(`Failed to parse JSON from Claude: ${slice.slice(0, 300)}`);
  }
}
