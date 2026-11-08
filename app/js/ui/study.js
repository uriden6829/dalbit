// Session player: renders exercises, gives feedback, and wraps up with a summary.
import { h, svg, toast, sleep } from '../lib/dom.js';
import { getState, update, save, logActivity } from '../lib/store.js';
import { speak, speakSoon, stopSpeaking, hasSTT, listen, record } from '../lib/speech.js';
import { similarity, alignSyllables, romanize } from '../lib/hangul.js';
import { mastery } from '../lib/srs.js';
import { Session } from '../engine/session.js';
import { dailySession, lessonSession, reviewSession, recapSession, examSession, trickySession, lessonStats, chapterNodes } from '../engine/plan.js';
import { items, lessons, chapterOf, courseChapters } from '../../content/index.js';
import { showRoman } from '../engine/adapt.js';
import { emit } from '../lib/bus.js';
import { speakBtn, slowBtn, jiji, line, romanLine, pronLine, moonEl, iconEl } from './common.js';

export const title = (p) => ({ daily: 'Tonight’s study', lesson: 'Lesson', review: 'Review', recap: 'Moonlight Recap', exam: 'Exam', tricky: 'Tricky words' }[p[0]] || 'Study');

const BUILDERS = {
  daily: (st) => dailySession(st),
  lesson: (st, arg) => lessonSession(st, arg),
  review: (st) => reviewSession(st),
  recap: (st) => recapSession(st),
  exam: (st, arg) => examSession(st, arg),
  tricky: (st) => trickySession(st),
};

