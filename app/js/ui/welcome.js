import { h, toast } from '../lib/dom.js';
import { getState, update, importBackup } from '../lib/store.js';
import { jiji } from './common.js';
import { person } from '../art/people.js';
import { svg } from '../lib/dom.js';

export const title = () => 'Welcome';

const HAIR = [['bob', 'Bob'], ['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun'], ['short', 'Short']];
const HAIR_COLORS = ['#2a201c', '#4a3226', '#7a5236', '#b08550', '#8f8d96'];
const SKIN = ['#f6dcc8', '#f0cdb4', '#ddb08f', '#b98463', '#8c5b3f'];
const COATS = ['#e9dcc4', '#6a4d74', '#4f6d8c', '#7f9a83', '#b8625b', '#2f2e48'];

export function render(_, { go }) {
  const st = getState();
  let step = 0;
  const draft = { name: st.profile.name, minutes: st.settings.minutes, look: { ...st.profile.look } };
  const root = h('div', { class: 'welcome' }, h('div', { class: 'stars' }));
  const box = h('div', { class: 'box stack' });
  root.append(box);

  const swatches = (list, key) => h('div', { class: 'row', style: { justifyContent: 'center' } }, list.map((c) =>
    h('button', { type: 'button', 'aria-label': c, onclick: () => { draft.look[key] = c; draw(); },
      style: { width: '30px', height: '30px', borderRadius: '50%', background: c, cursor: 'pointer', border: draft.look[key] === c ? '3px solid #e7c97f' : '2px solid rgba(255,255,255,.25)' } })));

  function draw() {
    box.replaceChildren();
    if (step === 0) {
      box.append(
        jiji('happy', 150),
        h('div', { class: 'ko-title' }, '달빛 학교'),
        h('h1', null, 'The Moonlight Academy'),
        h('p', null, 'A quiet place to learn Korean, one evening at a time. Every word you learn here is a small spell for real life in Korea.'),
        h('p', null, 'I’m 지지 (Jiji). I’ll be your guide.'),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn gold big', onclick: () => { step = 1; draw(); } }, 'Begin')),
        h('p', { class: 'small' }, h('label', { class: 'linkish', style: { color: '#c9c2dc' } }, 'Restore from a backup file',
          h('input', { type: 'file', accept: '.json,application/json', class: 'hidden', onchange: async (e) => {
            try { await importBackup(await e.target.files[0].text()); toast('Welcome back!'); go('#/home'); } catch (err) { toast(err.message); }
          } }))));
    } else if (step === 1) {
      const preview = h('div');
      const drawPreview = () => preview.replaceChildren(svg(`<svg viewBox="-60 -170 120 180" width="110" height="165">${person({ hair: draft.look.hair, hairColor: draft.look.hairColor, skin: draft.look.skin, top: draft.look.coat, hat: 'witch', mood: 'smile' })}</svg>`));
      drawPreview();
      box.append(
        h('h2', null, 'What should I call you?'),
        h('input', { type: 'text', value: draft.name, placeholder: 'Your name (optional)', maxlength: 30, oninput: (e) => { draft.name = e.target.value; } }),
        h('p', null, 'And how should you look in the stories?'),
        preview,
        h('div', { class: 'seg' }, HAIR.map(([k, l]) => h('button', { class: draft.look.hair === k ? 'on' : '', onclick: () => { draft.look.hair = k; draw(); } }, l))),
        swatches(HAIR_COLORS, 'hairColor'), swatches(SKIN, 'skin'), swatches(COATS, 'coat'),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', style: { color: '#efe7d6' }, onclick: () => { step = 0; draw(); } }, 'Back'),
          h('button', { class: 'btn gold', onclick: () => { step = 2; draw(); } }, 'Next')));
    } else if (step === 2) {
      box.append(
        jiji('think', 110),
        h('h2', null, 'How long is a study evening?'),
        h('p', null, 'Long enough for words to stick. Short enough to come back tomorrow. You can change this any time.'),
        h('div', { class: 'seg' }, [10, 15, 25, 40].map((m) => h('button', { class: draft.minutes === m ? 'on' : '', onclick: () => { draft.minutes = m; draw(); } }, `${m} min`))),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', style: { color: '#efe7d6' }, onclick: () => { step = 1; draw(); } }, 'Back'),
          h('button', { class: 'btn gold', onclick: () => { step = 3; draw(); } }, 'Next')));
    } else {
      const finish = (hash) => {
        update((s) => {
          s.profile.name = draft.name.trim().slice(0, 30);
          s.profile.look = draft.look;
          s.settings.minutes = draft.minutes;
          s.profile.onboarded = true;
        });
        go(hash);
      };
      box.append(
        jiji('smug', 110),
        h('h2', null, 'First, the entrance exam'),
        h('p', null, 'It adapts as you answer, usually 6–12 minutes. It only decides where you start, and you can retake it later.'),
        h('div', { class: 'choice-cards' },
          h('button', { class: 'choice-card', onclick: () => finish('#/placement') },
            h('b', null, 'Take the entrance exam'), h('span', null, 'Recommended if you know any Korean at all.')),
          h('button', { class: 'choice-card', onclick: () => finish('#/story/ep00') },
            h('b', null, 'I’m brand new'), h('span', null, 'Skip the exam and start from the very first letter.'))));
    }
  }
  draw();
  return root;
}
