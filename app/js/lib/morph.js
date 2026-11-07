// Korean word analysis for the Shift breakdown and the word bank.
// Works by generation, not guessing: every lexicon entry (course words + content/lexicon.js) is expanded into
// its common surface forms (verb endings, irregular stems, noun + particles), so "아파요" maps to
// 아프다 + -아요 and "약국에서" to 약국 + 에서. tools/validate.mjs checks that every word in the course,
// the stories and the readings is covered. Pure module (no DOM) so node can test it.
import { isSyllable, decompose, compose } from './hangul.js';

// ---------- jamo helpers ----------
const last = (s) => s[s.length - 1];
const head = (s) => s.slice(0, -1);
const hasBatchim = (s) => isSyllable(last(s)) && !!decompose(last(s)).t;
const finalOf = (s) => (isSyllable(last(s)) ? decompose(last(s)).t : '');
const vowelOf = (s) => decompose(last(s)).v;
function setFinal(s, t) { const d = decompose(last(s)); return head(s) + compose({ ...d, t }); }
// Adds a jamo batchim (ㄴ ㄹ ㅂ ㅆ ㅁ) or a syllable string to a stem.
function add(stem, rest) {
  if (!rest) return stem;
  const j = rest[0];
  if (/[ㄱ-ㅎ]/.test(j)) return setFinal(stem, j) + rest.slice(1);
  return stem + rest;
}
const bright = (s) => { for (let i = s.length - 1; i >= 0; i--) { if (!isSyllable(s[i])) continue; const v = decompose(s[i]).v; if (v !== 'ㅡ' || i === 0) return v === 'ㅏ' || v === 'ㅗ' || v === 'ㅑ'; } return false; };

// ---------- irregular verbs ----------
const IRR_B = new Set('어둡다 춥다 덥다 맵다 어렵다 쉽다 가깝다 무겁다 가볍다 귀엽다 즐겁다 반갑다 고맙다 아름답다 더럽다 뜨겁다 차갑다 시끄럽다 부럽다 아깝다 무섭다 싱겁다 눕다 돕다 굽다 밉다 부끄럽다 그립다 새롭다 외롭다 괴롭다 놀랍다 사랑스럽다 자연스럽다 조심스럽다 부드럽다 두껍다 간지럽다 아쉽다'.split(' '));
const IRR_D = new Set('듣다 걷다 묻다#ask 싣다 깨닫다 들다#hear'.split(' '));
const IRR_S = new Set('낫다 짓다 붓다 잇다 젓다'.split(' '));
const IRR_H = new Set('그렇다 이렇다 저렇다 어떻다 빨갛다 노랗다 파랗다 하얗다 까맣다 동그랗다'.split(' '));

function kindOf(lemma) {
  const stem = head(lemma);
  if (lemma === '이다' || lemma === '아니다') return 'copula';
  if (stem.endsWith('하')) return 'ha';
  if (IRR_B.has(lemma)) return 'b';
  if (IRR_D.has(lemma) || IRR_D.has(lemma + '#ask')) return 'd';
  if (IRR_S.has(lemma)) return 's';
  if (IRR_H.has(lemma)) return 'h';
  if (last(stem) === '르' && stem.length > 1 && !['따르다', '치르다', '들르다'].includes(lemma)) return 'reu';
  if (finalOf(stem) === 'ㄹ') return 'l';
  if (isSyllable(last(stem)) && vowelOf(stem) === 'ㅡ' && !hasBatchim(stem)) return 'eu';
  return hasBatchim(stem) ? 'c' : 'v';
}

// 아/어 form ("infinitive"): 가 -> 가, 먹 -> 먹어, 마시 -> 마셔, 하 -> 해, 춥 -> 추워, 모르 -> 몰라, 그렇 -> 그래
function infinitive(stem, kind) {
  if (kind === 'ha') return head(stem) + '해';
  if (stem === '이' ) return '이어';
  if (kind === 'b') { const s = setFinal(stem, ''); return ['돕', '곱'].includes(stem) ? s + '와' : s + '워'; }
  if (kind === 'd') return setFinal(stem, 'ㄹ') + (bright(stem) ? '아' : '어');
  if (kind === 's') return setFinal(stem, '') + (bright(stem) ? '아' : '어');
  if (kind === 'h') { const d = decompose(last(stem)); return head(stem) + compose({ l: d.l, v: d.v === 'ㅑ' ? 'ㅒ' : 'ㅐ' }); }
  if (kind === 'reu') { const pre = head(stem); return setFinal(pre, 'ㄹ') + (bright(pre) ? '라' : '러'); }
  if (kind === 'eu') {
    const pre = head(stem), d = decompose(last(stem));
    const v = pre && bright(pre) ? 'ㅏ' : 'ㅓ';
    return pre + compose({ l: d.l, v });
  }
  if (hasBatchim(stem)) return stem + (bright(stem) ? '아' : '어');
  const d = decompose(last(stem));
  const map = { 'ㅏ': 'ㅏ', 'ㅓ': 'ㅓ', 'ㅐ': 'ㅐ', 'ㅔ': 'ㅔ', 'ㅕ': 'ㅕ', 'ㅗ': 'ㅘ', 'ㅜ': 'ㅝ', 'ㅣ': 'ㅕ', 'ㅚ': 'ㅙ', 'ㅡ': 'ㅓ' };
  if (map[d.v]) return head(stem) + compose({ l: d.l, v: map[d.v] });
  return stem + '어';
}

