import { h, modal } from '../lib/dom.js';
import { getState } from '../lib/store.js';
import { mastery } from '../lib/srs.js';
import { courseChapters, chapters, chapterOf, items, episodes } from '../../content/index.js';
import { chapterUnlocked, chapterNodes, chapterState, nextStep, lessonStats } from '../engine/plan.js';
import { levelOf } from '../engine/adapt.js';
import { moonEl, iconEl, speakBtn, backLink } from './common.js';
import { hrefFor } from './study.js';

export const title = (p) => (p[0] ? chapterOf(p[0])?.title.en || 'Chapter' : 'Course');

export function render({ name, params }) {
  return name === 'chapter' ? chapterView(params[0]) : courseView();
}

function chapterMoon(st, ch) {
  const ids = ch.lessons.flatMap((l) => l.items);
  const avg = ids.reduce((s, id) => s + mastery(st.progress[id]), 0) / Math.max(1, ids.length);
  return Math.min(4, Math.floor(avg + 0.25));
}

function courseView() {
  const st = getState();
  const { chapter: cur } = nextStep(st);
  const list = courseChapters();
  const extras = chapters.filter((c) => c.extra);
  const lvl = st.placement ? levelOf(st.placement.theta) : null;
  return h('div', { class: 'stack' },
    h('div', null, h('div', { class: 'eyebrow' }, '수업 · Course'), h('h1', null, 'The academy’s curriculum')),
    h('p', { class: 'muted' }, 'Each chapter is a real-life situation. Learn the words, read the story, speak the lines, then pass the exam (80%) to open the next one.',
      lvl ? ` Your entrance exam placed you at: ${lvl.label}.` : ''),
    ...list.map((ch, i) => {
      const open = chapterUnlocked(st, ch);
      const cs = chapterState(st, ch);
      const status = cs.passed ? 'Cleared' : cs.testedOut ? 'Placed out — reviewing' : ch === cur ? 'In progress' : open ? 'Open' : 'Locked';
      return h('a', { class: `card chapter-card ${open ? 'tile' : 'locked'}`, href: open ? `#/chapter/${ch.id}` : null, style: ch === cur ? { borderColor: 'var(--gold)' } : null },
        h('div', { class: 'num' }, h('small', null, ch.id === 'h0' ? 'start' : 'chapter'), ch.id === 'h0' ? 'ㄱ' : String(i)),
        h('div', null, h('h3', null, ch.title.en), h('div', { class: 'ko-title' }, ch.title.ko), h('div', { class: 'small muted' }, status)),
        open ? moonEl(chapterMoon(st, ch), 30, 'Chapter mastery') : iconEl('lock', 20));
    }),
    extras.length ? h('div', { class: 'stack' }, h('h2', null, 'Made for you'), h('p', { class: 'muted small' }, 'Lessons Jiji made from your requests.'),
      ...extras.map((ch) => h('a', { class: 'card chapter-card tile', href: `#/chapter/${ch.id}` },
        h('div', { class: 'num' }, h('small', null, 'request'), '✦'),
        h('div', null, h('h3', null, ch.title.en), h('div', { class: 'ko-title' }, ch.title.ko)), moonEl(chapterMoon(st, ch), 30)))) : null);
}

function chapterView(id) {
  const st = getState();
  const ch = chapterOf(id);
  if (!ch) return h('p', null, 'Chapter not found.');
  if (!chapterUnlocked(st, ch)) return h('div', { class: 'card stack' }, h('h2', null, 'Locked'), h('p', null, 'Pass the previous chapter’s exam to open this one.'), backLink('#/course'));
  const all = chapterNodes(st, ch);
  const ls = all.filter((n) => n.type === 'lesson');
  // Same order as nextStep(): first lesson, then the story, then the remaining lessons, speaking, exam.
  const nodes = [...ls.slice(0, 1), ...all.filter((n) => n.type === 'story' || n.type === 'reading'), ...ls.slice(1), ...all.filter((n) => n.type === 'speak' || n.type === 'exam')];
  const nextNode = nodes.find((n) => !n.done);
  const cs = chapterState(st, ch);
  return h('div', { class: 'stack' },
    backLink('#/course', 'Course'),
    h('div', null, h('div', { class: 'eyebrow' }, ch.extra ? 'Made for you' : ch.id === 'h0' ? 'Foundations' : `Chapter ${courseChapters().indexOf(ch)}`),
      h('h1', null, ch.title.en), h('div', { class: 'ko-serif', style: { fontSize: '1.4rem', color: 'var(--ink-2)' } }, ch.title.ko)),
    h('p', { class: 'muted' }, ch.blurb || ''),
    cs.testedOut && !cs.passed ? h('div', { class: 'card flat small' }, 'The entrance exam says you know this chapter. Its words are in your reviews to make sure — or take the exam to clear it properly.') : null,
    h('div', { class: 'path' }, nodes.map((n) => node(st, ch, n, n === nextNode))));
}

function node(st, ch, n, isNext) {
  let ic, title, sub, right = null;
  if (n.type === 'lesson') {
    const s = lessonStats(st, n.lesson);
    ic = moonEl(s.moon, 26);
    title = n.lesson.title.en;
    sub = h('span', null, h('span', { class: 'ko' }, n.lesson.title.ko), ` · ${s.learned}/${s.total} learned`, s.done ? ' · practise again any time' : '');
    right = h('button', { class: 'btn ghost small', onclick: (e) => { e.preventDefault(); e.stopPropagation(); preview(n.lesson); } }, 'Words');
  } else if (n.type === 'story') {
    const ep = episodes.get(n.id);
    ic = iconEl('story', 20); title = `Story: ${ep.title.en}`; sub = h('span', { class: 'ko' }, ep.title.ko);
  } else if (n.type === 'reading') {
    ic = iconEl('book', 20); title = 'Real Korean reading'; sub = ch.reading.source ? `Based on ${ch.reading.source}` : 'A short reading made for you';
  } else if (n.type === 'speak') {
    ic = iconEl('mic', 20); title = 'Speaking practice'; sub = 'Shadow the chapter’s phrases out loud';
  } else {
    ic = iconEl('flag', 20); title = 'Chapter exam'; sub = n.score != null ? `Best: ${Math.round(n.score * 100)}% · pass at 80%` : 'Pass at 80% to open the next chapter';
  }
  return h('a', { class: `node ${n.done ? 'done' : ''} ${isNext ? 'next' : ''}`, href: hrefFor(n, ch) },
    h('div', { class: 'ic' }, n.done && n.type !== 'lesson' ? iconEl('check', 20) : ic),
    h('div', null, h('b', null, title), h('div', { class: 'sub' }, sub)),
    right || (isNext ? h('span', { class: 'pill' }, 'next') : iconEl('arrow', 18)));
}

function preview(L) {
  const st = getState();
  modal({
    title: L.title.en, wide: true,
    body: h('div', { class: 'wordlist' }, L.items.map((id) => {
      const it = items.get(id);
      return h('div', { class: 'wordrow' }, moonEl(mastery(st.progress[id])),
        h('span', { class: 'ko' }, it.kind === 'gram' ? it.title : it.batchim ? it.say : it.ko),
        h('span', { class: 'en' }, it.en), it.kind !== 'gram' ? speakBtn(it.kind === 'letter' ? it.say : it.ko) : null);
    })),
    actions: [{ label: 'Close', value: null }, { label: 'Practise', value: true, primary: true }],
  }).then((v) => { if (v) location.hash = `#/study/lesson/${L.id}`; });
}
