// Direct browser call to the Claude Messages API with her own API key (kept only in her browser).
// Raw fetch rather than the SDK: the app is static files with no build step.
import { getApiKey } from '../lib/store.js';

const API = 'https://api.anthropic.com/v1/messages';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', note: 'Best teacher. About 2¢ per chat reply, 10¢ per new lesson.' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', note: 'Very good and cheaper. About 1¢ per reply, 5¢ per lesson.' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', note: 'Cheapest by far (fractions of a cent). Simpler explanations.' },
];
export const DEFAULT_MODEL = 'claude-opus-5-5';

// Sites the web search may read. Reputable Korean news, tourism, government and dictionary sources.
export const WEB_DOMAINS = [
  'ko.wikipedia.org', 'en.wikipedia.org', 'korea.net', 'english.visitkorea.or.kr', 'korean.visitkorea.or.kr',
  'en.yna.co.kr', 'yna.co.kr', 'koreaherald.com', 'koreajoongangdaily.joins.com', 'world.kbs.co.kr', 'news.kbs.co.kr',
  'english.hani.co.kr', 'hani.co.kr', 'korean.go.kr', 'stdict.korean.go.kr',
];

export class AIError extends Error {}

// messages: [{ role: 'user'|'assistant', content: string }] — plain text only, so earlier thinking blocks are
// never replayed and the system prompt can change between turns without breaking anything.
export async function askClaude({ system, messages, model = DEFAULT_MODEL, effort = 'low', maxTokens = 8000, web = false, signal }) {
  const key = getApiKey();
  if (!key) throw new AIError('No API key yet. Add one in Settings → Jiji’s magic.');
  const headers = {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  const body = { model, max_tokens: maxTokens, system, messages: messages.map((m) => ({ role: m.role, content: m.content })), output_config: { effort } };
  // If a safety classifier declines, let the API retry on a suitable model automatically.
  if (model !== 'claude-haiku-5-5') { body.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
  if (web) {
    body.tools = [{ type: model === 'claude-haiku-5-5' ? 'web_search_20250305' : 'web_search_20260209', name: 'web_search', max_uses: 4, allowed_domains: WEB_DOMAINS }];
  }

  let res, data;
  for (let round = 0; round < 4; round++) {
    try {
      res = await fetch(API, { method: 'POST', headers, body: JSON.stringify(body), signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new AIError('Couldn’t reach Claude. Check the internet connection.');
    }
    data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText;
      if (res.status === 401) throw new AIError('The API key was rejected. Check it in Settings.');
      if (res.status === 429) throw new AIError('Claude is busy or the account hit its limit. Try again in a minute.');
      if (res.status === 400 && /credit|balance/i.test(msg)) throw new AIError('The API account is out of credit.');
      throw new AIError(`Claude returned an error: ${msg}`);
    }
    if (data.stop_reason === 'refusal') throw new AIError('Claude declined that request. Try asking it a different way.');
    // Server-side web search may pause a long turn; resend the conversation so it can resume.
    if (data.stop_reason === 'pause_turn') {
      body.messages = [...body.messages, { role: 'assistant', content: data.content }];
      continue;
    }
    break;
  }
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  if (!text) throw new AIError('Claude sent back an empty answer. Try again.');
  return { text, usage: data.usage, truncated: data.stop_reason === 'max_tokens' };
}

export async function testKey(model) {
  const r = await askClaude({ system: 'Reply with the single word: 네', messages: [{ role: 'user', content: 'Test' }], model, maxTokens: 400 });
  return r.text;
}
