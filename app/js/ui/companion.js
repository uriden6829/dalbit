// Jiji in the corner: keeps her company on every screen, reacts to answers, dozes off when she pauses,
// and holds the word tools (word picker, breakdown lock, slow voice, music).
import { h, svg } from '../lib/dom.js';
import { getState, update } from '../lib/store.js';
import { on } from '../lib/bus.js';
import { jijiSVG } from '../art/jiji.js';
import { icon } from '../art/icons.js';
import { setSpeechPrefs, speechPrefsFrom } from '../lib/speech.js';
import { BGM_LIST, bgmRefresh } from '../lib/bgm.js';
import { wordMode, setWordMode } from './wordtools.js';
import { pick } from '../lib/rand.js';
import LINES from '../../content/jiji-lines.js';

const PET = ['Mrrr.', '…Fine. One more scratch.', '고마워요. Now, back to work.', 'Purring is not a sign of approval. (It is.)', 'I was guarding your words.'];
const IDLE = ['Still here.', 'Take your time. I have nine lives.', 'Hold Shift over any Korean word — I’ll explain it.', 'Ctrl+click a word to keep it in your word bank.'];
const LISTEN = ['Ears up.', 'Shh. Listen.'];

let root, cat, bubble, tools, mood = 'idle', moodTimer = 0, bubbleTimer = 0, idleTimer = 0, sleeping = false;

function setMood(m, ms = 2600) {
  clearTimeout(moodTimer);
  draw(m);
  if (ms) moodTimer = setTimeout(() => draw(sleeping ? 'sleepy' : 'idle'), ms);
}
function draw(m) {
  if (!cat || m === mood) return;
  mood = m;
  cat.replaceChildren(svg(jijiSVG(m, { size: 76, label: '지지' })));
  cat.classList.remove('hop'); void cat.offsetWidth;
  if (m === 'happy') cat.classList.add('hop');
}
function say(text, ms = 3200) {
  if (!bubble) return;
  clearTimeout(bubbleTimer);
  bubble.textContent = text;
  bubble.classList.add('show');
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
}
function poke() {
  clearTimeout(idleTimer);
  if (sleeping) { sleeping = false; draw('idle'); }
  idleTimer = setTimeout(() => { sleeping = true; draw('sleepy'); }, 120000);
}

function toolBtn(name, label, active, onclick, glyph) {
  return h('button', { class: `cmp-tool ${active ? 'on' : ''}`, title: label, 'aria-label': label, 'aria-pressed': active ? 'true' : 'false', onclick },
    glyph ? h('span', { class: 'glyph' }, glyph) : svg(icon(name, 18)));
}

function drawTools() {
  const wm = wordMode(), s = getState().settings;
  tools.replaceChildren(
    toolBtn('flag', 'Word picker: click any Korean word to save it (or Ctrl+click anytime)', wm.pick, () => setWordMode('pick', !wm.pick), '＋'),
    toolBtn('search', 'Word breakdown: hover a word for its meaning, click to hear it (or hold Shift)', wm.lock, () => setWordMode('lock', !wm.lock)),
    toolBtn('slow', s.slowAll ? 'Slow voice is ON' : 'Slow voice', s.slowAll, () => {
      update((x) => { x.settings.slowAll = !x.settings.slowAll; });
      setSpeechPrefs(speechPrefsFrom(getState().settings));
      say(getState().settings.slowAll ? 'Slowly now. 천천히.' : 'Normal speed.');
      drawTools();
    }),
    musicBtn(s.bgm));
}

function musicBtn(b) {
  const btn = toolBtn('sound', b.on ? 'Music on — click for moods' : 'Music off', b.on, (e) => { e.stopPropagation(); menu.classList.toggle('show'); drawMenu(); }, '♪');
  const menu = h('div', { class: 'cmp-menu' });
  function drawMenu() {
    const bb = getState().settings.bgm;
    menu.replaceChildren(
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('b', null, 'Music'),
        h('button', { class: `btn small ${bb.on ? 'primary' : 'ghost'}`, onclick: () => { update((x) => { x.settings.bgm.on = !x.settings.bgm.on; }); bgmRefresh(); drawMenu(); drawTools(); } }, bb.on ? 'On' : 'Off')),
      ...BGM_LIST.map((p) => h('button', { class: `cmp-mood ${bb.preset === p.id && bb.on ? 'on' : ''}`, onclick: () => { update((x) => { x.settings.bgm.preset = p.id; x.settings.bgm.on = true; }); bgmRefresh(); drawMenu(); } },
        h('span', { class: 'ko-serif' }, p.ko), h('span', { class: 'small muted' }, p.name))),
      h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: bb.volume, 'aria-label': 'Music volume', oninput: (e) => { update((x) => { x.settings.bgm.volume = Number(e.target.value); }); bgmRefresh(); } }),
      h('div', { class: 'small muted' }, 'Quieter on its own while you listen or speak.'));
  }
  return h('div', { class: 'cmp-music' }, btn, menu);
}

function visible() { root?.classList.toggle('hidden', !getState().settings.companion); }

export function initCompanion() {
  cat = h('button', { class: 'cmp-cat', title: 'Jiji', 'aria-label': 'Jiji — pet her', onclick: () => { poke(); setMood('happy', 1800); say(pick(PET)); } });
  bubble = h('div', { class: 'cmp-bubble', role: 'status' });
  tools = h('div', { class: 'cmp-tools' });
  root = h('div', { class: 'companion' }, bubble, h('div', { class: 'cmp-row' }, tools, cat));
  document.body.append(root);
  draw('idle'); mood = 'idle'; cat.replaceChildren(svg(jijiSVG('idle', { size: 76 })));
  drawTools();
  visible();
  poke();
  document.addEventListener('click', (e) => { if (!e.target.closest('.cmp-music')) root.querySelectorAll('.cmp-menu.show').forEach((m) => m.classList.remove('show')); });
  addEventListener('pointermove', () => { if (sleeping) poke(); }, { passive: true });
  on('answer', ({ correct, graduated, skipped }) => {
    poke();
    if (skipped) return;
    if (correct) { setMood(graduated ? 'happy' : 'smug'); if (graduated || Math.random() < 0.3) say(pick(LINES[graduated ? 'graduated' : 'correct'])); }
    else { setMood('think', 3200); if (Math.random() < 0.5) say(pick(LINES.wrong), 4200); }
  });
  on('session-end', () => { setMood('happy', 4000); say(pick(LINES.done), 4500); });
  on('exercise', (ex) => { poke(); if (ex?.prompt?.audio && Math.random() < 0.15) say(pick(LISTEN), 1800); });
  on('tts', ({ on: speaking }) => cat.classList.toggle('ears', speaking));
  on('bank', ({ added, dup }) => { if (added) { setMood('happy', 1500); } else if (dup) setMood('smug', 1500); });
  on('wordmode', () => drawTools());
  on('companion', () => visible());
  on('route', (name) => {
    poke();
    root.dataset.route = name;
    if (name === 'home' && Math.random() < 0.35) setTimeout(() => say(pick(IDLE), 4200), 1500);
  });
}
