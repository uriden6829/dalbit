// Her word bank: words she picked from anywhere in the app (Ctrl+click, or the picker on Jiji's corner).
// Entries live in state.wordbank and use a small Leitner schedule for the flashcard practice.
import { getState, update } from './store.js';
import { emit } from './bus.js';

const DAY = 86400000;
const BOX_DAYS = [0, 1, 3, 7, 16, 35];

export const bankList = () => getState().wordbank || [];
export const inBank = (ko) => bankList().some((w) => w.ko === ko);

// a: analysis from morph.js (may be null for unknown words); ctx: the sentence it came from.
export function addToBank({ surface, a, ctx = '', ctxEn = '' }) {
  const ko = a?.lemma || surface;
  if (inBank(ko)) { emit('bank', { ko, dup: true }); return { ko, dup: true }; }
  const entry = { ko, en: a?.en || '', surface, parts: a?.parts?.map((p) => `${p.ko} ${p.en}`.trim()) || [], ctx: ctx.slice(0, 160), ctxEn: ctxEn.slice(0, 200), at: Date.now(), box: 0, due: 0 };
  update((s) => { (s.wordbank ||= []).unshift(entry); });
  emit('bank', { ko, added: true });
  return entry;
}
export function removeFromBank(ko) { update((s) => { s.wordbank = (s.wordbank || []).filter((w) => w.ko !== ko); }); emit('bank', { ko, removed: true }); }
export function editBank(ko, fields) { update((s) => { const w = (s.wordbank || []).find((x) => x.ko === ko); if (w) Object.assign(w, fields); }); }

export const dueCards = (now = Date.now()) => bankList().filter((w) => (w.due || 0) <= now);
export function gradeCard(ko, knew) {
  update((s) => {
    const w = (s.wordbank || []).find((x) => x.ko === ko);
    if (!w) return;
    w.box = knew ? Math.min(BOX_DAYS.length - 1, (w.box || 0) + 1) : 0;
    w.due = Date.now() + (knew ? BOX_DAYS[w.box] * DAY : 0) - 4 * 3600000;
    w.seen = (w.seen || 0) + 1;
  });
}
