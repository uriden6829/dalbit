import { h, svg, $, modal } from './lib/dom.js';
import { loadState, getState, update, save } from './lib/store.js';
import { initSpeech, speechPrefsFrom } from './lib/speech.js';
import { icon } from './art/icons.js';
import { jijiSVG } from './art/jiji.js';
import { VERSION, CHANGELOG } from './version.js';
import { registerPack } from '../content/index.js';
import { streakInfo } from './engine/plan.js';
import { emit } from './lib/bus.js';
import { initBgm } from './lib/bgm.js';
import { initCompanion } from './ui/companion.js';
import { initWordTools } from './ui/wordtools.js';

const SCREENS = {
  home: () => import('./ui/home.js'),
  welcome: () => import('./ui/welcome.js'),
  placement: () => import('./ui/placement.js'),
  course: () => import('./ui/course.js'),
  chapter: () => import('./ui/course.js'),
  study: () => import('./ui/study.js'),
  stories: () => import('./ui/stories.js'),
  story: () => import('./ui/stories.js'),
  speak: () => import('./ui/speak.js'),
  spellbook: () => import('./ui/spellbook.js'),
  wordbank: () => import('./ui/wordbank.js'),
  ask: () => import('./ui/ask.js'),
  read: () => import('./ui/read.js'),
  settings: () => import('./ui/settings.js'),
};
const FOCUS = new Set(['welcome', 'placement', 'study']);
const NAV = [
  ['home', 'home', 'Tonight', '오늘'],
  ['course', 'book', 'Course', '수업'],
  ['stories', 'story', 'Stories', '이야기'],
  ['speak', 'mic', 'Speaking', '말하기'],
  ['spellbook', 'spell', 'Spellbook', '단어장'],
  ['wordbank', 'star', 'Word bank', '내 단어'],
  ['ask', 'chat', 'Ask Jiji', '질문'],
  ['settings', 'gear', 'Settings', '설정'],
];

let leaveFns = [];
export const onLeave = (fn) => leaveFns.push(fn);
export const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

function applyTheme() {
  const t = getState().settings.theme;
  document.documentElement.dataset.theme = t === 'auto' ? '' : t;
  if (t === 'auto') delete document.documentElement.dataset.theme;
}
export { applyTheme };

function shell(name, content) {
  const st = getState();
  const { streak } = streakInfo(st);
  const nav = NAV.map(([key, ic, label, ko]) =>
    h('a', { href: `#/${key}`, class: key === name || (name === 'chapter' && key === 'course') || (name === 'story' && key === 'stories') ? 'on' : '' },
      svg(icon(ic, 20)), label, h('span', { class: 'ko-sub' }, ko)));
  const tabs = NAV.filter(([k]) => k !== 'settings' && k !== 'ask').map(([key, ic, label]) =>
    h('a', { href: `#/${key}`, class: key === name ? 'on' : '' }, svg(icon(ic, 22)), label));
  return h('div', { class: 'shell' },
    h('aside', { class: 'side' },
      h('a', { class: 'brand', href: '#/home' }, svg(brandMark(), 'mark'), h('div', null, h('b', null, '달빛'), h('span', null, 'Moonlight Korean'))),
      h('nav', { class: 'nav' }, nav),
      h('div', { class: 'side-foot' },
        svg(jijiSVG('sleepy', { size: 64 })),
        h('div', { class: 'center' }, streak > 1 ? `${streak} nights in a row` : 'Every night counts'))),
    h('div', null,
      h('header', { class: 'topbar' }, svg(brandMark(), 'mark'), h('b', null, '달빛'), h('span', null, 'Moonlight Korean'), h('span', { class: 'spacer' }),
        h('a', { href: '#/ask', style: { color: 'inherit' }, 'aria-label': 'Ask Jiji' }, svg(icon('chat', 22))),
        h('a', { href: '#/settings', style: { color: 'inherit' }, 'aria-label': 'Settings' }, svg(icon('gear', 22)))),
      h('main', { class: 'main' }, h('div', { class: 'page' }, content))),
    h('nav', { class: 'tabbar' }, tabs));
}

export function brandMark() {
  return `<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#2e2f63"/><path d="M27 26.5A10 10 0 1 1 16.5 11a8 8 0 0 0 10.5 15.5z" fill="#e7c66f"/><circle cx="29" cy="11" r="1.2" fill="#f6ecc9"/><circle cx="33" cy="17" r=".8" fill="#f6ecc9"/></svg>`;
}

let routing = 0;
async function route() {
  const token = ++routing;
  for (const fn of leaveFns) { try { fn(); } catch { /* ignore */ } }
  leaveFns = [];
  const st = getState();
  let [name, ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (!name) name = 'home';
  if (!st.profile.onboarded && !['welcome', 'placement', 'study', 'story'].includes(name)) { location.hash = '#/welcome'; return; }
  if (!SCREENS[name]) name = 'home';
  const app = $('#app');
  try {
    const mod = await SCREENS[name]();
    if (token !== routing) return;
    const node = await mod.render({ name, params }, { go, onLeave });
    if (token !== routing) return;
    app.replaceChildren(FOCUS.has(name) ? node : shell(name, node));
    emit('route', name);
    window.scrollTo(0, 0);
    document.title = `${mod.title?.(params) || 'Dalbit'} · 달빛`;
  } catch (err) {
    console.error(err);
    app.replaceChildren(shell(name, h('div', { class: 'card' }, h('h2', null, 'Something went wrong'),
      h('p', { class: 'muted' }, String(err?.message || err)), h('a', { class: 'btn', href: '#/home' }, 'Back home'))));
    reportError(err);
  }
}

function reportError(err) {
  let el = $('#__errors');
  if (!el) { el = h('div', { id: '__errors', class: 'hidden' }); document.body.append(el); }
  el.append(h('div', null, String(err?.stack || err)));
}
addEventListener('error', (e) => reportError(e.error || e.message));
addEventListener('unhandledrejection', (e) => reportError(e.reason));

const newer = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
};
async function whatsNew() {
  const st = getState();
  if (!st.profile.onboarded || st.meta.lastVersion === VERSION) return;
  const prev = st.meta.lastVersion;
  update((s) => { s.meta.lastVersion = VERSION; });
  if (!prev) return;
  const fresh = CHANGELOG.filter((c) => newer(c.version, prev)).slice(0, 5);
  if (!fresh.length) return;
  modal({
    title: 'Something new arrived',
    body: h('div', { class: 'stack' }, h('div', { class: 'jiji-says' }, svg(jijiSVG('happy', { size: 70 })),
      h('p', null, 'A delivery came by owl while you were away.')),
    ...fresh.map((c) => h('div', null, h('b', null, `v${c.version}`), h('ul', null, c.notes.map((n) => h('li', null, n)))))),
  });
}

async function boot() {
  const st = await loadState();
  if (new URLSearchParams(location.search).has('demo')) (await import('./dev.js')).seedDemo();
  applyTheme();
  initSpeech(speechPrefsFrom(st.settings));
  for (const p of Object.values(st.packs || {})) { try { registerPack(p); } catch (e) { console.warn('pack skipped', e); } }
  initBgm();
  initCompanion();
  initWordTools();
  addEventListener('hashchange', route);
  await route();
  whatsNew();
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !new URLSearchParams(location.search).has('nosw')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  save();
}
boot();
