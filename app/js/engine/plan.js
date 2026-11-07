// Decides what to study: chapter unlocking, next step, daily plan, and session assembly.
import { chapters, courseChapters, lessons, items, episodes, chapterItems, chapterOf } from '../../content/index.js';
import { isLearned, isDue, mastery, retrievability, today, dayKey } from '../lib/srs.js';
import { makeMatch, makeQuiz } from './exercises.js';
import { shuffle, sample } from '../lib/rand.js';

export function lessonStats(state, L) {
  const recs = L.items.map((id) => state.progress[id]);
  const learned = recs.filter(isLearned).length;
  const avg = recs.reduce((s, r) => s + mastery(r), 0) / Math.max(1, recs.length);
  return { total: L.items.length, learned, done: learned === L.items.length, avg, moon: Math.min(4, Math.floor(avg + 0.25)) };
}

export function chapterState(state, ch) { return state.chapters[ch.id] || {}; }
export const chapterCleared = (state, ch) => { const c = chapterState(state, ch); return !!(c.passed || c.testedOut); };

export function chapterUnlocked(state, ch) {
  if (ch.extra) return true;
  const list = courseChapters();
  const i = list.indexOf(ch);
  if (i <= 0) return true;
  if (chapterCleared(state, ch)) return true;
  const start = state.placement?.startChapter;
  if (start && list.findIndex((c) => c.id === start) >= i) return true;
  return chapterCleared(state, list[i - 1]);
}

export function chapterNodes(state, ch) {
  const cs = chapterState(state, ch);
  const nodes = ch.lessons.map((L) => ({ type: 'lesson', id: L.id, lesson: L, stats: lessonStats(state, L), done: lessonStats(state, L).done }));
  if (ch.episode) nodes.push({ type: 'story', id: ch.episode, done: !!state.stories[ch.episode]?.read });
  if (ch.reading) nodes.push({ type: 'reading', id: ch.id, done: !!state.stories[`read-${ch.id}`]?.read });
  nodes.push({ type: 'speak', id: `${ch.id}-speak`, done: !!cs.spoke });
  nodes.push({ type: 'exam', id: `${ch.id}-exam`, done: !!cs.passed, score: cs.exam });
  return nodes;
}

export function currentChapter(state) {
  const list = courseChapters();
  return list.find((c) => chapterUnlocked(state, c) && !chapterCleared(state, c)) || list[list.length - 1];
}

export function nextStep(state) {
  const ch = currentChapter(state);
  const nodes = chapterNodes(state, ch);
  // Story unlocks after the first lesson so new words appear in context early.
  const order = nodes.filter((n) => n.type === 'lesson').slice(0, 1)
    .concat(nodes.filter((n) => n.type === 'story'), nodes.filter((n) => n.type === 'lesson').slice(1), nodes.filter((n) => n.type === 'speak' || n.type === 'exam'));
  return { chapter: ch, node: order.find((n) => !n.done) || nodes[nodes.length - 1] };
}

export function dueIds(state, d = today()) {
  return Object.entries(state.progress)
    .filter(([id, r]) => items.has(id) && isDue(r, d))
    .sort((a, b) => a[1].due - b[1].due || retrievability(a[1], d) - retrievability(b[1], d))
    .map(([id]) => id);
}

export function learnedIds(state) {
  return Object.entries(state.progress).filter(([id, r]) => items.has(id) && isLearned(r)).map(([id]) => id);
}

function newItemsFor(state, ch, max) {
  const out = [];
  for (const L of ch.lessons) for (const id of L.items) {
    if (out.length >= max) return out;
    if (!isLearned(state.progress[id])) out.push(id);
  }
  return out;
}

export function learnedToday(state) { return state.log[dayKey()]?.new || 0; }

export function planDaily(state) {
  const budget = Math.round(state.settings.minutes * 4.5);
  const due = dueIds(state);
  const reviews = due.slice(0, Math.max(10, Math.floor(budget / 1.3)));
  const left = budget - reviews.length * 1.3;
  const allowance = Math.max(0, state.settings.newPerDay - learnedToday(state));
  const nNew = Math.max(0, Math.min(allowance, Math.floor(left / 5.5)));
  const ch = currentChapter(state);
  const newIds = nNew ? newItemsFor(state, ch, nNew) : [];
  return { reviews, newIds, dueTotal: due.length, chapter: ch, minutes: Math.round((reviews.length * 1.3 + newIds.length * 5.5) / 4.5) };
}

// ----- Session assembly: returns constructor options for Session -----
export function dailySession(state) {
  const p = planDaily(state);
  const entries = [...p.reviews.map((id) => ({ id, mode: 'review' })), ...p.newIds.map((id) => ({ id, mode: 'new' }))];
  const match = makeMatch(p.newIds.length >= 4 ? p.newIds : shuffle([...p.newIds, ...p.reviews]).slice(0, 8));
  return { kind: 'daily', title: 'Tonight’s study', entries: shuffle(entries.filter((e) => e.mode === 'review')).concat(entries.filter((e) => e.mode === 'new')), midExtras: match ? [match] : [] };
}

