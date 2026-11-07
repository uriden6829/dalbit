// Course registry. To add a chapter: create chapters/cNN-name.js and add it to COURSE in order.
import h0 from './chapters/h0-hangul.js';
import c01 from './chapters/c01-greetings.js';
import c02 from './chapters/c02-cafe.js';
import c03 from './chapters/c03-numbers.js';
import c04 from './chapters/c04-getting-around.js';
import c05 from './chapters/c05-restaurant.js';
import c06 from './chapters/c06-family.js';
import c07 from './chapters/c07-plans.js';
import c08 from './chapters/c08-market.js';
import c09 from './chapters/c09-weather.js';
import c10 from './chapters/c10-health.js';
import c11 from './chapters/c11-past.js';
import c12 from './chapters/c12-phone.js';

export const COURSE = [h0, c01, c02, c03, c04, c05, c06, c07, c08, c09, c10, c11, c12];

const PREFIX = { letter: 'h', word: 'w', phrase: 'p' };
export const itemId = (it) => (it.kind === 'gram' ? it.key : `${PREFIX[it.kind]}:${it.key}`);

export const items = new Map();
export const lessons = new Map();
export const episodes = new Map();
export const chapters = [];
export const problems = [];

function addChapter(ch, { extra = false } = {}) {
  const c = { ...ch, n: chapters.length, lessons: [], extra };
  ch.lessons.forEach((ls, li) => {
    const ids = [];
    for (const it of ls.items) {
      const id = itemId(it);
      if (items.has(id)) {
        if (!extra) problems.push(`Duplicate item ${id} in ${ls.id}`);
        ids.push(id);
        continue;
      }
      items.set(id, { ...it, id, chapter: ch.id, lesson: ls.id, b: (ch.b ?? 0) + li * 0.1 });
      ids.push(id);
    }
    const L = { ...ls, items: ids, chapter: ch.id, n: li };
    c.lessons.push(L);
    lessons.set(ls.id, L);
  });
  if (ch.episode) {
    episodes.set(ch.episode.id, { ...ch.episode, chapter: ch.id });
    c.episode = ch.episode.id;
  }
  chapters.push(c);
  return c;
}
COURSE.forEach((ch) => addChapter(ch));
export const courseChapters = () => chapters.filter((c) => !c.extra);

// AI-made packs (already validated) are registered as extra chapters, outside the main path.
export function registerPack(pack) {
  if (chapters.some((c) => c.id === pack.id)) return;
  addChapter(pack, { extra: true });
}

export function unregisterPack(id) {
  const i = chapters.findIndex((c) => c.id === id && c.extra);
  if (i < 0) return;
  const ch = chapters[i];
  for (const L of ch.lessons) { lessons.delete(L.id); for (const itemId of L.items) if (items.get(itemId)?.chapter === id) items.delete(itemId); }
  if (ch.episode) episodes.delete(ch.episode);
  chapters.splice(i, 1);
}

export const chapterOf = (id) => chapters.find((c) => c.id === id);
export const chapterItems = (ch) => ch.lessons.flatMap((l) => l.items);
export const getItem = (id) => items.get(id);