// Stem before an (으)-ending: 먹 -> 먹으, 가 -> 가, 살 -> 사 (before ㄴ ㅂ ㅅ), 춥 -> 추우, 듣 -> 들으, 그렇 -> 그러
function euStem(stem, kind, rest) {
  if (kind === 'l') return /^[ㄴㅂㄹ]|^[니세시십습]/.test(rest) ? setFinal(stem, '') : stem;
  if (kind === 'b') return setFinal(stem, '') + '우';
  if (kind === 'd') return setFinal(stem, 'ㄹ') + '으';
  if (kind === 's') return setFinal(stem, '') + '으';
  if (kind === 'h') return setFinal(stem, '');
  if (hasBatchim(stem)) return stem + '으';
  return stem;
}

// Ending table. a = uses the 아/어 form, u = (으)-ending, p = plain stem + ending, f = formal (스)ㅂ니다.
// only: 'v' verbs only, 'a' adjectives only.
const E = [
  ['a', '요', 'polite present (-아요/-어요)'], ['a', '', 'casual (-아/-어) or "and then"'],
  ['a', 'ㅆ어요', 'polite past (-았어요/-었어요)'], ['a', 'ㅆ어', 'casual past'], ['a', 'ㅆ다', 'past (plain)'],
  ['a', 'ㅆ습니다', 'formal past'], ['a', 'ㅆ습니까', 'formal past question'], ['a', 'ㅆ지만', 'past + but'], ['a', 'ㅆ는데', 'past + background (-았는데)'],
  ['a', 'ㅆ는데요', 'past + soft ending'], ['a', 'ㅆ네요', 'past + "oh, I see"'], ['a', 'ㅆ고', 'past + and'], ['a', 'ㅆ을', 'past + modifier'],
  ['a', 'ㅆ으면', 'if (had)'], ['a', 'ㅆ거든요', 'past + you see'], ['a', 'ㅆ죠', 'past + right?'], ['a', 'ㅆ잖아요', 'past + as you know'],
  ['a', '서', 'and so / and then (-아서/-어서)'], ['a', '서요', 'because… (-아서요)'], ['a', '야', 'must (-아야/-어야)'], ['a', '도', 'even if (-아도/-어도)'],
  ['a', '라', 'command (casual)'], ['a', '줘', 'do for me'], ['a', '줘요', 'do for me (polite)'], ['a', '주세요', 'please do (for me)'],
  ['a', '봐요', 'try doing'], ['a', '보세요', 'try doing (polite)'], ['a', '봐', 'try (casual)'], ['a', '봤어요', 'tried doing'], ['a', '있어요', 'is (in a state)'],
  ['a', '져요', 'becomes'], ['a', '졌어요', 'became'], ['a', '드릴게요', 'I will do for you'],
  ['p', '고', 'and (-고)'], ['p', '고요', 'and also (-고요)'], ['p', '지만', 'but (-지만)'], ['p', '지', 'not / (with 마세요, 않아요)'], ['p', '지요', 'right? (-지요)'], ['p', '죠', 'right? (-죠)'],
  ['p', '네요', '"oh!" — noticing (-네요)'], ['p', '네', '"oh!" (casual)'], ['p', '다', 'dictionary form'], ['p', '기', '-ing (noun form, -기)'], ['p', '겠어요', 'will / must be (-겠어요)'],
  ['p', '겠습니다', 'will (formal)'], ['p', '겠다', 'will (plain)'], ['p', '자', 'let’s (casual)'], ['p', '거든요', 'you see (-거든요)'], ['p', '잖아요', 'as you know (-잖아요)'],
  ['p', '다가', 'while… then (-다가)'], ['p', '던', 'used to (-던)'], ['p', '고 싶어요', ''], ['p', '기로', 'decided to (-기로)'], ['p', '기 전에', ''], ['p', '게', 'so that / -ly (-게)'],
  ['p', '는', 'present modifier (-는)', 'v'], ['p', '는데', 'and/but… background (-는데)', 'v'], ['p', '는데요', 'soft ending (-는데요)', 'v'], ['p', '는군요', 'I see (-는군요)', 'v'],
  ['p', '냐', 'question (casual)'], ['p', '니', 'question (casual, -니)'],
  ['u', 'ㄴ', 'modifier: past (verbs) / descriptive (adjectives)'], ['u', 'ㄴ데', 'and/but… background (-은데)', 'a'], ['u', 'ㄴ데요', 'soft ending (-은데요)', 'a'],
  ['u', 'ㄹ', 'future modifier (-을)'], ['u', 'ㄹ게요', 'I will (promise, -을게요)'], ['u', 'ㄹ게', 'I will (casual)'], ['u', 'ㄹ까요', 'shall we? / do you think? (-을까요)'],
  ['u', 'ㄹ까', 'shall I? (casual)'], ['u', 'ㄹ래요', 'want to? (-을래요)'], ['u', 'ㄹ래', 'want to (casual)'], ['u', 'ㄹ 거예요', ''], ['u', 'ㄹ수록', 'the more… (-을수록)'],
  ['u', '세요', 'please / honorific (-으세요)'], ['u', '세요?', ''], ['u', '셨어요', 'honorific past (-으셨어요)'], ['u', '셔요', 'honorific (-으셔요)'], ['u', '시고', 'honorific + and'],
  ['u', '십시오', 'formal request'], ['u', '십니다', 'honorific formal'], ['u', '시겠어요', 'would you? (honorific)'], ['u', '시면', 'if you (honorific)'], ['u', '신', 'honorific modifier'],
  ['u', '면', 'if / when (-으면)'], ['u', '니까', 'because / when (-으니까)'], ['u', '러', 'in order to (go…) (-으러)'], ['u', '면서', 'while (-으면서)'], ['u', '려고', 'intending to (-으려고)'],
  ['u', '려고요', 'I intend to (-으려고요)'], ['u', '세', ''], ['u', 'ㅂ시다', 'let’s (formal)'], ['u', '니', 'since (-으니)'],
  ['f', 'ㅂ니다', 'formal polite (-습니다)'], ['f', 'ㅂ니까', 'formal question (-습니까)'],
].filter((e) => e[2]);