export function render({ params }, { go, onLeave }) {
  const [kind, arg] = params;
  const st = getState();
  const opts = BUILDERS[kind]?.(st, arg);
  if (!opts) { go('#/home'); return h('div'); }
  const roman = showRoman(st);
  const before = snapshotLessons(st);
  const session = new Session(st, { ...opts, speaking: st.settings.speaking, onChange: save });
  const root = h('div', { class: 'main' });
  const wrap = h('div', { class: 'session' });
  root.append(wrap);
  const barFill = h('i', { style: { width: '0%' } });
  const count = h('div', { class: 'count' });
  const top = h('div', { class: 'session-top' },
    h('button', { class: 'btn ghost icon-only', title: 'Leave session', onclick: () => leave() }, iconEl('x', 18)),
    h('div', { class: 'bar' }, barFill), count);
  const stage = h('div', { class: 'ex' });
  wrap.append(top, stage);
  let exStart = 0, keyHandler = null;
  const setKeys = (fn) => { keyHandler = fn; };
  const onKey = (e) => { if (keyHandler && !e.target.matches('input, textarea')) keyHandler(e); };
  document.addEventListener('keydown', onKey);
  onLeave(() => { document.removeEventListener('keydown', onKey); stopSpeaking(); save(); });

  async function leave() {
    if (session.stats.ex > 3) logActivity({});
    go(kind === 'lesson' || kind === 'exam' ? `#/chapter/${opts.chapterId || lessons.get(arg)?.chapter || ''}` : '#/home');
  }

  if (!opts.entries.length && !(opts.extras || []).length) {
    stage.append(h('div', { class: 'card intro-card stack' }, jiji('sleepy', 110),
      h('h2', null, kind === 'daily' ? 'Nothing waiting tonight' : 'Nothing to practise yet'),
      h('p', { class: 'muted' }, line('noDue')),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, h('a', { class: 'btn primary', href: '#/course' }, 'Open the course'), h('a', { class: 'btn ghost', href: '#/home' }, 'Home'))));
    return root;
  }

  function next() {
    stopSpeaking(); // a new question starts in silence, whatever was still playing
    const ex = session.next();
    barFill.style.width = `${Math.round(session.progress() * 100)}%`;
    count.textContent = `${session.stats.ex} done`;
    if (!ex) return finish();
    stage.replaceChildren();
    stage.style.animation = 'none'; void stage.offsetWidth; stage.style.animation = '';
    exStart = performance.now();
    emit('exercise', ex);
    const view = VIEWS[ex.type];
    view(ex, { stage, roman, setKeys, done: (result) => answered(ex, result), session });
  }

  function answered(ex, result) {
    const ms = performance.now() - exStart;
    const res = session.answer(ex, { ...result, ms });
    if (ex.type !== 'intro') { logActivity({ ex: 1, ok: result.correct ? 1 : 0, ms, learned: res.graduated ? 1 : 0 }); emit('answer', { correct: !!result.correct, graduated: !!res.graduated, skipped: !!result.skipped }); }
    if (ex.type === 'intro' || result.silent) return next();
    showFeedback(ex, result, res);
  }

  function showFeedback(ex, result, res) {
    const it = ex.item ? items.get(ex.item) : null;
    const ok = result.correct;
    const ko = ex.full || (it ? (it.kind === 'letter' ? it.say : it.ko) : ex.options?.[ex.answer]?.text);
    const en = ex.prompt?.en && ex.variant === 'drill' ? ex.prompt.en : it?.en;
    if (ok && getState().settings.autoplay && ko && /[가-힣]/.test(ko)) speak(ko);
    const fb = h('div', { class: `feedback ${ok ? 'ok' : 'no'}` },
      jiji(ok ? (res.graduated ? 'happy' : 'smug') : 'think', 56),
      h('div', null,
        h('div', { class: 'fb-title' }, result.skipped ? 'Skipped for now' : ok ? (res.graduated ? `${line('correct')} ${line('graduated')}` : line('correct')) : line('wrong')),
        !ok && ex.type === 'choice' && ex.options[ex.answer] ? h('div', null, 'Answer: ', h('b', { class: /[가-힣]/.test(ex.options[ex.answer].text) ? 'ko' : '' }, ex.options[ex.answer].text)) : null,
        ko && /[가-힣]/.test(ko) ? h('div', { class: 'row', style: { gap: '8px' } }, h('span', { class: 'fb-ko' }, ko), speakBtn(ko), slowBtn(ko)) : null,
        ko && /[가-힣]/.test(ko) && (roman || !ok) ? h('div', { class: 'fb-roman' }, romanize(ko)) : null,
        en ? h('div', { class: 'fb-en' }, en) : null),
      h('button', { class: 'btn primary', onclick: next, autofocus: true }, 'Continue ', iconEl('arrow', 16)));
    stage.append(fb);
    fb.querySelector('.btn.primary').focus();
    setKeys((e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
  }

  function finish() {
    setKeys(null);
    emit('session-end', { kind });
    const s = session.stats;
    const mins = Math.max(1, Math.round((Date.now() - s.started) / 60000));
    const acc = s.ex ? Math.round((s.ok / s.ex) * 100) : 0;
    const extra = [];
    update((stt) => {
      for (const L of lessons.values()) {
        const now = lessonStats(stt, L).done;
        if (now && !before.has(L.id)) { stt.lessons[L.id] = { ...(stt.lessons[L.id] || {}), done: true, at: Date.now() }; stt.recap.lessonsSince++; extra.push(`Lesson complete: ${L.title.en}`); }
        if (L.id === arg && kind === 'lesson') stt.lessons[L.id] = { ...(stt.lessons[L.id] || {}), runs: (stt.lessons[L.id]?.runs || 0) + 1 };
      }
      if (kind === 'recap') { stt.recap.last = Date.now(); stt.recap.lessonsSince = 0; }
      if (kind === 'exam') {
        const ch = chapterOf(arg);
        const c = (stt.chapters[ch.id] ||= {});
        const score = session.examScore();
        c.exam = Math.max(c.exam || 0, score);
        if (score >= 0.8 && !c.passed) { c.passed = true; c.passedAt = Date.now(); extra.push(`Chapter cleared: ${ch.title.en}`); }
      }
    });
    const learned = [...s.itemsSeen].map((id) => items.get(id)).filter(Boolean);
    const examScore = kind === 'exam' ? Math.round(session.examScore() * 100) : null;
    const passed = examScore !== null && examScore >= 80;
    const nextHref = nextHrefAfter(kind, arg);
    stage.replaceChildren(h('div', { class: 'card summary stack' },
      jiji(examScore === null || passed ? 'happy' : 'think', 120),
      h('h2', null, examScore === null ? line('done') : passed ? 'Passed. 축하해요!' : 'Not quite yet'),
      examScore !== null ? h('p', { class: 'muted' }, passed ? 'The next chapter is open.' : 'You need 80% to pass. The words you missed are now in your reviews — practise them and try again.') : null,
      extra.length ? h('div', null, extra.map((t) => h('div', { class: 'pill', style: { margin: '3px' } }, t))) : null,
      h('div', { class: 'stats' },
        examScore !== null ? stat(`${examScore}%`, 'exam score') : stat(`${acc}%`, 'accuracy'),
        stat(s.ex, 'exercises'), stat(s.learned, 'new words learned'), stat(s.reviewed, 'reviews'), stat(`${mins}m`, 'time')),
      learned.length ? h('details', null, h('summary', { class: 'small muted', style: { cursor: 'pointer' } }, `Words in this session (${learned.length})`),
        h('div', { class: 'wordlist', style: { marginTop: '10px' } }, learned.slice(0, 40).map((it) => h('div', { class: 'wordrow' },
          moonEl(mastery(getState().progress[it.id])), h('span', { class: 'ko' }, it.kind === 'letter' ? it.ko : it.ko), h('span', { class: 'en' }, it.en),
          s.wrongIds.has(it.id) ? h('span', { class: 'pill' }, 'tricky') : null, speakBtn(it.kind === 'letter' ? it.say : it.ko))))) : null,
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        kind === 'lesson' ? h('a', { class: 'btn ghost', href: `#/study/lesson/${arg}`, onclick: (e) => { e.preventDefault(); go(`#/study/lesson/${arg}`); } }, iconEl('refresh', 16), 'Practise again') : null,
        nextHref ? h('a', { class: 'btn primary', href: nextHref[0] }, nextHref[1]) : null,
        h('a', { class: 'btn ghost', href: '#/home' }, 'Home'))));
  }

  next();
  return root;
}

