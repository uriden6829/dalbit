import { h } from '../lib/dom.js';
import { getState } from '../lib/store.js';
import { planDaily, nextStep, recapAvailable, dueIds, learnedIds, streakInfo } from '../engine/plan.js';
import { levelOf, SKILLS, SKILL_LABEL } from '../engine/adapt.js';
import { episodes } from '../../content/index.js';
import { jiji, line, iconEl } from './common.js';
import { hrefFor } from './study.js';

export const title = () => 'Tonight';

function greeting() {
  const hr = new Date().getHours();
  if (hr >= 5 && hr < 11) return ['morning', '좋은 아침이에요'];
  if (hr >= 11 && hr < 17) return ['afternoon', '안녕하세요'];
  if (hr >= 17 && hr < 23) return ['evening', '좋은 저녁이에요'];
  return ['night', '늦은 밤이에요'];
}

export function render() {
  const st = getState();
  const name = st.profile.name;
  const [slot, ko] = greeting();
  const plan = planDaily(st);
  const { chapter, node } = nextStep(st);
  const recap = recapAvailable(st);
  const due = dueIds(st).length;
  const learned = learnedIds(st).length;
  const { streak } = streakInfo(st);
  const nodeLabel = { lesson: node.lesson?.title.en, story: episodes.get(node.id)?.title.en, speak: 'Speaking practice', exam: 'Chapter exam' }[node.type];

  const hero = h('section', { class: 'card night hero' },
    h('div', { class: 'stack' },
      h('div', { class: 'eyebrow' }, new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })),
      h('h1', null, h('span', { class: 'ko-serif' }, ko), name ? `, ${name}` : ''),
      h('p', { class: 'muted', style: { margin: 0 } }, line(slot, { name, comma: name ? ', ' : '' })),
      h('div', { class: 'plan' },
        h('div', { class: 'plan-row' }, h('span', { class: 'n' }, String(plan.reviews.length)), h('span', null, plan.reviews.length === 1 ? 'word to review' : 'words to review', plan.dueTotal > plan.reviews.length ? ` (of ${plan.dueTotal} due)` : '')),
        h('div', { class: 'plan-row' }, h('span', { class: 'n' }, String(plan.newIds.length)), h('span', null, 'new from ', h('span', { class: 'ko' }, chapter.title.ko), ` · ${chapter.title.en}`)),
        h('div', { class: 'plan-row' }, h('span', { class: 'n' }, `~${Math.max(plan.minutes, plan.reviews.length + plan.newIds.length ? 3 : 0)}`), h('span', null, 'minutes'))),
      h('div', { class: 'row' },
        h('a', { class: 'btn gold big', href: '#/study/daily' }, iconEl('moon', 18), 'Begin tonight’s study'),
        h('a', { class: 'btn ghost', href: hrefFor(node, chapter) }, `Continue: ${nodeLabel}`))),
    jiji(recap ? 'think' : 'idle', 150));

  const tiles = [
    tile(hrefFor(node, chapter), 'book', `${chapter.title.en}`, `Next: ${nodeLabel}`),
    tile('#/study/review', 'refresh', 'Review', due ? `${due} waiting · keep old spells bright` : 'All caught up · extra practice'),
    tile('#/stories', 'story', 'Stories', 'Read the academy’s episodes'),
    tile('#/speak', 'mic', 'Speaking', 'Shadow lines and real-life phrases'),
    tile('#/spellbook', 'spell', 'Spellbook', `${learned} learned · search and listen`),
    tile('#/ask', 'chat', 'Ask Jiji', 'Questions, requests, conversation'),
  ];

  const level = st.placement ? levelOf(st.placement.theta) : null;
  return h('div', { class: 'stack' },
    hero,
    recap ? h('a', { class: 'card tile', href: '#/study/recap', style: { borderColor: 'var(--gold)', boxShadow: '0 0 0 3px var(--gold-soft)', alignItems: 'center' } },
      jiji('think', 60), h('div', { class: 'spacer' }, h('div', { class: 'eyebrow' }, 'Recap night'), h('h3', null, 'Moonlight Recap is ready'), h('p', null, line('recap'))),
      h('span', { class: 'btn primary' }, 'Open the old pages')) : null,
    !st.placement && !learned ? h('div', { class: 'card row' }, iconEl('flag', 22), h('div', { class: 'spacer' }, h('b', null, 'Know some Korean already?'), h('div', { class: 'small muted' }, 'The entrance exam finds your level so you don’t repeat what you know.')), h('a', { class: 'btn ghost', href: '#/placement' }, 'Take the exam')) : null,
    h('div', { class: 'grid three' }, tiles),
    h('div', { class: 'grid two' },
      h('div', { class: 'card' }, h('h3', null, 'This month'), h('p', { class: 'small muted' }, streak > 1 ? `${streak} evenings in a row.` : 'Each lit moon is an evening you studied.'), month(st)),
      skillsCard(st, learned, level)));
}

function skillsCard(st, learned, level) {
  const rows = SKILLS.filter((k) => st.skills[k] || st.placement?.skills?.[k] != null).map((k) => {
    const th = st.skills[k]?.theta ?? st.placement.skills[k];
    const pct = Math.round(Math.max(4, Math.min(100, ((th + 3.5) / 7) * 100)));
    return h('div', { class: 'skill-bar' }, h('span', null, SKILL_LABEL[k]), h('div', { class: 'bar' }, h('i', { style: { width: `${pct}%` } })), h('span', { class: 'small muted' }, levelOf(th).label.replace(/ \(.*/, '')));
  });
  return h('div', { class: 'card stack' }, h('h3', null, 'Your magic'),
    h('div', { class: 'row' }, h('span', { style: { fontFamily: 'var(--f-display)', fontSize: '2.4rem', color: 'var(--gold)', fontVariantNumeric: 'lining-nums' } }, String(learned)), h('span', { class: 'muted' }, 'letters, words and phrases learned')),
    level ? h('div', { class: 'small' }, 'Entrance exam: ', h('b', null, level.label)) : null,
    rows.length ? h('div', { class: 'skill-bars' }, rows) : h('p', { class: 'small muted' }, 'Skill estimates appear as you practise. They keep adjusting to how you do.'));
}

function tile(href, ic, titleText, sub, highlight = false) {
  return h('a', { class: 'card tile', href, style: highlight ? { borderColor: 'var(--gold)', boxShadow: '0 0 0 3px var(--gold-soft)' } : null },
    h('div', { class: 'ic' }, iconEl(ic, 22)), h('div', null, h('h3', null, titleText), h('p', null, sub)));
}

function month(st) {
  const now = new Date(Date.now() - 4 * 3600000);
  const y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(h('div'));
  for (let d = 1; d <= days; d++) {
    const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(h('div', { class: `d ${st.log[k]?.ex ? 'on' : ''} ${d === now.getDate() ? 'today' : ''}`, title: st.log[k]?.ex ? `${st.log[k].ex} exercises` : '' }, String(d)));
  }
  return h('div', { class: 'month' }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => h('div', { class: 'd' }, d)), cells);
}