function conjugate(lemma, pos) {
  const out = [];
  const stem = head(lemma), kind = kindOf(lemma);
  const inf = infinitive(stem, kind);
  for (const [k, end, gloss, only] of E) {
    if (only && only !== (pos === 'a' ? 'a' : 'v')) continue;
    let form;
    if (k === 'a') form = add(inf, end);
    else if (k === 'p') form = kind === 'l' && /^[ㄴ네니는]/.test(end) ? setFinal(stem, '') + end : stem + end;
    else if (k === 'u') {
      if (kind === 'l' && end[0] === 'ㄹ') form = stem + end.slice(1);
      else form = add(euStem(stem, kind, end), end);
    } else if (k === 'f') {
      if (kind === 'l') form = add(setFinal(stem, ''), end);
      else if (hasBatchim(stem)) form = stem + '습' + end.slice(1);
      else form = add(kind === 'h' ? setFinal(stem, '') : stem, end);
    }
    const ending = k === 'a' ? `-${bright(stem) && kind !== 'ha' ? '아' : '어'}${end.replace('ㅆ', 'ㅆ')}` : `-${end}`;
    out.push([form, { ko: ending.replace(/^-아ㅆ/, '-았').replace(/^-어ㅆ/, '-었').replace(/^-ㄴ/, '-(으)ㄴ').replace(/^-ㄹ/, '-(으)ㄹ'), en: gloss }]);
  }
  // 하다 contractions and the polite 해요 family are covered by infinitive(); add 하여 / 합니다 variants.
  if (kind === 'ha') out.push([head(stem) + '합니다', { ko: '-ㅂ니다', en: 'formal polite' }], [head(stem) + '했습니다', { ko: '-었습니다', en: 'formal past' }]);
  return out;
}

