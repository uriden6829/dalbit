// Dictionary coverage: lists every Korean word in the course content that the Shift breakdown cannot explain.
//   node tools/lexcheck.mjs [--all]     (exit code 1 when something is missing)
import { chapters, items, episodes } from '../app/content/index.js';
import { rebuildDictionary, analyzeWord, words } from '../app/js/lib/dictionary.js';
import JIJI from '../app/content/jiji-lines.js';

rebuildDictionary();
const texts = [];
for (const it of items.values()) {
  if (it.kind === 'word' || it.kind === 'phrase') texts.push(it.ko);
  if (it.ex) texts.push(it.ex.ko);
  for (const e of it.examples || []) texts.push(e.ko);
  for (const d of it.drills || []) texts.push(d.q.replace('___', d.o[d.a]));
}
for (const ep of episodes.values()) {
  for (const p of ep.panels || []) { for (const l of p.lines || []) if (l.ko) texts.push(l.ko); if (p.note?.ko) texts.push(p.note.ko); for (const s of p.signs || []) texts.push(s[0]); }
  for (const q of ep.quiz || []) for (const o of q[1]) if (/[가-힣]/.test(o)) texts.push(o);
}
for (const c of chapters) if (c.reading) texts.push(c.reading.ko);
for (const v of Object.values(JIJI)) for (const l of v) if (/[가-힣]/.test(l)) texts.push(l);

const miss = new Map();
let total = 0;
for (const t of texts) for (const w of words(t)) {
  total++;
  const a = analyzeWord(w.text);
  if (!a || (a.guess && process.argv.includes('--strict'))) miss.set(w.text, (miss.get(w.text) || 0) + 1);
}
const list = [...miss.entries()].sort((a, b) => b[1] - a[1]);
console.log(`${total} words checked, ${list.length} unknown forms`);
console.log(list.slice(0, process.argv.includes('--all') ? 5000 : 400).map(([w, n]) => `${w}${n > 1 ? `×${n}` : ''}`).join(' '));
process.exit(list.length ? 1 : 0);
