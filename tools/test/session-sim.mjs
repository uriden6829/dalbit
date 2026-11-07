// Simulates a lesson session with a learner who answers ~80% correctly; prints the exercise sequence.
import { lessons } from '../../app/content/index.js';
import { Session } from '../../app/js/engine/session.js';
import { defaultState } from '../../app/js/lib/store.js';

const lessonId = process.argv[2] || 'c01-l2';
const state = defaultState();
const L = lessons.get(lessonId);
const s = new Session(state, { kind: 'lesson', entries: L.items.map((id) => ({ id, mode: 'new' })), speaking: true });
let ex, n = 0;
const seq = [];
while ((ex = s.next()) && n < 400) {
  n++;
  const ok = ex.type === 'intro' || Math.random() < 0.8;
  seq.push(`${ex.type === 'intro' ? 'INTRO' : ex.variant || ex.type}:${(ex.item || '').slice(0, 14)}${ok ? '' : '✗'}`);
  if (ex.type === 'choice' && (ex.answer < 0 || ex.options.length < 2)) console.log('BAD CHOICE', JSON.stringify(ex).slice(0, 300));
  if (ex.type === 'tiles' && ex.tiles.length < ex.answer.length) console.log('BAD TILES', ex);
  s.answer(ex, { correct: ok, ms: 4000 });
}
console.log(seq.join('  '));
console.log('\nexercises:', n, 'learned:', s.stats.learned, 'of', L.items.length);
console.log(Object.entries(state.progress).map(([k, r]) => `${k} ${r.st} due+${r.due - Math.floor(Date.now() / 864e5)}`).slice(0, 5).join('\n'));
