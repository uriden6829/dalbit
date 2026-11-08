// Entrance exam: self-assessment → adaptive test → optional read-aloud → results and placement.
import { h, svg, confirmDialog } from '../lib/dom.js';
import { getState, update } from '../lib/store.js';
import { speak, speakSoon, hasSTT, listen, stopSpeaking } from '../lib/speech.js';
import { similarity } from '../lib/hangul.js';
import { newRecord, seedKnown, isLearned } from '../lib/srs.js';
import { Placement, SELF } from '../engine/placement.js';
import { SPEAK_LINES } from '../../content/placement-bank.js';
import { levelOf, SKILL_LABEL } from '../engine/adapt.js';
import { chapterOf, chapterItems } from '../../content/index.js';
import { shuffle } from '../lib/rand.js';
import { jiji, jijiSays, speakBtn, slowBtn, iconEl } from './common.js';

export const title = () => 'Entrance exam';

export function render(_, { go, onLeave }) {
  onLeave(stopSpeaking);
  const root = h('div', { class: 'main' });
  const wrap = h('div', { class: 'session' });
  root.append(wrap);
  let test = null, keyFn = null;
  const onKey = (e) => keyFn && keyFn(e);
  document.addEventListener('keydown', onKey);
  onLeave(() => document.removeEventListener('keydown', onKey));

  function intro() {
    wrap.replaceChildren(h('div', { class: 'stack' },
      h('div', { class: 'row' }, h('a', { class: 'btn ghost small', href: '#/home' }, iconEl('back', 16), 'Later'), h('span', { class: 'spacer' })),
      h('div', { class: 'eyebrow' }, '입학 시험 · Entrance exam'),
      h('h1', null, 'Let’s find your level'),
      jijiSays('The test adapts to you: right answers bring harder questions, misses bring easier ones. If you don’t know, press “I don’t know” — guessing only blurs the picture. No scores are shown until the end.', { mood: 'smug' }),
      h('h3', null, 'First, how would you describe your Korean?'),
      h('div', { class: 'choice-cards' }, Object.entries(SELF).map(([k, v]) =>
        h('button', { class: 'choice-card', onclick: () => { test = new Placement(k); ask(); } }, h('b', null, v.label), h('span', null, v.sub))))));
  }

  function ask() {
    const it = test.next();
    if (!it) return speaking();
    const p = it.prompt;
    const opts = shuffle(it.options.map((text, i) => ({ text, ok: i === 0 })));
    const isKo = (t) => /[가-힣]/.test(t);
    const promptEl = h('div', { class: 'prompt' });
    if (p.ko) promptEl.append(h('div', { class: 'big-ko ko' }, p.ko));
    if (p.en) promptEl.append(h('div', { class: 'en-big' }, p.en));
    if (p.cloze) { const [a, b] = p.cloze.split('___'); promptEl.replaceChildren(h('div', { class: 'cloze ko' }, a, h('span', { class: 'blank' }, '?'), b ?? ''), h('div', { class: 'sub' }, p.en)); }
    if (p.passage) promptEl.append(h('div', { class: 'passage' }, p.passage));
    if (p.audio) {
      promptEl.append(h('div', { class: 'row', style: { justifyContent: 'center' } }, speakBtn(p.audio, { big: true }), slowBtn(p.audio)));
      speakSoon(p.audio, {}, 300);
    }
    if (p.q) promptEl.append(h('div', { class: 'sub', style: { marginTop: '12px', fontWeight: 700 } }, p.q));
    let answered = false;
    const pick = (i) => {
      if (answered) return; answered = true;
      stopSpeaking(); // the question's audio ends with the question
      test.answer(it, i >= 0 && opts[i].ok);
      buttons.forEach((b) => { b.disabled = true; });
      if (i >= 0) buttons[i].classList.add('sel');
      setTimeout(ask, 260);
    };
    const buttons = opts.map((o, i) => h('button', { class: `opt ${isKo(o.text) ? 'ko-opt' : ''}`, onclick: () => pick(i) }, h('span', { class: 'k' }, String(i + 1)), o.text));
    keyFn = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= buttons.length) pick(n - 1); if (e.key === '0' || e.key === '?') pick(-1); };
    wrap.replaceChildren(
      h('div', { class: 'session-top' }, h('button', { class: 'btn ghost icon-only', title: 'Stop', onclick: async () => { if (await confirmDialog('Stop the exam? Your answers so far will be lost.', { yes: 'Stop', danger: true })) go('#/home'); } }, iconEl('x', 18)),
        h('div', { class: 'bar' }, h('i', { style: { width: `${Math.round(test.progress() * 100)}%` } })), h('div', { class: 'count' }, `Q${test.responses.length + 1}`)),
      h('div', { class: 'ex' }, h('div', { class: 'ask center' }, p.ask), promptEl, h('div', { class: 'options' }, buttons),
        h('button', { class: 'btn ghost small idk', onclick: () => pick(-1) }, 'I don’t know')));
  }

  async function speaking() {
    keyFn = null;
    const res = test.result();
    const lvl = Math.max(1, levelOf(res.theta).level);
    if (!hasSTT() || res.theta < -2.9) return results(res, null);
    const lines = SPEAK_LINES[Math.min(6, lvl)];
    const scores = [];
    let i = 0;
    const step = () => {
      if (i >= lines.length) return results(res, scores);
      const t = lines[i];
      const status = h('div', { class: 'muted small' }, 'Press the microphone and read it aloud.');
      const mic = h('button', { class: 'mic-btn', onclick: async () => {
        mic.classList.add('live'); status.textContent = 'Listening…';
        const r = await listen();
        mic.classList.remove('live');
        if (!r.alternatives.length) { status.textContent = r.error === 'not-allowed' ? 'Microphone blocked. You can skip this part.' : 'I didn’t catch that — try again or skip.'; return; }
        scores.push(Math.max(...r.alternatives.map((a) => similarity(t, a))));
        i++; step();
      } }, iconEl('mic', 36));
      wrap.replaceChildren(h('div', { class: 'stack center' },
        h('div', { class: 'eyebrow' }, `Last part · read aloud ${i + 1}/${lines.length}`),
        h('h2', null, 'Say this sentence'), h('div', { class: 'big-ko ko', style: { fontSize: '2rem' } }, t),
        h('div', { class: 'speak-area' }, mic, status),
        h('button', { class: 'linkish small', onclick: () => results(res, scores.length ? scores : null) }, 'Skip speaking')));
    };
    step();
  }

  function results(res, speakScores) {
    const lvl = levelOf(res.theta);
    if (speakScores?.length) {
      const avg = speakScores.reduce((a, b) => a + b, 0) / speakScores.length;
      res.skills.speaking = res.theta + (avg - 0.75) * 2.5;
    }
    const start = chapterOf(res.startChapter);
    const bars = Object.entries(res.skills).map(([k, th]) => {
      const pct = Math.round(Math.max(4, Math.min(100, ((th + 3.5) / 7) * 100)));
      return h('div', { class: 'skill-bar' }, h('span', null, SKILL_LABEL[k] || k), h('div', { class: 'bar' }, h('i', { style: { width: `${pct}%` } })), h('span', { class: 'small muted' }, levelOf(th).label.replace(/ \(.*/, '')));
    });
    const apply = (fromStart) => {
      update((s) => {
        s.placement = { ...res, label: lvl.label, history: [...(s.placement?.history || []), { theta: res.theta, at: res.at }].slice(-10) };
        s.skills = {};
        if (fromStart) { s.placement.startChapter = 'h0'; s.placement.testedOut = []; return; }
        const spread = Math.min(30, 10 + res.testedOut.length * 2);
        for (const id of res.testedOut) {
          s.chapters[id] = { ...(s.chapters[id] || {}), testedOut: true };
          for (const itemId of chapterItems(chapterOf(id))) {
            const r = (s.progress[itemId] ||= newRecord());
            if (!isLearned(r)) seedKnown(r, spread);
          }
        }
      });
      go(fromStart ? '#/story/ep00' : `#/chapter/${getState().placement.startChapter}`);
    };
    wrap.replaceChildren(h('div', { class: 'stack' },
      h('div', { class: 'center' }, jiji('happy', 130)),
      h('div', { class: 'eyebrow center' }, 'Entrance exam results'),
      h('h1', { class: 'center' }, lvl.label),
      h('p', { class: 'center muted' }, `${lvl.sub ? `${lvl.sub[0].toUpperCase()}${lvl.sub.slice(1)} in this band. ` : ''}Based on ${res.n} questions. This is an estimate — the course keeps adjusting as you study, and you can retake the exam any time.`),
      h('div', { class: 'card stack' }, h('h3', null, 'Your skills'), h('div', { class: 'skill-bars' }, bars),
        speakScores === null && hasSTT() ? null : !hasSTT() ? h('p', { class: 'small muted' }, 'Speaking wasn’t measured: this browser has no speech recognition (Edge or Chrome on a PC does).') : null),
      h('div', { class: 'card night stack' },
        h('div', { class: 'eyebrow' }, 'Where you’ll start'),
        h('h2', null, start.title.en, ' · ', h('span', { class: 'ko-serif' }, start.title.ko)),
        res.testedOut.length ? h('p', { class: 'muted' }, `${res.testedOut.length} earlier chapter${res.testedOut.length > 1 ? 's are' : ' is'} marked as known. Their words will show up in your reviews over the next weeks, so anything shaky gets caught.`) : h('p', { class: 'muted' }, 'We’ll start at the beginning — the right place to build solid foundations.'),
        res.beyondCourse ? h('p', { class: 'muted' }, 'You’re above most of the built-in course. The later chapters will feel easy; Ask Jiji can make harder lessons on request, and more advanced chapters can be added in updates.') : null,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => apply(false) }, 'Start here'),
          res.testedOut.length ? h('button', { class: 'btn ghost', onclick: () => apply(true) }, 'Start from the very beginning instead') : null))));
  }

  intro();
  return root;
}
