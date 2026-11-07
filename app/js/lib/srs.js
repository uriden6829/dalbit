// Spaced repetition: SM-2 style ease/interval on "study day" indices (day rolls over at 4am local).
// Pure module. A record lives in state.progress[itemId].

const DAY = 86400000;
export function dayIndex(ts = Date.now()) {
  const local = ts - new Date(ts).getTimezoneOffset() * 60000 - 4 * 3600000;
  return Math.floor(local / DAY);
}
export const today = () => dayIndex();
export const dayKey = (ts = Date.now()) => {
  const d = new Date(ts - 4 * 3600000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const newRecord = () => ({ st: 'new', step: 0, ivl: 0, ease: 2.5, due: 0, reps: 0, lapses: 0, ok: 0, bad: 0, last: 0 });

export const isDue = (r, d = today()) => r && r.st === 'review' && r.due <= d;
export const isLearned = (r) => !!r && r.st === 'review';

// Called when an item finishes its in-session learning ladder.
export function graduate(r, mistakes = 0, d = today()) {
  r.st = 'review';
  r.step = 0;
  r.ease = Math.max(1.4, 2.5 - 0.15 * mistakes);
  r.ivl = 1;
  r.due = d + 1;
  r.reps++;
  return r;
}

// q: 0 again, 1 hard, 2 good, 3 easy
export function review(r, q, d = today()) {
  const late = Math.max(0, d - r.due);
  r.reps++;
  if (q === 0) {
    r.lapses++;
    r.ease = Math.max(1.3, r.ease - 0.2);
    r.ivl = Math.max(1, Math.round(r.ivl * 0.3));
    r.due = d + 1;
    return r;
  }
  const base = r.ivl + late / 2;
  let ivl;
  if (q === 1) { ivl = base * 1.2; r.ease = Math.max(1.3, r.ease - 0.15); }
  else if (q === 2) ivl = base * r.ease;
  else { ivl = base * r.ease * 1.3; r.ease = Math.min(3.0, r.ease + 0.15); }
  ivl = Math.max(r.ivl + 1, Math.round(ivl * (0.95 + Math.random() * 0.1)));
  r.ivl = Math.min(ivl, 365);
  r.due = d + r.ivl;
  return r;
}

// Seed an item the placement test says she already knows: verify it soon, spread over days.
export function seedKnown(r, spreadDays, d = today()) {
  r.st = 'review';
  r.ivl = 3;
  r.ease = 2.5;
  r.due = d + 1 + Math.floor(Math.random() * spreadDays);
  r.src = 'placed';
  return r;
}

// A wrong answer during free practice pulls the item forward.
export function nudge(r, d = today()) {
  if (r.st === 'review' && r.due > d + 1) { r.due = d + 1; r.ivl = Math.max(1, Math.round(r.ivl / 2)); }
}

// 0 new, 1 learning, 2 young (<4d), 3 maturing (<21d), 4 mastered
export function mastery(r) {
  if (!r || r.st === 'new') return 0;
  if (r.st !== 'review') return 1;
  if (r.ivl < 4) return 2;
  if (r.ivl < 21) return 3;
  return 4;
}

// Estimated probability of recall now (0.9 on the due date).
export function retrievability(r, d = today()) {
  if (!r || r.st !== 'review') return 0;
  const elapsed = d - (r.due - r.ivl);
  return Math.exp((Math.log(0.9) * elapsed) / Math.max(1, r.ivl));
}

export function gradeFrom({ correct, hinted, ms }) {
  if (!correct) return 0;
  if (hinted || ms > 15000) return 1;
  if (ms < 3500) return 3;
  return 2;
}