function stat(v, label) { return h('div', { class: 'stat' }, h('b', null, String(v)), h('span', null, label)); }

function snapshotLessons(st) {
  const done = new Set();
  for (const L of lessons.values()) if (lessonStats(st, L).done) done.add(L.id);
  return done;
}

function nextHrefAfter(kind, arg) {
  const st = getState();
  if (kind === 'lesson') {
    const L = lessons.get(arg);
    const ch = chapterOf(L.chapter);
    const n = chapterNodes(st, ch).find((x) => !x.done);
    if (!n) return [`#/chapter/${ch.id}`, 'Back to chapter'];
    return [hrefFor(n, ch), n.type === 'lesson' ? `Next: ${n.lesson.title.en}` : n.type === 'story' ? 'Read the story' : n.type === 'speak' ? 'Speaking practice' : 'Take the chapter exam'];
  }
  if (kind === 'exam') {
    const list = courseChapters();
    const i = list.findIndex((c) => c.id === arg);
    return st.chapters[arg]?.passed && list[i + 1] ? [`#/chapter/${list[i + 1].id}`, `On to ${list[i + 1].title.en}`] : [`#/chapter/${arg}`, 'Back to chapter'];
  }
  return ['#/course', 'Course'];
}
export function hrefFor(n, ch) {
  return n.type === 'lesson' ? `#/study/lesson/${n.id}` : n.type === 'reading' ? `#/read/${n.id}` : n.type === 'story' ? `#/story/${n.id}` : n.type === 'speak' ? `#/speak/${ch.id}` : `#/study/exam/${ch.id}`;
}

// ---------------- Exercise views ----------------
const KEYS = ['1', '2', '3', '4', '5', '6'];

