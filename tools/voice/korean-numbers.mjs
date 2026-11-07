// Digits -> how a Korean speaker reads them, for the TTS engine only (the clip is still keyed by the shown text).
// Native numbers before native counters (7시 → 일곱 시, 3개 → 세 개), Sino-Korean everywhere else
// (3번 출구 → 삼 번, 5,000원 → 오천 원, 3월 5일 → 삼월 오일). Covers what the course uses; extend as needed.
const D = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
function sino4(n) {
  let s = '';
  for (const [u, name] of [[1000, '천'], [100, '백'], [10, '십']]) {
    const d = Math.floor(n / u) % 10;
    if (d) s += (d === 1 ? '' : D[d]) + name;
  }
  return s + D[n % 10];
}
export function sino(n) {
  if (n === 0) return '영';
  const hi = Math.floor(n / 10000), lo = n % 10000;
  return (hi ? (hi === 1 ? '' : sino4(hi)) + '만' + (lo ? ' ' : '') : '') + (lo ? sino4(lo) : '');
}
const ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
export function native(n) {
  if (n <= 0 || n >= 100) return sino(n);
  const t = Math.floor(n / 10), o = n % 10;
  return t === 2 && !o ? '스무' : TENS[t] + ONES[o];
}
const NATIVE = new Set(['시', '시간', '개', '명', '살', '마리', '잔', '병', '권', '장', '달', '그릇', '켤레', '대']);
const COUNTER = /(\d[\d,]*)\s*(시간|시|개|명|살|마리|잔|병|권|장|달|그릇|켤레|대|번|분|원|월|일|호선|층|년|주|초|인분)?/g;

export function readable(text) {
  let t = String(text);
  // Teaching cards like "3:00 → 세 시": say the Korean side only.
  const card = /^\s*[\d:,]+\s*→\s*(.+)$/.exec(t);
  if (card) t = card[1];
  t = t.replace(/\s*→\s*/g, ', ');
  t = t.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => `${h}시${+m ? ` ${+m}분` : ''}`);
  return t.replace(COUNTER, (_, num, c = '') => {
    const n = Number(num.replace(/,/g, ''));
    if (c === '월') return `${n === 6 ? '유' : n === 10 ? '시' : sino(n)}월`;
    const word = NATIVE.has(c) ? native(n) : sino(n);
    return c ? `${word} ${c}` : word;
  });
}