export function lessonSession(state, lessonId) {
  const L = lessons.get(lessonId);
  const st = lessonStats(state, L);
  const deep = st.done;
  const entries = L.items.map((id) => {
    const r = state.progress[id];
    if (!isLearned(r)) return { id, mode: 'new' };
    return { id, mode: isDue(r) ? 'review' : 'practice', reps: deep ? 2 : 1 };
  });
  const match = makeMatch(L.items);
  return { kind: 'lesson', lessonId, title: deep ? `Deep practice · ${L.title.en}` : L.title.en, entries, midExtras: match ? [match] : [] };
}

export function reviewSession(state) {
  const due = dueIds(state).slice(0, 60);
  if (due.length) return { kind: 'review', title: 'Review', entries: due.map((id) => ({ id, mode: 'review' })) };
  const weakest = learnedIds(state).sort((a, b) => retrievability(state.progress[a]) - retrievability(state.progress[b])).slice(0, 15);
  return { kind: 'review', title: 'Extra practice', entries: weakest.map((id) => ({ id, mode: 'practice' })) };
}

// Items she keeps missing, practised twice each.
export function trickySession(state) {
  const score = (id) => state.progress[id].lapses + state.progress[id].bad * 0.3;
  const ids = learnedIds(state).filter((id) => { const r = state.progress[id]; return r.lapses > 0 || r.bad > r.ok * 0.4; })
    .sort((a, b) => score(b) - score(a)).slice(0, 15);
  return { kind: 'tricky', title: 'Tricky words', entries: ids.map((id) => ({ id, mode: isDue(state.progress[id]) ? 'review' : 'practice', reps: 2 })) };
}

export function recapAvailable(state) {
  const learned = learnedIds(state).length;
  if (learned < 15) return false;
  const days = (Date.now() - (state.recap.last || 0)) / 864e5;
  return state.recap.lessonsSince >= 3 || days >= 6;
}

// Moonlight Recap: older material with the lowest recall odds + questions from an earlier story.
export function recapSession(state) {
  const d = today();
  const old = learnedIds(state).filter((id) => {
    const r = state.progress[id];
    return r.ivl >= 2 || d - (r.due - r.ivl) >= 4;
  });
  const pool = (old.length >= 10 ? old : learnedIds(state))
    .sort((a, b) => retrievability(state.progress[a], d) - retrievability(state.progress[b], d)).slice(0, 22);
  const readEps = [...episodes.values()].filter((e) => state.stories[e.id]?.read && e.quiz?.length);
  const ep = readEps.length ? readEps.sort((a, b) => (state.stories[a.id].read || 0) - (state.stories[b.id].read || 0))[0] : null;
  const extras = ep ? sample(ep.quiz, Math.min(3, ep.quiz.length)).map((q) => makeQuiz(q, { recapStory: ep.id })) : [];
  const match = makeMatch(pool);
  return {
    kind: 'recap', title: 'Moonlight Recap', recapStory: ep?.id,
    entries: pool.map((id) => ({ id, mode: isDue(state.progress[id], d) ? 'review' : 'practice' })),
    midExtras: match ? [match] : [], extras,
  };
}

export function examSession(state, chapterId) {
  const ch = chapterOf(chapterId);
  const ids = sample(chapterItems(ch), 18);
  const ep = ch.episode && episodes.get(ch.episode);
  const qs = ep?.quiz ? sample(ep.quiz, Math.min(2, ep.quiz.length)).map((q) => makeQuiz(q, { examQuestion: true })) : [];
  return { kind: 'exam', chapterId, title: `${ch.title.en} · Exam`, entries: shuffle(ids).map((id) => ({ id, mode: 'exam' })), extras: qs };
}

export function speakingPool(state, chapterId) {
  const ch = chapterOf(chapterId);
  return chapterItems(ch).map((id) => items.get(id)).filter((it) => it.kind === 'phrase' || (it.kind === 'word' && it.ko.length >= 2));
}

export function streakInfo(state) {
  const days = Object.keys(state.log).filter((k) => state.log[k].ex > 0).sort();
  let streak = 0;
  const dt = new Date(Date.now() - 4 * 3600000);
  for (;;) {
    const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    if (state.log[k]?.ex > 0) { streak++; dt.setDate(dt.getDate() - 1); }
    else if (streak === 0 && k === dayKey()) { dt.setDate(dt.getDate() - 1); }
    else break;
  }
  return { streak, totalDays: days.length };
}

export { chapters, courseChapters, lessons, items, episodes };