function introView(ex, { stage, roman, setKeys, done }) {
  const it = items.get(ex.item);
  let card;
  if (it.kind === 'gram') {
    card = h('div', { class: 'card gram-card' },
      h('div', { class: 'eyebrow' }, 'New grammar'),
      h('h2', null, it.title), h('div', { class: 'en', style: { fontFamily: 'var(--f-display)', fontSize: '1.3rem' } }, it.en),
      h('ul', null, it.explain.map((t) => h('li', null, t))),
      h('div', { class: 'examples' }, it.examples.map((e) => h('div', { class: 'eg' }, speakBtn(e.ko), h('div', null, h('div', { class: 'ko' }, e.ko), h('div', { class: 'small muted' }, e.en))))));
    if (it.examples[0]) speak(it.examples[0].ko);
  } else if (it.kind === 'letter') {
    const big = it.batchim ? it.say : it.ko;
    card = h('div', { class: 'card intro-card' },
      h('div', { class: 'eyebrow' }, it.batchim ? 'Bottom letter' : 'New letter'),
      h('div', { class: 'letter' }, big),
      h('div', { class: 'en' }, it.en), h('div', { class: 'muted small' }, `name: ${it.name}`),
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } }, speakBtn(it.say, { big: true })),
      h('div', { class: 'hint' }, it.hint));
    speak(it.say);
  } else {
    card = h('div', { class: 'card intro-card' },
      h('div', { class: 'eyebrow' }, it.kind === 'phrase' ? 'New phrase' : 'New word'),
      h('div', { class: 'big-ko ko' }, it.ko),
      romanLine(it.ko, roman, it.pron), pronLine(it.ko, it.pron),
      h('div', { class: 'en' }, it.en),
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } }, speakBtn(it.ko, { big: true }), slowBtn(it.ko)),
      it.hint ? h('div', { class: 'hint' }, it.hint) : null,
      it.ex ? h('div', { class: 'example' }, h('div', { class: 'row', style: { justifyContent: 'center', gap: '8px' } }, h('span', { class: 'ko' }, it.ex.ko), speakBtn(it.ex.ko)), h('div', { class: 'muted small' }, it.ex.en)) : null);
    speak(it.ko);
  }
  const btn = h('button', { class: 'btn primary big', onclick: () => done({ correct: true }) }, 'Got it ', iconEl('arrow', 16));
  stage.append(card, h('div', { class: 'row', style: { justifyContent: 'center' } }, btn));
  btn.focus();
  setKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); done({ correct: true }); } });
}

