// Builds exercise objects (plain data) from content items. The UI renders them; the session grades them.
import { items, chapters } from '../../content/index.js';
import { shuffle, pick, sample, uniqBy } from '../lib/rand.js';
import { syllables, nearSyllables, romanize, compose, decompose, isSyllable } from '../lib/hangul.js';

// Each new item climbs its ladder: every rung is a different kind of exercise.
export const LADDER = {
  letter: ['letterSound', 'listenLetter', 'readSyllable'],
  word: ['recognize', 'listen', 'recall', 'spell'],
  phrase: ['listenMeaning', 'build', 'recall'],
  gram: ['drill', 'drill', 'drill'],
};
export const RELEARN = { letter: ['letterSound', 'readSyllable'], word: ['recognize', 'recall'], phrase: ['listenMeaning', 'build'], gram: ['drill', 'drill'] };

export const SKILL = {
  letterSound: 'hangul', listenLetter: 'listening', readSyllable: 'hangul',
  recognize: 'reading', listen: 'listening', recall: 'vocab', spell: 'reading',
  listenMeaning: 'listening', build: 'grammar', drill: 'grammar', speak: 'speaking', match: 'vocab', quiz: 'reading', cloze: 'vocab',
};

const chapterIndex = (id) => chapters.findIndex((c) => c.id === id);

// Distractors: same kind, preferring same lesson, then same chapter, then earlier chapters.
function distractors(item, n, field) {
  const ci = chapterIndex(item.chapter);
  const same = (x) => x.id !== item.id && x.kind === item.kind && x[field] && x[field] !== item[field];
  const all = [...items.values()].filter(same);
  const tiers = [
    all.filter((x) => x.lesson === item.lesson),
    all.filter((x) => x.chapter === item.chapter && x.lesson !== item.lesson),
    all.filter((x) => { const i = chapterIndex(x.chapter); return x.chapter !== item.chapter && i <= ci && i >= ci - 3; }),
    all.filter((x) => x.chapter !== item.chapter),
  ];
  const out = [];
  for (const t of tiers) for (const x of shuffle(t)) {
    if (out.length >= n) break;
    if (!out.some((o) => o[field] === x[field])) out.push(x);
  }
  return out;
}

function choice(item, variant, prompt, correct, wrong, extra = {}) {
  const opts = shuffle([{ ...correct, ok: true }, ...wrong.map((w) => ({ ...w, ok: false }))]);
  return { type: 'choice', variant, item: item.id, prompt, options: opts, answer: opts.findIndex((o) => o.ok), skill: SKILL[variant], ...extra };
}

const FINALS = { 'ㄱ': 'ㄱㄲㅋ', 'ㄴ': 'ㄴ', 'ㄷ': 'ㄷㅅㅈㅊㅌㅆ', 'ㄹ': 'ㄹ', 'ㅁ': 'ㅁ', 'ㅂ': 'ㅂㅍ', 'ㅇ': 'ㅇ' };
// Every syllable a letter's reading drill can show (the voice builder renders a clip for each).
export const letterSyllables = (it) => {
  if (it.batchim) {
    return [...FINALS[it.ko]].flatMap((t) => ['ㄱ', 'ㄴ', 'ㅁ', 'ㅂ', 'ㅅ'].flatMap((l) => ['ㅏ', 'ㅗ', 'ㅜ', 'ㅓ'].map((v) => compose({ l, v, t }))));
  }
  const isVowel = /[ㅏ-ㅣ]/.test(it.ko);
  if (isVowel) return ['ㅇ', 'ㄱ', 'ㄴ', 'ㅁ', 'ㅅ'].map((l) => compose({ l, v: it.ko }));
  if (it.ko === 'ㅇ') return ['앙', '공', '방', '강'];
  return ['ㅏ', 'ㅗ', 'ㅜ', 'ㅣ', 'ㅓ'].map((v) => compose({ l: it.ko, v }));
};

