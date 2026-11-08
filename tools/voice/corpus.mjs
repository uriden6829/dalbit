// Everything the course can say out loud, as clip requests { text, voice, slow }.
// Source of truth for voices is app/js/lib/voicecast.js (the app uses the same casting at runtime).
import { COURSE } from '../../app/content/index.js';
import { BANK } from '../../app/content/placement-bank.js';
import { letterSyllables } from '../../app/js/engine/exercises.js';
import JIJI from '../../app/content/jiji-lines.js';
import { castVoice, speechText, EXTRA_LINES, TEACHERS, jijiKorean, dialogueTurns } from '../../app/js/lib/voicecast.js';

// A line worth a clip: has a Hangul syllable, no Latin letters, no cloze blank / "a = b" notes, and is not grammar
// notation like "-(으)ㄹ까요?" (loose jamo, brackets, leading dash).
const spoken = (s) => typeof s === 'string' && /[가-힣]/.test(s) && !/[A-Za-z_=()ㄱ-ㅣ]/.test(s) && !/^\s*[-~]/.test(s);
const sentences = (t) => t.split(/(?<=[.!?。])\s+/).filter(Boolean);

export function buildCorpus() {
  const lines = new Map(); // text -> Set(who)
  const add = (raw, who = '') => {
    // A conversation: each turn in the voice of whoever says it.
    const turns = raw.includes('\n') ? dialogueTurns(raw) : [];
    if (turns.length > 1) { for (const [turn, voice] of turns) add(turn, voice); return; }
    const t = speechText(raw);
    if (!spoken(t)) return;
    if (!t) return;
    if (!lines.has(t)) lines.set(t, new Set());
    lines.get(t).add(who);
  };
  const seen = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o)) { for (const x of o) (typeof x === 'string' ? add(x) : walk(x)); return; }
    const line = typeof o.ko === 'string' && typeof o.who === 'string';
    if (line) add(o.ko, o.who);
    if (typeof o.q === 'string' && Array.isArray(o.o) && typeof o.a === 'number') add(o.q.replace('___', o.o[o.a])); // drill, filled in
    if (o.kind === 'letter') for (const s of letterSyllables(o)) add(s);
    for (const [k, v] of Object.entries(o)) {
      if (k === 'o' || k === 'title') continue; // drill options (only the right one is said, filled in) and titles are never read out
      if (typeof v === 'string') { if (!(line && k === 'ko')) add(v); } else walk(v);
    }
  };
  walk(COURSE);
  // Entrance exam: the prompt, and the correct option (always written first), which is read out after answering.
  for (const it of BANK) { walk(it.prompt); add(it.options[0]); }
  EXTRA_LINES.forEach((t) => add(t));
  // Jiji in the corner says the Korean bits of her lines in her own voice.
  for (const t of Object.values(JIJI).flat()) { const ko = jijiKorean(t); if (ko) add(ko, 'jiji'); }
  // Long passages are also read one sentence at a time (tap a sentence, or "Read it to me" in pieces).
  for (const [t, whos] of [...lines]) if (sentences(t).length > 1) for (const s of sentences(t)) for (const w of whos) add(s, w);

  const reqs = new Map();
  const req = (text, voice, slow) => { const k = `${voice}|${slow ? 's' : 'n'}|${text}`; if (!reqs.has(k)) reqs.set(k, { text, voice, slow }); };
  for (const [t, whos] of lines) {
    for (const w of whos) {
      for (const slow of [false, true]) {
        req(t, castVoice(t, w), slow);
        // "One voice" in Settings (mix off): lesson lines are all read by the woman teacher.
        if (!w) req(t, castVoice(t, w, false), slow);
      }
    }
  }
  // Settings samples ("Hear her" / "Hear him") need both teachers.
  for (const t of EXTRA_LINES.map(speechText)) for (const v of Object.values(TEACHERS)) { req(t, v, false); req(t, v, true); }
  // Shift + click reads single words (eojeol) from any sentence: normal speed only.
  for (const t of lines.keys()) {
    for (const w of t.split(/\s+/)) {
      const e = w.replace(/[^가-힣0-9\s]/g, '');
      if (e && /[가-힣]/.test(e) && !lines.has(e)) req(e, castVoice(e, ''), false);
    }
  }
  return [...reqs.values()];
}