function choiceView(ex, { stage, roman, setKeys, done }) {
  const p = ex.prompt;
  let hinted = false, answered = false;
  const promptEl = h('div', { class: 'prompt' });
  if (p.big) promptEl.append(h('div', { class: 'letter' }, p.big));
  if (p.ko) promptEl.append(h('div', { class: 'big-ko ko' }, p.ko));
  if (p.cloze) {
    const [a, b] = p.cloze.split('___');
    promptEl.append(h('div', { class: 'cloze ko' }, a, h('span', { class: 'blank' }, '?'), b ?? ''), p.en ? h('div', { class: 'sub' }, p.en) : null);
  } else if (p.en) promptEl.append(h('div', { class: ex.variant === 'quiz' ? 'sub' : 'en-big' }, p.en));
  if (p.audio) {
    const reveal = h('button', { class: 'linkish small', onclick: () => { hinted = true; reveal.replaceWith(h('div', { class: 'ko', style: { fontSize: '1.4rem', marginTop: '8px' } }, p.audio)); } }, 'Show text');
    promptEl.append(h('div', { class: 'row', style: { justifyContent: 'center' } }, speakBtn(p.audio, { big: true }), slowBtn(p.audio)), h('div', { style: { marginTop: '8px' } }, reveal));
    speakSoon(p.audio, {}, 250);
  }
  if (p.ko && ex.variant === 'recognize') {
    const hear = h('button', { class: 'linkish small', onclick: () => { hinted = true; speak(p.ko); } }, 'Hint: listen');
    promptEl.append(h('div', { style: { marginTop: '6px' } }, hear));
  }
  const opts = ex.options.map((o, i) => h('button', { class: `opt ${o.ko ? 'ko-opt' : ''}`, onclick: () => choose(i) }, h('span', { class: 'k' }, KEYS[i]), o.text));
  const idk = h('button', { class: 'linkish small muted idk', onclick: () => choose(-1) }, 'I don’t know');
  stage.append(h('div', { class: 'ask center' }, p.ask || ''), promptEl, h('div', { class: 'options' }, opts), idk);
  function choose(i) {
    if (answered) return;
    answered = true;
    const correct = i === ex.answer;
    opts.forEach((b, j) => { b.disabled = true; if (j === ex.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
    idk.remove();
    // Answered: the question's audio stops (she may answer before it ends); a right answer is read out.
    if (p.speakAfter && correct) speak(p.speakAfter); else stopSpeaking();
    done({ correct, hinted });
  }
  setKeys((e) => { const i = KEYS.indexOf(e.key); if (i >= 0 && i < opts.length) choose(i); });
}

function tilesView(ex, { stage, setKeys, done }) {
  const chosen = [];
  const answerEl = h('div', { class: 'tiles-answer ko' });
  const bank = h('div', { class: 'tiles-bank' });
  const isWord = ex.joiner === ' ';
  const btns = ex.tiles.map((t, i) => h('button', { class: `tilebtn ${isWord ? 'word' : ''}`, onclick: () => add(i) }, t));
  bank.append(...btns);
  const check = h('button', { class: 'btn primary', disabled: true, onclick: () => grade() }, 'Check');
  const listenBtn = speakBtn(items.get(ex.item).ko);
  // Clearing is a no-op once graded (remove() bails out), so it must not loop on `chosen.length`:
  // that infinite loop froze the app when she pressed Clear after a wrong answer.
  const clear = h('button', { class: 'btn ghost small', onclick: () => { if (finished) return; chosen.length = 0; redraw(); } }, 'Clear');
  stage.append(h('div', { class: 'ask center' }, ex.prompt.ask),
    h('div', { class: 'prompt' }, h('div', { class: 'en-big' }, ex.prompt.en)),
    answerEl, bank,
    h('div', { class: 'row', style: { justifyContent: 'center' } }, clear, check));
  let finished = false;
  function redraw() {
    answerEl.replaceChildren(...chosen.map((i, k) => h('button', { class: `tilebtn ${isWord ? 'word' : ''}`, onclick: () => remove(k) }, ex.tiles[i])));
    btns.forEach((b, i) => b.classList.toggle('used', chosen.includes(i)));
    check.disabled = chosen.length !== ex.answer.length;
  }
  function add(i) { if (finished || chosen.includes(i) || chosen.length >= ex.answer.length) return; chosen.push(i); redraw(); if (chosen.length === ex.answer.length) check.focus(); }
  function remove(k) { if (finished) return; chosen.splice(k, 1); redraw(); }
  function grade() {
    if (finished) return;
    finished = true;
    const got = chosen.map((i) => ex.tiles[i]).join(ex.joiner);
    const want = ex.answer.join(ex.joiner);
    const correct = got === want;
    answerEl.style.borderColor = correct ? 'var(--sage)' : 'var(--rose)';
    if (!correct) answerEl.append(h('div', { class: 'small muted', style: { width: '100%', textAlign: 'center' } }, 'You built: ', got));
    stopSpeaking();
    check.remove();
    clear.remove();
    stage.querySelector('.tiles-bank').replaceChildren(listenBtn);
    done({ correct });
  }
  setKeys((e) => {
    if (e.key === 'Enter' && !check.disabled) grade();
    if (e.key === 'Backspace' && chosen.length) remove(chosen.length - 1);
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= btns.length) add(n - 1);
  });
}

function speakView(ex, { stage, roman, setKeys, done, session }) {
  const t = ex.target;
  let tries = 0, best = 0, finished = false;
  const heard = h('div', { class: 'heard' });
  const status = h('div', { class: 'muted small' });
  const finishWith = (correct, extra = {}) => { if (finished) return; finished = true; done({ correct, ...extra }); };
  const skip = h('button', { class: 'linkish small muted', onclick: () => { session.speaking = false; getState().settings.speaking && toast('Speaking paused for this session'); finishWith(true, { skipped: true, silent: false }); } }, 'Can’t speak right now');
  stage.append(h('div', { class: 'ask center' }, 'Say it out loud'),
    h('div', { class: 'prompt' }, h('div', { class: 'big-ko ko' }, t.ko), romanLine(t.ko, roman), h('div', { class: 'sub' }, t.en),
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } }, speakBtn(t.ko), slowBtn(t.ko))));
  const area = h('div', { class: 'speak-area' });
  stage.append(area);
  speakSoon(t.ko, {}, 200);
  if (hasSTT()) {
    const mic = h('button', { class: 'mic-btn', title: 'Speak', onclick: go }, svg(`<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`));
    area.append(mic, status, heard, skip);
    status.textContent = 'Tap the microphone, then speak.';
    async function go() {
      if (finished) return;
      mic.classList.add('live'); status.textContent = 'Listening…';
      const r = await listen();
      mic.classList.remove('live');
      if (r.error && !r.alternatives.length) {
        status.textContent = r.error === 'not-allowed' ? 'Microphone blocked — allow it in the browser’s address bar.' : r.error === 'network' ? 'Speech recognition needs internet.' : 'I didn’t catch that. Try again.';
        return;
      }
      tries++;
      let top = r.alternatives[0], score = 0;
      for (const a of r.alternatives) { const s = similarity(t.ko, a); if (s > score) { score = s; top = a; } }
      best = Math.max(best, score);
      heard.replaceChildren(...alignSyllables(t.ko, top).map((c) => h('span', { class: c.ok ? 'hit' : 'miss' }, c.ch)));
      const pct = Math.round(score * 100);
      if (score >= 0.8) { status.textContent = `${pct}% — beautiful.`; finishWith(true); }
      else if (tries >= 3) { status.textContent = `${pct}%. Good effort — we’ll practise it again.`; finishWith(best >= 0.6); }
      else status.textContent = `${pct}%. I heard “${top}”. Listen once more and try again.`;
    }
    setKeys((e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(); } });
  } else {
    // No recognition: record and compare by ear.
    const rec = h('button', { class: 'mic-btn', onclick: doRecord }, iconEl('mic', 36));
    const rate = h('div', { class: 'row hidden', style: { justifyContent: 'center' } },
      h('button', { class: 'btn ghost', onclick: () => finishWith(false) }, 'Needs work'),
      h('button', { class: 'btn primary', onclick: () => finishWith(true) }, 'Sounded right'));
    area.append(rec, status, rate, skip);
    status.textContent = 'Record yourself, then compare with the model.';
    async function doRecord() {
      try {
        rec.classList.add('live'); status.textContent = 'Recording for 4 seconds…';
        const url = await record(4000);
        rec.classList.remove('live');
        status.replaceChildren('Compare: ', h('button', { class: 'btn small ghost', onclick: () => new Audio(url).play() }, 'Play me'), ' ', h('button', { class: 'btn small ghost', onclick: () => speak(t.ko) }, 'Play model'));
        new Audio(url).play();
        rate.classList.remove('hidden');
      } catch { rec.classList.remove('live'); status.textContent = 'Microphone not available.'; rate.classList.remove('hidden'); }
    }
  }
}