// ---------- copula 이다 after nouns ----------
const COPULA = [
  ['이에요', '예요', 'is (polite) — 이에요/예요'], ['입니다', '입니다', 'is (formal) — 입니다'], ['이야', '야', 'is (casual)'], ['이었어요', '였어요', 'was (polite)'],
  ['이었어', '였어', 'was (casual)'], ['인데', '인데', 'is… and/but (-인데)'], ['인데요', '인데요', 'is… (soft)'], ['이고', '고', 'is… and'], ['이지만', '지만', 'is, but'],
  ['이네요', '네요', 'is! (noticing)'], ['이죠', '죠', 'is, right?'], ['이세요', '세요', 'is (honorific)'], ['이라서', '라서', 'because it is'], ['이라고', '라고', 'called / saying'],
  ['이에요?', '예요?', ''], ['일까요', '일까요', 'might it be?'], ['이니까', '니까', 'since it is'], ['이면', '면', 'if it is'], ['이요', '요', 'polite (just the noun)'],
];
// ---------- particles ----------
const PART = [
  ['은', '는', 'topic: as for… (은/는)'], ['이', '가', 'subject (이/가)'], ['을', '를', 'object (을/를)'], ['과', '와', 'and / with (과/와)'],
  ['이랑', '랑', 'and / with (casual)'], ['으로', '로', 'to / by means of (으로/로)'], ['이나', '나', 'or / about'], ['이라도', '라도', 'even just'],
  ['에', '에', 'to / at / in (에)'], ['에서', '에서', 'at / in / from (에서)'], ['에게', '에게', 'to (a person)'], ['한테', '한테', 'to (a person)'], ['께', '께', 'to (honorific)'],
  ['의', '의', '’s (possessive)'], ['도', '도', 'also / too (도)'], ['만', '만', 'only (만)'], ['하고', '하고', 'and / with (하고)'], ['까지', '까지', 'until / up to'],
  ['부터', '부터', 'from / starting'], ['보다', '보다', 'than'], ['처럼', '처럼', 'like'], ['마다', '마다', 'every'], ['밖에', '밖에', 'nothing but'], ['쯤', '쯤', 'about / around'],
  ['씩', '씩', 'each'], ['께서', '께서', 'subject (honorific)'], ['에는', '에는', 'at/in (topic)'], ['에서는', '에서는', 'at/in (topic)'], ['에도', '에도', 'at/in also'],
  ['에서도', '에서도', 'at/in also'], ['한테서', '한테서', 'from (a person)'], ['에게서', '에게서', 'from (a person)'], ['만큼', '만큼', 'as much as'], ['같이', '같이', 'like'],
  ['이요', '요', 'polite (just the noun)'], ['으로는', '로는', 'by / as for'], ['으로도', '로도', 'by … too'], ['까지는', '까지는', 'until (topic)'], ['만은', '만은', 'only (topic)'],
  ['은요', '는요', 'what about…?'], ['도요', '도요', '…too (polite)'], ['에요', '에요', 'to/at (polite)'], ['에서요', '에서요', 'at/from (polite)'], ['이랑은', '랑은', 'with (topic)'],
];
function nounForms(n) {
  const fin = isSyllable(last(n)) ? finalOf(n) : 'x';
  const cons = !!fin && fin !== 'x';
  const out = [];
  for (const [c, v, en] of PART) {
    const p = c === '으로' || c === '으로는' || c === '으로도' ? (cons && fin !== 'ㄹ' ? c : v) : cons ? c : v;
    out.push([n + p, { ko: p, en }]);
    out.push([n + '들' + p, { ko: '들 + ' + p, en: 'plural + ' + en }]);
  }
  for (const [c, v, en] of COPULA) { const p = cons ? c : v; out.push([n + p, { ko: p, en }]); }
  out.push([n + '들', { ko: '들', en: 'plural' }]);
  return out;
}

// ---------- lexicon ----------
let index = null;
let lexRef = null;
const clean = (w) => w.replace(/^[^가-힣0-9]+|[^가-힣0-9?]+$/g, '').replace(/\?$/, '');

function guessPos(ko, en) {
  if (!ko.endsWith('다') || ko.length < 2) return 'n';
  if (/(있|없)다$/.test(ko)) return 'v';
  if (/^(to be|be)\b/i.test(en) || /^(is |am |are )/i.test(en)) return 'a';
  if (/^to /i.test(en)) return 'v';
  return 'a';
}

