// A study session: a queue of exercises that keeps re-showing items until they stick.
// New items climb a ladder of different exercise types; mistakes bring an item back a few turns later;
// reviews that fail become short re-learning ladders. Pure logic apart from the injected `state`.

import { items } from '../../content/index.js';
import { LADDER, RELEARN, makeExercise, pickType, SKILL } from './exercises.js';
import { newRecord, graduate, review, nudge, mastery, gradeFrom, isDue, today } from '../lib/srs.js';
import { updateSkill } from './adapt.js';

const MAX_ACTIVE = 4;

export class Session {
  // entries: [{ id, mode: 'new' | 'review' | 'practice' | 'exam', reps? }]
  constructor(state, { kind, title, entries, extras = [], midExtras = [], speaking = false, onChange }) {
    this.state = state;
    this.kind = kind;
    this.title = title;
    this.speaking = speaking;
    this.onChange = onChange || (() => {});
    this.turn = 0;
    this.lastId = null;
    this.waiting = []; // new items not yet introduced
    this.active = [];  // entries currently being worked on
    this.extras = extras.slice();
    this.midExtras = midExtras.slice();
    this.stats = { ex: 0, ok: 0, learned: 0, reviewed: 0, started: Date.now(), wrongIds: new Set(), itemsSeen: new Set(), exam: [] };
    for (const e of entries) {
      const it = items.get(e.id);
      if (!it) continue;
      const entry = { id: e.id, it, mode: e.mode, step: 0, mistakes: 0, last: -99, left: e.reps || 1, ladder: null };
      if (e.mode === 'new') { entry.ladder = this.ladderFor(it); this.waiting.push(entry); }
      else this.active.push(entry);
    }
    this.newTotal = this.waiting.length;
    this.total = this.estimate();
  }

  ladderFor(it) {
    const l = LADDER[it.kind].slice();
    if (this.speaking && it.kind === 'phrase') l.push('speak');
    return l;
  }
  rec(id) { return (this.state.progress[id] ||= newRecord()); }

  estimate() {
    const n = this.waiting.reduce((s, e) => s + e.ladder.length + 1, 0)
      + this.active.reduce((s, e) => s + (e.mode === 'new' ? e.ladder.length - e.step : e.left), 0);
    return n + this.extras.length + this.midExtras.length;
  }
  remaining() { return Math.max(0, this.estimate()); }
  progress() { const done = this.stats.ex; return done / Math.max(1, done + this.remaining()); }

  next() {
    this.turn++;
    // Introduce the next new item when there is room.
    const learning = this.active.filter((e) => e.mode === 'new' || e.mode === 'relearn');
    if (this.waiting.length && learning.length < MAX_ACTIVE) {
      const readyLearners = learning.filter((e) => this.turn - e.last > 1);
      const wantMore = learning.length < 3 || !readyLearners.length;
      if (!this.active.length || (wantMore && this.turn - (this.lastIntro ?? -9) > 1)) {
        const e = this.waiting.shift();
        e.last = this.turn;
        this.lastIntro = this.turn;
        this.active.push(e);
        this.lastId = e.id;
        return { ...makeExercise('intro', e.it), entry: e };
      }
    }
    if (this.midExtras.length && this.newTotal && this.stats.learned >= Math.ceil(this.newTotal / 2)) {
      return this.midExtras.shift();
    }
    if (this.active.length) {
      const gap = this.active.length > 3 ? 2 : this.active.length > 1 ? 1 : 0;
      const ready = this.active.filter((e) => this.turn - e.last > gap && (this.active.length === 1 || e.id !== this.lastId));
      let e;
      const reviews = ready.filter((x) => x.mode !== 'new' && x.mode !== 'relearn');
      const learners = ready.filter((x) => x.mode === 'new' || x.mode === 'relearn');
      if (reviews.length && (!learners.length || this.turn % 3 === 0)) e = reviews[0];
      else if (learners.length) e = learners.sort((a, b) => a.step - b.step || a.last - b.last)[0];
      else e = this.active.filter((x) => x.id !== this.lastId).sort((a, b) => a.last - b.last)[0] || this.active[0];
      e.last = this.turn;
      this.lastId = e.id;
      return { ...this.exerciseFor(e), entry: e };
    }
    if (this.midExtras.length) return this.midExtras.shift();
    if (this.extras.length) return this.extras.shift();
    return null;
  }

  exerciseFor(e) {
    if (e.mode === 'new' || e.mode === 'relearn') return makeExercise(e.ladder[e.step], e.it);
    const m = mastery(this.state.progress[e.id]);
    return makeExercise(pickType(e.it, { mastery: m, exam: e.mode === 'exam', speaking: this.speaking }), e.it);
  }

  // result: { correct, hinted, ms, skipped }
  answer(ex, result) {
    const e = ex.entry;
    if (ex.type === 'intro') { this.onChange(); return {}; }
    const s = this.stats;
    s.ex++;
    if (result.correct) s.ok++;
    const ms = Math.min(result.ms || 0, 60000);
    const out = { correct: result.correct };
    if (e) {
      s.itemsSeen.add(e.id);
      if (!result.correct) s.wrongIds.add(e.id);
      const r = this.rec(e.id);
      r.last = Date.now();
      result.correct ? r.ok++ : r.bad++;
      updateSkill(this.state, ex.skill || SKILL[ex.variant], e.it.b ?? -2, result.correct, { guess: ex.type === 'choice' ? 1 / ex.options.length : 0.05 });
      if (result.skipped) { this.drop(e); this.onChange(); return out; }

      if (e.mode === 'new' || e.mode === 'relearn') {
        if (result.correct) e.step++; else e.mistakes++;
        if (e.mistakes > 6) e.step = e.ladder.length; // don't trap her on one item; it comes back tomorrow
        if (e.step >= e.ladder.length) {
          if (e.mode === 'new') { graduate(r, e.mistakes); s.learned++; out.graduated = true; }
          this.drop(e);
        }
      } else if (e.mode === 'review') {
        const q = gradeFrom({ ...result, ms });
        review(r, q);
        s.reviewed++;
        if (result.correct) this.drop(e);
        else { e.mode = 'relearn'; e.ladder = RELEARN[e.it.kind]; e.step = 0; }
      } else if (e.mode === 'practice') {
        if (!result.correct) { nudge(r); e.left = Math.min(e.left + 1, 3); }
        else if (isDue(r, today())) { review(r, gradeFrom({ ...result, ms })); }
        if (--e.left <= 0) this.drop(e);
      } else if (e.mode === 'exam') {
        s.exam.push({ id: e.id, correct: result.correct });
        if (isDue(r, today())) review(r, gradeFrom({ ...result, ms }));
        else if (!result.correct) nudge(r);
        this.drop(e);
      }
    } else if (ex.examQuestion) {
      s.exam.push({ id: null, correct: result.correct });
    }
    this.onChange();
    return out;
  }

  drop(e) { this.active = this.active.filter((x) => x !== e); }

  examScore() {
    const ex = this.stats.exam;
    return ex.length ? ex.filter((x) => x.correct).length / ex.length : 0;
  }
}