function matchView(ex, { stage, done }) {
  const left = [...ex.pairs].sort(() => Math.random() - 0.5);
  const right = [...ex.pairs].sort(() => Math.random() - 0.5);
  let sel = null, mistakes = 0, left_n = ex.pairs.length;
  const lb = left.map((p) => h('button', { class: 'opt ko-opt', onclick: () => pickSide('l', p, lb[left.indexOf(p)]) }, p.ko));
  const rb = right.map((p) => h('button', { class: 'opt', onclick: () => pickSide('r', p, rb[right.indexOf(p)]) }, p.en));
  const grid = h('div', { class: 'match' });
  for (let i = 0; i < left.length; i++) grid.append(lb[i], rb[i]);
  stage.append(h('div', { class: 'ask center' }, 'Match the pairs'), h('p', { class: 'center muted small' }, 'A quick spell-matching round.'), grid);
  async function pickSide(side, p, btn) {
    if (btn.classList.contains('gone')) return;
    if (!sel || sel.side === side) {
      if (sel) sel.btn.classList.remove('sel');
      sel = { side, p, btn }; btn.classList.add('sel');
      if (side === 'l') speak(p.ko);
      return;
    }
    const a = sel; sel = null; a.btn.classList.remove('sel');
    if (a.p.id === p.id) {
      a.btn.classList.add('right'); btn.classList.add('right');
      await sleep(250);
      a.btn.classList.add('gone'); btn.classList.add('gone');
      if (--left_n === 0) done({ correct: mistakes <= 2, silent: true });
    } else {
      mistakes++;
      a.btn.classList.add('wrong'); btn.classList.add('wrong');
      await sleep(400);
      a.btn.classList.remove('wrong'); btn.classList.remove('wrong');
    }
  }
}

const VIEWS = { intro: introView, choice: choiceView, tiles: tilesView, speak: speakView, match: matchView };
export { VIEWS };
