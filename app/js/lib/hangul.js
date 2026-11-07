// Hangul utilities: decomposition, pronunciation rules, romanization, speech similarity.
// Pure module (no DOM) so it can be tested in node.

const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('');
const V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('');
const T = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split('')];
const BASE = 0xac00;

export const isSyllable = (c) => { const n = c.charCodeAt(0); return n >= BASE && n <= 0xd7a3; };
export const hasHangul = (s) => /[가-힣ㄱ-ㆎ]/.test(s);

export function decompose(ch) {
  const n = ch.charCodeAt(0) - BASE;
  return { l: L[Math.floor(n / 588)], v: V[Math.floor((n % 588) / 28)], t: T[n % 28] };
}
export function compose({ l, v, t = '' }) {
  return String.fromCharCode(BASE + (L.indexOf(l) * 21 + V.indexOf(v)) * 28 + T.indexOf(t));
}
export const syllables = (s) => [...s].filter(isSyllable);

// ---- Pronunciation (approximate 표준 발음) ----
const H_FINAL = { 'ㅎ': '', 'ㄶ': 'ㄴ', 'ㅀ': 'ㄹ' };
const ASPIRATE = { 'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅈ': 'ㅊ', 'ㅂ': 'ㅍ' };
const ASP_BEFORE_H = { 'ㄱ': 'ㅋ', 'ㄲ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅅ': 'ㅌ', 'ㅆ': 'ㅌ', 'ㅈ': 'ㅊ', 'ㅊ': 'ㅊ', 'ㅂ': 'ㅍ', 'ㄺ': ['ㄹ', 'ㅋ'], 'ㄼ': ['ㄹ', 'ㅍ'], 'ㄵ': ['ㄴ', 'ㅊ'] };
const SPLIT = { 'ㄳ': ['ㄱ', 'ㅆ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅆ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅄ': ['ㅂ', 'ㅆ'] };
const NEUTRAL = {
  'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄳ': 'ㄱ', 'ㄺ': 'ㄱ',
  'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
  'ㅍ': 'ㅂ', 'ㅄ': 'ㅂ', 'ㄿ': 'ㅂ', 'ㄻ': 'ㅁ',
  'ㄼ': 'ㄹ', 'ㄽ': 'ㄹ', 'ㄾ': 'ㄹ', 'ㅀ': 'ㄹ', 'ㄵ': 'ㄴ', 'ㄶ': 'ㄴ',
};
const TENSE = { 'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ' };

function applyPair(a, b, tense) {
  let t = a.t, l = b.l;
  if (t in H_FINAL) {
    if ('ㄱㄷㅈ'.includes(l)) { b.l = ASPIRATE[l]; a.t = H_FINAL[t]; return; }
    if (l === 'ㅅ') { b.l = 'ㅆ'; a.t = H_FINAL[t]; return; }
    if (l === 'ㄴ') { if (t === 'ㅀ') b.l = 'ㄹ'; a.t = t === 'ㅎ' ? 'ㄴ' : H_FINAL[t]; return; }
    if (l === 'ㅇ') { a.t = H_FINAL[t]; t = a.t; }
  }
  if (l === 'ㅎ' && ASP_BEFORE_H[t]) {
    const asp = ASP_BEFORE_H[t];
    if (Array.isArray(asp)) { a.t = asp[0]; b.l = asp[1]; } else { a.t = ''; b.l = asp; }
    if (t === 'ㄷ' && b.v === 'ㅣ') b.l = 'ㅊ';
    return;
  }
  if (l === 'ㅇ' && a.t && a.t !== 'ㅇ') {
    let moved;
    if (SPLIT[a.t]) { moved = SPLIT[a.t][1]; a.t = SPLIT[a.t][0]; } else { moved = a.t; a.t = ''; }
    if (b.v === 'ㅣ' && moved === 'ㄷ') moved = 'ㅈ';
    if (b.v === 'ㅣ' && moved === 'ㅌ') moved = 'ㅊ';
    b.l = moved;
    return;
  }
  a.t = NEUTRAL[a.t] ?? a.t;
  t = a.t;
  if (l === 'ㄹ' && t && t !== 'ㄹ' && t !== 'ㄴ') { b.l = 'ㄴ'; l = 'ㄴ'; }
  if (l === 'ㄴ' || l === 'ㅁ') {
    if (t === 'ㄱ') a.t = 'ㅇ'; else if (t === 'ㄷ') a.t = 'ㄴ'; else if (t === 'ㅂ') a.t = 'ㅁ';
  }
  if (t === 'ㄴ' && l === 'ㄹ') a.t = 'ㄹ';
  else if (t === 'ㄹ' && l === 'ㄴ') b.l = 'ㄹ';
  if (tense && a.t && 'ㄱㄷㅂ'.includes(a.t) && TENSE[b.l]) b.l = TENSE[b.l];
}

// Returns an array of tokens: {l,v,t} for syllables, {raw} for anything else.
function pronTokens(text, tense) {
  const toks = [...text].map((c) => (isSyllable(c) ? decompose(c) : { raw: c }));
  for (let i = 0; i < toks.length - 1; i++) {
    const a = toks[i], b = toks[i + 1];
    if (a.raw === undefined && b.raw === undefined) applyPair(a, b, tense);
  }
  for (const tk of toks) if (tk.raw === undefined && tk.t) tk.t = NEUTRAL[tk.t] ?? tk.t;
  return toks;
}

export function pronounce(text, { tense = true } = {}) {
  return pronTokens(text, tense)
    .map((tk) => (tk.raw !== undefined ? tk.raw : compose(tk.v === 'ㅢ' && tk.l !== 'ㅇ' ? { ...tk, v: 'ㅣ' } : tk)))
    .join('');
}

// ---- Romanization (Revised Romanization of the pronounced form, hyphenated per syllable) ----
const RR_L = { 'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm', 'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '', 'ㅈ': 'j', 'ㅉ': 'jj', 'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h' };
const RR_V = { 'ㅏ': 'a', 'ㅐ': 'ae', 'ㅑ': 'ya', 'ㅒ': 'yae', 'ㅓ': 'eo', 'ㅔ': 'e', 'ㅕ': 'yeo', 'ㅖ': 'ye', 'ㅗ': 'o', 'ㅘ': 'wa', 'ㅙ': 'wae', 'ㅚ': 'oe', 'ㅛ': 'yo', 'ㅜ': 'u', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅢ': 'ui', 'ㅣ': 'i' };
const RR_T = { 'ㄱ': 'k', 'ㄴ': 'n', 'ㄷ': 't', 'ㄹ': 'l', 'ㅁ': 'm', 'ㅂ': 'p', 'ㅇ': 'ng' };

export function romanize(text, { pron } = {}) {
  const toks = pronTokens(pron || text, false);
  let out = '', prevSyl = null;
  for (const tk of toks) {
    if (tk.raw !== undefined) { out += tk.raw; prevSyl = null; continue; }
    let init = RR_L[tk.l];
    if (tk.l === 'ㄹ' && prevSyl && prevSyl.t === 'ㄹ') init = 'l';
    if (prevSyl) out += '-';
    out += init + RR_V[tk.v] + (RR_T[tk.t] ?? '');
    prevSyl = tk;
  }
  return out;
}

// ---- Numbers (used to normalise speech-recognition output such as "3000원") ----
const SINO = '일이삼사오육칠팔구';
export function sinoNumber(n) {
  if (n === 0) return '영';
  const units = ['', '십', '백', '천'], bigs = ['', '만', '억', '조'];
  let out = '', g = 0;
  while (n > 0) {
    const grp = n % 10000;
    if (grp) {
      let s = '';
      [...String(grp).padStart(4, '0')].forEach((d, i) => {
        const dv = +d, pos = 3 - i;
        if (dv) s += (dv === 1 && pos > 0 ? '' : SINO[dv - 1]) + units[pos];
      });
      if (g === 1 && grp === 1) s = '';
      out = s + bigs[g] + out;
    }
    n = Math.floor(n / 10000); g++;
  }
  return out;
}
export function nativeNumber(n) {
  if (n < 1 || n > 99) return sinoNumber(n);
  const tens = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
  const ones = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
  if (n === 20) return '스무';
  return tens[Math.floor(n / 10)] + ones[n % 10];
}

// ---- Similarity for speaking practice ----
const clean = (s) => s.replace(/[^가-힣0-9a-zA-Z]/g, '');
function jamo(s) {
  const out = [];
  for (const c of s) { if (isSyllable(c)) { const d = decompose(c); out.push(d.l, d.v); if (d.t) out.push(d.t); } else out.push(c); }
  return out;
}
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function numberVariants(s) {
  if (!/\d/.test(s)) return [s];
  const noComma = s.replace(/(\d),(\d)/g, '$1$2');
  return [
    noComma.replace(/\d+/g, (d) => sinoNumber(+d)),
    noComma.replace(/\d+/g, (d) => nativeNumber(+d)),
  ];
}
// 0..1, compares pronounced jamo so spelling differences that sound alike still match.
export function similarity(target, heard) {
  const t = jamo(pronounce(clean(target)));
  let best = 0;
  for (const v of numberVariants(heard)) {
    const hj = jamo(pronounce(clean(v)));
    const s = 1 - lev(t, hj) / Math.max(t.length, hj.length, 1);
    if (s > best) best = s;
  }
  return Math.max(0, best);
}
// Marks each target syllable as heard or missed (LCS alignment on syllables).
export function alignSyllables(target, heard) {
  const ts = [...target], hs = [...clean(numberVariants(heard)[0])];
  const tIdx = ts.map((c, i) => [c, i]).filter(([c]) => isSyllable(c));
  const m = tIdx.length, n = hs.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
    dp[i][j] = tIdx[i][0] === hs[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Set();
  for (let i = 0, j = 0; i < m && j < n;) {
    if (tIdx[i][0] === hs[j]) { ok.add(tIdx[i][1]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  return ts.map((c, i) => ({ ch: c, ok: !isSyllable(c) || ok.has(i) }));
}

// Look-alike syllables used as distractor tiles in spelling exercises.
const NEAR_L = { 'ㄱ': 'ㅋㄲ', 'ㅋ': 'ㄱㄲ', 'ㄲ': 'ㄱㅋ', 'ㄷ': 'ㅌㄸ', 'ㅌ': 'ㄷㄸ', 'ㄸ': 'ㄷㅌ', 'ㅂ': 'ㅍㅃ', 'ㅍ': 'ㅂㅃ', 'ㅃ': 'ㅂㅍ', 'ㅈ': 'ㅊㅉ', 'ㅊ': 'ㅈㅉ', 'ㅉ': 'ㅈㅊ', 'ㅅ': 'ㅆㅈ', 'ㅆ': 'ㅅ', 'ㄴ': 'ㄹㅁ', 'ㄹ': 'ㄴ', 'ㅁ': 'ㄴㅂ', 'ㅇ': 'ㅎ', 'ㅎ': 'ㅇ' };
const NEAR_V = { 'ㅏ': 'ㅓㅑ', 'ㅓ': 'ㅏㅗ', 'ㅗ': 'ㅜㅓ', 'ㅜ': 'ㅗㅡ', 'ㅡ': 'ㅜㅣ', 'ㅣ': 'ㅡㅢ', 'ㅐ': 'ㅔㅒ', 'ㅔ': 'ㅐㅖ', 'ㅑ': 'ㅏㅕ', 'ㅕ': 'ㅓㅑ', 'ㅛ': 'ㅗㅠ', 'ㅠ': 'ㅜㅛ', 'ㅘ': 'ㅝㅗ', 'ㅝ': 'ㅘㅜ', 'ㅚ': 'ㅙㅞ', 'ㅟ': 'ㅢㅜ', 'ㅢ': 'ㅟㅣ', 'ㅙ': 'ㅞㅚ', 'ㅞ': 'ㅙㅚ', 'ㅒ': 'ㅖㅐ', 'ㅖ': 'ㅒㅔ' };
export function nearSyllables(ch) {
  if (!isSyllable(ch)) return [];
  const d = decompose(ch), out = [];
  for (const l of NEAR_L[d.l] || '') out.push(compose({ ...d, l }));
  for (const v of NEAR_V[d.v] || '') out.push(compose({ ...d, v }));
  return out.filter((c) => c !== ch);
}