// entries: [{ ko, en, pos }]; expressions: [{ ko: '어서 오세요', en }]
export function buildIndex(entries, expressions = []) {
  const map = new Map();
  const put = (form, rec) => {
    if (!form) return;
    const a = map.get(form);
    if (!a) map.set(form, [rec]);
    else if (!a.some((x) => x.lemma === rec.lemma && x.parts.length === rec.parts.length)) a.push(rec);
  };
  for (const raw of entries) {
    const e = { ...raw, ko: raw.ko.replace(/#.*$/, '') };
    const pos = e.pos || guessPos(e.ko, e.en);
    const base = { lemma: e.ko, en: e.en, pos };
    put(e.ko, { ...base, parts: [] });
    for (const s of e.forms || []) put(s, { ...base, parts: [] });
    if (pos === 'v' || pos === 'a') {
      for (const [form, part] of conjugate(e.ko, pos)) put(form.split(' ')[0], { ...base, parts: [part] });
    } else if (pos === 'n' || pos === 'pron' || pos === 'num') {
      for (const [form, part] of nounForms(e.ko)) put(form, { ...base, parts: [part] });
    } else if (pos === 'adv') {
      for (const p of ['도', '요', '은', '는', '만']) put(e.ko + p, { ...base, parts: [{ ko: p, en: p === '요' ? 'polite' : p === '도' ? 'also' : p === '만' ? 'only' : 'topic' }] });
    }
  }
  const exprs = expressions.map((x) => ({ ...x, words: x.ko.replace(/[.?!,…~]/g, '').split(/\s+/).filter(Boolean) })).filter((x) => x.words.length > 1);
  index = { map, exprs };
  return index;
}

export function lexiconReady() { return !!index; }
export function setLexiconSource(fn) { lexRef = fn; }
function ensure() { if (!index && lexRef) { const { entries, expressions } = lexRef(); buildIndex(entries, expressions); } return index; }

// Analyse one written word (어절). Returns { surface, lemma, en, pos, parts } or null.
export function analyzeWord(word) {
  const ix = ensure();
  if (!ix) return null;
  const w = clean(word);
  if (!w) return null;
  const hit = ix.map.get(w) || ix.map.get(w.replace(/[?]/g, ''));
  if (hit) return pickBest(w, hit);
  // number + counter: 3000원, 2시
  const num = /^(\d[\d,+]*)([가-힣]*)$/.exec(w);
  if (num) {
    const ctr = num[2] ? analyzeWord(num[2]) : null;
    return { surface: w, lemma: num[1], en: `${num[1]}${ctr ? ` + ${ctr.lemma} (${ctr.en})` : ''}`, pos: 'num', parts: ctr ? [{ ko: ctr.lemma, en: ctr.en }, ...ctr.parts] : [] };
  }
  // compound guess: longest known prefix + known rest (e.g. 감기약 = 감기 + 약)
  for (let i = w.length - 1; i >= 1; i--) {
    const a = ix.map.get(w.slice(0, i)), b = ix.map.get(w.slice(i));
    if (a && b) {
      const A = pickBest(w.slice(0, i), a), B = pickBest(w.slice(i), b);
      return { surface: w, lemma: w, en: `${A.en} + ${B.en}`, pos: 'n', parts: [{ ko: A.lemma, en: A.en }, { ko: B.lemma, en: B.en }, ...B.parts], guess: true };
    }
  }
  return null;
}
function pickBest(w, list) {
  // Prefer the whole-word entry, then the analysis with the fewest pieces.
  // Ties (사세요: 사다 + -세요 or 사 'four' + 세요) go to verbs, then nouns, then numbers.
  const rank = (x) => ({ v: 0, a: 0, x: 0, adv: 1, n: 2, pron: 2, det: 3, num: 4 }[x.pos] ?? 2);
  const sorted = list.slice().sort((a, b) => a.parts.length - b.parts.length || rank(a) - rank(b));
  return { surface: w, ...sorted[0], alt: sorted.slice(1, 3) };
}

// Splits text into words with offsets: [{ text, start, end }] (Korean-containing words only).
export function words(text) {
  const out = [];
  const re = /[^\s.,!?…~"“”'‘’()「」『』:;·—–-]+/g;
  let m;
  while ((m = re.exec(text))) if (/[가-힣]/.test(m[0])) out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  return out;
}

// Multi-word expressions in a sentence that contain the word at [start, end).
export function expressionAt(text, start) {
  const ix = ensure();
  if (!ix) return null;
  const ws = words(text);
  const k = ws.findIndex((w) => start >= w.start && start < w.end);
  if (k < 0) return null;
  let best = null;
  for (const x of ix.exprs) {
    const n = x.words.length;
    for (let i = Math.max(0, k - n + 1); i <= k && i + n <= ws.length; i++) {
      if (x.words.every((xw, j) => clean(ws[i + j].text) === xw) && (!best || n > best.n)) best = { ko: x.ko, en: x.en, n, start: ws[i].start, end: ws[i + n - 1].end };
    }
  }
  return best;
}
