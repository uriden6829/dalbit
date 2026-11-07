// The app's Korean dictionary: course items + content/lexicon.js, fed to the analyser in morph.js.
// Built lazily the first time a word is looked up (Shift breakdown, word bank).
import { items } from '../../content/index.js';
import { LEXICON, EXPRESSIONS } from '../../content/lexicon.js';
import { setLexiconSource, analyzeWord, words, expressionAt, buildIndex } from './morph.js';

const short = (en) => String(en || '').replace(/\s*\(.*?\)\s*/g, ' ').split(/[;]/)[0].trim();

export function lexiconSource() {
  const entries = [], expressions = [...EXPRESSIONS];
  for (const it of items.values()) {
    if (it.kind === 'word') entries.push({ ko: it.ko, en: short(it.en) || it.en, pos: it.pos });
    else if (it.kind === 'phrase') {
      const ko = it.ko.replace(/[.?!…]+$/, '');
      if (/\s/.test(ko)) expressions.push({ ko, en: it.en });
      else entries.push({ ko, en: it.en, pos: 'x' });
    }
  }
  entries.push(...LEXICON);
  return { entries, expressions };
}
setLexiconSource(lexiconSource);

export function rebuildDictionary() { const s = lexiconSource(); buildIndex(s.entries, s.expressions); }
export { analyzeWord, words, expressionAt };
