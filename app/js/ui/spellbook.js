// Spellbook: every item she has met, searchable, with mastery moons and audio.
import { h, svg, modal } from '../lib/dom.js';
import { getState } from '../lib/store.js';
import { mastery, today } from '../lib/srs.js';
import { romanize } from '../lib/hangul.js';
import { items, chapterOf } from '../../content/index.js';
import { moon, MASTERY_LABEL, icon } from '../art/icons.js';
import { speakBtn, slowBtn, pronLine } from './common.js';

export const title = () => 'Spellbook';

const KINDS = [['all', 'All'], ['word', 'Words'], ['phrase', 'Phrases'], ['gram', 'Grammar'], ['letter', 'Letters']];
const STATUS = [['seen', 'Met'], ['tricky', 'Tricky'], ['due', 'Due'], ['mastered', 'Mastered']];

export function render() {
  const st = getState();
  let kind = 'all', status = 'seen', q = '';
  const grid = h('div', { class: 'spell-grid' });
  const count = h('div', { class: 'small muted' });
  const kindSeg = h('div', { class: 'seg' });
  const statusSeg = h('div', { class: 'seg' });
  const met = [...items.values()].filter((it) => st.progress[it.id] && st.progress[it.id].st !== 'new');

  function draw() {
    kindSeg.replaceChildren(...KINDS.map(([k, l]) => h('button', { class: kind === k ? 'on' : '', onclick: () => { kind = k; draw(); } }, l)));
    statusSeg.replaceChildren(...STATUS.map(([k, l]) => h('button', { class: status === k ? 'on' : '', onclick: () => { status = k; draw(); } }, l)));
    const d = today();
    const list = met.filter((it) => {
      const r = st.progress[it.id];
      if (kind !== 'all' && it.kind !== kind) return false;
      if (status === 'tricky' && !(r.lapses > 0 || r.bad > r.ok * 0.4)) return false;
      if (status === 'due' && !(r.st === 'review' && r.due <= d)) return false;
      if (status === 'mastered' && mastery(r) < 4) return false;
      if (q && !`${it.ko} ${it.en} ${romanize(it.ko)}`.toLowerCase().includes(q)) return false;
      return true;
    });
    count.textContent = `${list.length} of ${met.length}`;
    grid.replaceChildren(...list.map((it) => h('button', { class: 'spell', onclick: () => detail(it) },
      svg(moon(mastery(st.progress[it.id]), 18)), h('span', { class: 'ko' }, it.kind === 'gram' ? it.title : it.batchim ? it.say : it.ko), h('span', { class: 'en' }, it.en))));
    if (!list.length) grid.append(h('p', { class: 'muted' }, met.length ? 'Nothing matches.' : 'Your spellbook fills up as you learn. Start a lesson and come back.'));
  }
  draw();
  return h('div', { class: 'stack' },
    h('div', null, h('div', { class: 'eyebrow' }, '단어장 · Spellbook'), h('h1', null, 'Every spell you’ve met')),
    h('div', { class: 'search' }, svg(icon('search', 18)), h('input', { type: 'text', placeholder: 'Search Korean, English or romanization', oninput: (e) => { q = e.target.value.trim().toLowerCase(); draw(); } })),
    h('div', { class: 'row' }, kindSeg, statusSeg, h('span', { class: 'spacer' }), count),
    h('div', { class: 'row small muted' }, ...[0, 1, 2, 3, 4].map((m) => h('span', { class: 'row', style: { gap: '4px' } }, svg(moon(m, 14)), MASTERY_LABEL[m]))),
    grid,
    met.some((it) => st.progress[it.id].lapses > 0) ? h('a', { class: 'btn ghost', href: '#/study/tricky' }, 'Practise my tricky words') : null);
}

function detail(it) {
  const st = getState();
  const r = st.progress[it.id];
  const ch = chapterOf(it.chapter);
  const ko = it.kind === 'letter' ? it.say : it.ko;
  const days = r.st === 'review' ? r.due - today() : null;
  modal({
    title: null, wide: true,
    body: h('div', { class: 'stack center' },
      h('div', { class: 'big-ko ko', style: { fontSize: '3rem' } }, it.kind === 'gram' ? it.title : it.batchim ? it.say : it.ko),
      it.kind !== 'gram' ? h('div', { class: 'muted' }, romanize(ko)) : null,
      it.kind === 'word' || it.kind === 'phrase' ? pronLine(it.ko, it.pron) : null,
      h('div', { style: { fontFamily: 'var(--f-display)', fontSize: '1.5rem' } }, it.en),
      it.kind !== 'gram' ? h('div', { class: 'row', style: { justifyContent: 'center' } }, speakBtn(ko, { big: true }), slowBtn(ko)) : null,
      it.hint ? h('p', { class: 'muted' }, it.hint) : null,
      it.ex ? h('div', { class: 'row', style: { justifyContent: 'center' } }, h('span', { class: 'ko' }, it.ex.ko), speakBtn(it.ex.ko), h('span', { class: 'muted' }, it.ex.en)) : null,
      it.kind === 'gram' ? h('ul', { style: { textAlign: 'left' } }, it.explain.map((t) => h('li', null, t))) : null,
      h('div', { class: 'small muted' }, `${MASTERY_LABEL[mastery(r)]} · from ${ch?.title.en || ''} · seen ${r.ok + r.bad} times, ${r.ok} right`,
        days != null ? ` · next review ${days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}` : '')),
    actions: [{ label: 'Close', value: null, primary: true }],
  });
}