export function makeExercise(type, item) {
  const it = typeof item === 'string' ? items.get(item) : item;
  switch (type) {
    case 'intro':
      return { type: 'intro', item: it.id };
    case 'letterSound': {
      const big = it.batchim ? it.say : it.ko;
      return choice(it, type, { big, ask: 'What sound does this make?' },
        { text: it.en }, distractors(it, 3, 'en').map((d) => ({ text: d.en })));
    }
    case 'listenLetter':
      return choice(it, type, { audio: it.say, ask: 'Which one did you hear?' },
        { text: it.say, ko: true }, distractors(it, 3, 'say').map((d) => ({ text: d.say, ko: true })));
    case 'readSyllable': {
      const syl = pick(letterSyllables(it));
      const near = uniqBy(nearSyllables(syl).map((s) => romanize(s)), (x) => x).filter((r) => r !== romanize(syl));
      return choice(it, type, { big: syl, ask: 'How do you read it?', speakAfter: syl },
        { text: romanize(syl) }, sample(near, 3).map((r) => ({ text: r })));
    }
    case 'recognize':
      return choice(it, type, { ko: it.ko, ask: 'What does it mean?', speakAfter: it.ko },
        { text: it.en }, distractors(it, 3, 'en').map((d) => ({ text: d.en })));
    case 'listen':
      return choice(it, type, { audio: it.ko, ask: 'Which word did you hear?' },
        { text: it.ko, ko: true }, distractors(it, 3, 'ko').map((d) => ({ text: d.ko, ko: true })), { reveal: true });
    case 'listenMeaning':
      return choice(it, type, { audio: it.ko, ask: 'What does it mean?', showAfter: it.ko },
        { text: it.en }, distractors(it, 3, 'en').map((d) => ({ text: d.en })), { reveal: true });
    case 'recall':
      return choice(it, type, { en: it.en, ask: 'Which is it in Korean?' },
        { text: it.ko, ko: true }, distractors(it, 3, 'ko').map((d) => ({ text: d.ko, ko: true })), { speakAnswer: true });
    case 'spell': {
      const syl = syllables(it.ko);
      if (syl.length < 2) return makeExercise('listen', it);
      const extra = uniqBy(syl.flatMap((s) => nearSyllables(s)), (x) => x).filter((s) => !syl.includes(s));
      const tiles = shuffle([...syl, ...sample(extra, Math.min(3, Math.max(2, Math.ceil(syl.length / 2))))]);
      return { type: 'tiles', variant: 'spell', item: it.id, prompt: { en: it.en, ask: 'Build the word' }, tiles, answer: syl, joiner: '', skill: SKILL.spell };
    }
    case 'build': {
      const wordsArr = it.ko.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
      if (wordsArr.length < 3) {
        const syl = syllables(it.ko);
        if (syl.length < 2) return makeExercise('listenMeaning', it);
        const extra = uniqBy(syl.flatMap((s) => nearSyllables(s)), (x) => x).filter((s) => !syl.includes(s));
        return { type: 'tiles', variant: 'build', item: it.id, prompt: { en: it.en, ask: 'Put the sounds in order' }, tiles: shuffle([...syl, ...sample(extra, 2)]), answer: syl, joiner: '', skill: SKILL.build };
      }
      return { type: 'tiles', variant: 'build', item: it.id, prompt: { en: it.en, ask: 'Put the words in order' }, tiles: shuffle(wordsArr), answer: wordsArr, joiner: ' ', skill: SKILL.build };
    }
    case 'drill': {
      const d = pick(it.drills);
      const opts = shuffle(d.o.map((text, i) => ({ text, ko: true, ok: i === d.a })));
      return { type: 'choice', variant: 'drill', item: it.id, prompt: { cloze: d.q, en: d.en, ask: 'Fill in the blank' },
        options: opts, answer: opts.findIndex((o) => o.ok), full: d.q.replace('___', d.o[d.a]), skill: SKILL.drill };
    }
    case 'speak':
      return { type: 'speak', item: it.id, target: { ko: it.kind === 'letter' ? it.say : it.ko, en: it.en }, skill: 'speaking' };
    default:
      throw new Error(`Unknown exercise type ${type}`);
  }
}

// Exercise choice for review / practice / exam, harder as mastery grows.
export function pickType(it, { mastery = 0, exam = false, speaking = false } = {}) {
  const k = it.kind;
  if (k === 'gram') return 'drill';
  if (k === 'letter') return pick(LADDER.letter);
  if (k === 'word') {
    if (exam) return pick(['recall', 'spell', 'listen']);
    const pool = mastery <= 2 ? ['recognize', 'listen', 'recall'] : ['recall', 'spell', 'listen', 'recognize'];
    if (speaking && mastery >= 2) pool.push('speak');
    return pick(pool);
  }
  const pool = ['listenMeaning', 'build', 'recall'];
  if (speaking && !exam) pool.push('speak');
  return pick(pool);
}

export function makeMatch(ids) {
  const its = ids.map((id) => items.get(id)).filter((x) => x && (x.kind === 'word' || x.kind === 'phrase') && x.ko.length <= 12);
  const chosen = sample(uniqBy(its, (x) => x.en), 5);
  if (chosen.length < 4) return null;
  return { type: 'match', pairs: chosen.map((x) => ({ id: x.id, ko: x.ko, en: x.en })), skill: 'vocab' };
}

// Story comprehension question -> choice exercise.
export function makeQuiz([q, options, a], extra = {}) {
  const opts = shuffle(options.map((text, i) => ({ text, ko: /[가-힣]/.test(text), ok: i === a })));
  return { type: 'choice', variant: 'quiz', prompt: { en: q, ask: 'Story question' }, options: opts, answer: opts.findIndex((o) => o.ok), skill: 'reading', ...extra };
}

export const isHangul = isSyllable;
export { decompose };
