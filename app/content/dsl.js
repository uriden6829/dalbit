// Content helpers. Rows are "field | field | field"; lines starting with // are ignored.
//
// words(`ko | english | memory hint | example ko = example en | pron=override`)
//   - add "#tag" to ko to disambiguate homonyms, e.g. "배#belly" (shown as 배, id w:배#belly)
// phrases(`ko | english | note`)
// grammar: { id, title, en, explain: [..], examples: [[ko, en]..], drills: [[question with ___, [options], answerIndex, english]..] }

function rows(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//'))
    .map((l) => l.split('|').map((f) => f.trim()));
}
function extras(fields) {
  const out = {};
  for (const f of fields) { const m = /^(\w+)=(.+)$/.exec(f || ''); if (m) out[m[1]] = m[2].trim(); }
  return out;
}
const pair = (s) => { if (!s || !s.includes(' = ')) return null; const [ko, en] = s.split(' = '); return { ko: ko.trim(), en: en.trim() }; };

export function words(text) {
  return rows(text).map(([key, en, hint, ex, ...rest]) => ({
    kind: 'word', key, ko: key.replace(/#.*$/, ''), en, hint: hint || '', ex: pair(ex), ...extras(rest),
  }));
}
export function phrases(text) {
  return rows(text).map(([key, en, note, ...rest]) => ({
    kind: 'phrase', key, ko: key.replace(/#.*$/, ''), en, hint: note || '', ...extras(rest),
  }));
}
export function grammar(g) {
  return {
    kind: 'gram', key: g.id, ko: g.title, ...g,
    drills: g.drills.map(([q, o, a, en]) => ({ q, o, a, en })),
    examples: (g.examples || []).map(([ko, en]) => ({ ko, en })),
  };
}
// Webtoon line helpers: say(who, ko, en) and note(en, ko?)
export const say = (who, ko, en, extra = {}) => ({ who, ko, en, ...extra });
