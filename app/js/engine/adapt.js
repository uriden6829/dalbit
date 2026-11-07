// Running skill estimates (Elo-style on the same logit scale as the placement test).
export const SKILLS = ['hangul', 'vocab', 'grammar', 'reading', 'listening', 'speaking'];
export const SKILL_LABEL = { hangul: 'Hangul', vocab: 'Vocabulary', grammar: 'Grammar', reading: 'Reading', listening: 'Listening', speaking: 'Speaking' };

export function updateSkill(state, skill, b, correct, { guess = 0.25 } = {}) {
  if (!skill) return;
  const base = state.placement?.skills?.[skill] ?? state.placement?.theta ?? -2.5;
  const s = (state.skills[skill] ||= { theta: base, n: 0 });
  const p = guess + (1 - guess) / (1 + Math.exp(-1.4 * (s.theta - b)));
  const k = Math.max(0.04, 0.35 / Math.sqrt(1 + s.n / 8));
  s.theta = Math.max(-4.5, Math.min(4.5, s.theta + k * ((correct ? 1 : 0) - p)));
  s.n++;
}

// TOPIK-style bands on the logit scale.
const BANDS = [
  [-Infinity, -2.9, 0, 'Hangul learner'],
  [-2.9, -1.6, 1, 'Beginner (≈ TOPIK 1)'],
  [-1.6, -0.4, 2, 'High beginner (≈ TOPIK 2)'],
  [-0.4, 0.75, 3, 'Intermediate (≈ TOPIK 3)'],
  [0.75, 1.8, 4, 'Upper intermediate (≈ TOPIK 4)'],
  [1.8, 2.75, 5, 'Advanced (≈ TOPIK 5)'],
  [2.75, Infinity, 6, 'Advanced (≈ TOPIK 6)'],
];
export function levelOf(theta) {
  const [lo, hi, level, label] = BANDS.find(([a, b]) => theta >= a && theta < b);
  let sub = '';
  if (Number.isFinite(lo) && Number.isFinite(hi)) {
    const f = (theta - lo) / (hi - lo);
    sub = f < 0.34 ? 'early' : f < 0.67 ? 'middle' : 'late';
  }
  return { level, label, sub };
}

// Romanization appears on teaching cards until Hangul is solid.
export function showRoman(state) {
  const mode = state.settings.romanization;
  if (mode === 'always') return true;
  if (mode === 'never') return false;
  const h = state.chapters.h0;
  return !(h && (h.passed || h.testedOut));
}
