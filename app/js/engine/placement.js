// Computerised adaptive placement test.
// Model: 3-parameter logistic IRT with fixed discrimination; ability estimated by EAP on a grid.
// Items are chosen for maximum information at the current estimate, rotating skills for balance.
// "I don't know" counts as wrong but avoids guessing noise, which sharpens the estimate.
import { BANK } from '../../content/placement-bank.js';
import { courseChapters } from '../../content/index.js';

const A = 1.4;
const GRID = Array.from({ length: 91 }, (_, i) => -4.5 + i * 0.1);
const ROTATION = ['vocab', 'grammar', 'reading', 'listening'];

const guess = (it) => 0.8 / it.options.length;
export function prob(theta, it) { const c = guess(it); return c + (1 - c) / (1 + Math.exp(-A * (theta - it.b))); }
function info(theta, it) {
  const c = guess(it), p = prob(theta, it), q = 1 - p;
  return A * A * (q / p) * ((p - c) / (1 - c)) ** 2;
}

export function eap(responses, mu, sd) {
  const w = GRID.map((t) => {
    let l = Math.exp(-0.5 * ((t - mu) / sd) ** 2);
    for (const { item, correct } of responses) { const p = prob(t, item); l *= correct ? p : 1 - p; }
    return l;
  });
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  const mean = GRID.reduce((s, t, i) => s + t * w[i], 0) / sum;
  const v = GRID.reduce((s, t, i) => s + (t - mean) ** 2 * w[i], 0) / sum;
  return { theta: mean, se: Math.sqrt(v) };
}

export const SELF = {
  none: { mu: -3.2, label: 'I’ve never studied Korean', sub: 'Not even the alphabet yet' },
  hangul: { mu: -2.3, label: 'I can read Hangul and know a few words', sub: 'Greetings, a little food vocabulary' },
  basic: { mu: -1.2, label: 'I can manage simple everyday situations', sub: 'Ordering, prices, directions, short chats' },
  conversation: { mu: 0.2, label: 'I can hold everyday conversations', sub: 'Talk about my life, plans and opinions' },
  advanced: { mu: 1.8, label: 'I’m comfortable with news and complex topics', sub: 'Work, society, abstract ideas' },
};

export class Placement {
  constructor(selfKey) {
    this.self = SELF[selfKey] || SELF.hangul;
    this.mu = this.self.mu;
    this.sd = 1.2;
    this.responses = [];
    this.used = new Set();
    this.rot = 0;
    this.hangulQueue = BANK.filter((b) => b.skill === 'hangul').sort(() => Math.random() - 0.5).slice(0, selfKey === 'none' ? 5 : 2);
    this.hangulRight = 0;
    this.hangulDone = 0;
    this.stoppedForHangul = false;
  }
  get main() { return this.responses.filter((r) => r.item.skill !== 'hangul'); }
  estimate() { return eap(this.responses, this.mu, this.sd); }

  next() {
    if (this.hangulQueue.length) return this.take(this.hangulQueue.shift());
    if (this.done()) return null;
    const { theta } = this.estimate();
    const pool = BANK.filter((b) => b.skill !== 'hangul' && !this.used.has(b.id));
    let skill = ROTATION[this.rot++ % ROTATION.length];
    let cand = pool.filter((b) => b.skill === skill);
    if (!cand.length) cand = pool;
    if (!cand.length) return null;
    const ranked = cand.map((b) => [b, info(theta, b)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return this.take(ranked[Math.floor(Math.random() * ranked.length)][0]);
  }
  take(it) { this.used.add(it.id); this.current = it; return it; }

  answer(it, correct) {
    this.responses.push({ item: it, correct });
    if (it.skill === 'hangul') {
      this.hangulDone++;
      if (correct) this.hangulRight++;
      // Absolute beginners: stop early if Hangul isn't readable yet.
      if (this.self === SELF.none && this.hangulDone >= 3 && this.hangulRight <= this.hangulDone - 2) { this.hangulQueue = []; this.stoppedForHangul = true; }
      if (this.self === SELF.none && !this.hangulQueue.length && this.hangulRight >= 4) this.mu = -2.3;
    }
  }

  done() {
    if (this.stoppedForHangul) return true;
    if (this.hangulQueue.length) return false;
    const n = this.main.length;
    const { theta, se } = this.estimate();
    if (n >= 26) return true;
    if (n >= 14 && se < 0.36) return true;
    if (n >= 8 && theta < -2.6 && se < 0.5) return true;
    return false;
  }

  progress() { return Math.min(0.97, this.main.length / Math.max(14, Math.min(26, this.main.length + 6))); }

  result() {
    const { theta, se } = this.stoppedForHangul ? { theta: Math.min(-3.0, this.estimate().theta), se: 0.4 } : this.estimate();
    const skills = {};
    for (const s of [...ROTATION, 'hangul']) {
      const rs = this.responses.filter((r) => r.item.skill === s);
      if (rs.length) skills[s] = eap(rs, theta, 0.7).theta;
    }
    const hangulOk = !this.stoppedForHangul && theta > -2.9;
    const list = courseChapters();
    // A chapter counts as known when P(know) >= 0.75, i.e. its b is at least 0.78 below theta.
    const known = list.filter((c) => (c.id === 'h0' ? hangulOk && this.hangulRight >= Math.ceil(this.hangulDone * 0.6) : c.b <= theta - 0.78));
    const firstUnknown = list.find((c) => !known.includes(c)) || list[list.length - 1];
    const testedOut = list.slice(0, list.indexOf(firstUnknown)).map((c) => c.id);
    return { theta, se, skills, startChapter: firstUnknown.id, testedOut, beyondCourse: !list.some((c) => !known.includes(c)), n: this.responses.length, at: Date.now() };
  }
}
