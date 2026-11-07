// Demo state for previews and screenshots: open the app with ?demo=1 in a fresh browser profile.
// Never runs for a real learner unless that URL parameter is used.
import { getState, update } from './lib/store.js';
import { newRecord, graduate, today } from './lib/srs.js';
import { lessons } from '../content/index.js';

export function seedDemo() {
  const st = getState();
  if (st.profile.onboarded) return;
  update((s) => {
    s.profile.onboarded = true;
    s.profile.name = 'Demo';
    s.placement = { theta: -2.0, se: 0.3, at: Date.now(), startChapter: 'c01', skills: {} };
    s.chapters.h0 = { testedOut: true };
    const d = today();
    for (const id of lessons.get('c01-l1').items.slice(0, 12)) {
      const r = (s.progress[id] = newRecord());
      graduate(r, 0, d - 2);
      r.due = d - (id.length % 2);
    }
    const now = new Date();
    for (let i = 1; i < 9; i += 2) {
      const dt = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - i));
      s.log[`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`] = { ex: 40, ok: 34, ms: 600000, new: 6 };
    }
  });
}
