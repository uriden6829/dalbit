// Reader for "Real Korean" passages: sentence-by-sentence audio, toggled translation, questions.
import { h, toast } from '../lib/dom.js';
import { getState, update } from '../lib/store.js';
import { speak, stopSpeaking } from '../lib/speech.js';
import { chapterOf } from '../../content/index.js';
import { makeQuiz } from '../engine/exercises.js';
import { backLink, jiji, iconEl } from './common.js';

export const title = () => 'Reading';

export function render({ params }, { onLeave }) {
  onLeave(stopSpeaking);
  const ch = chapterOf(params[0]);
  if (!ch?.reading) return h('p', null, 'Reading not found.');
  const r = ch.reading;
  let showEn = false;
  const sentences = r.ko.split(/(?<=[.!?。])\s+/).filter(Boolean);
  const en = h('div', { class: 'passage hidden', style: { fontFamily: 'var(--f-ui)', fontSize: '1rem' } }, r.en);
  const text = h('div', { class: 'passage' }, sentences.map((s) => h('span', { style: { cursor: 'pointer' }, title: 'Tap to hear', onclick: () => speak(s) }, s, ' ')));
  const qs = (r.questions || []).map((q) => makeQuiz(q));
  let right = 0, done = 0;
  return h('div', { class: 'stack' },
    backLink(`#/chapter/${ch.id}`, ch.title.en),
    h('div', null, h('div', { class: 'eyebrow' }, 'Real Korean'), h('h1', { class: 'ko-serif' }, ch.title.ko), h('div', { class: 'muted' }, ch.title.en)),
    r.source ? h('p', { class: 'small muted' }, `Written for you by Jiji, based on facts from ${r.source}.`) : null,
    h('div', { class: 'row' }, h('button', { class: 'btn ghost small', onclick: () => speak(r.ko) }, iconEl('sound', 16), 'Read it to me'),
      h('button', { class: 'btn ghost small', onclick: (e) => { showEn = !showEn; en.classList.toggle('hidden', !showEn); e.currentTarget.textContent = showEn ? 'Hide English' : 'Show English'; } }, 'Show English')),
    text, en,
    qs.length ? h('div', { class: 'card stack' }, h('h3', null, 'Questions'), ...qs.map((q, qi) => {
      let answered = false;
      const opts = q.options.map((o, i) => h('button', { class: `opt ${o.ko ? 'ko-opt' : ''}`, onclick: () => {
        if (answered) return; answered = true; done++;
        if (i === q.answer) right++;
        opts.forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
        if (done === qs.length) { update((s) => { s.stories[`read-${ch.id}`] = { read: Date.now(), quiz: right / qs.length }; }); toast(`${right} of ${qs.length} right`); }
      } }, o.text));
      return h('div', { class: 'stack' }, h('b', null, `${qi + 1}. ${q.prompt.en}`), h('div', { class: 'options' }, opts));
    })) : null,
    ch.lessons[0] ? h('div', { class: 'row' }, jiji('idle', 56), h('a', { class: 'btn primary', href: `#/study/lesson/${ch.lessons[0].id}` }, 'Practise the words from this reading')) : null);
}
