import { h, svg } from '../lib/dom.js';
import { speak } from '../lib/speech.js';
import { icon, moon } from '../art/icons.js';
import { jijiSVG } from '../art/jiji.js';
import { romanize, pronounce } from '../lib/hangul.js';
import { pick } from '../lib/rand.js';
import LINES from '../../content/jiji-lines.js';

export function speakBtn(text, { big = false, rate = 1, label = 'Listen' } = {}) {
  const b = h('button', { class: `speak-btn ${big ? 'big' : ''}`, title: label, 'aria-label': label, type: 'button' });
  b.append(svg(icon('sound', big ? 28 : 18)));
  b.addEventListener('click', async (e) => {
    e.stopPropagation();
    b.classList.add('playing');
    await speak(text, { rate });
    b.classList.remove('playing');
  });
  return b;
}
export function slowBtn(text) {
  const b = speakBtn(text, { rate: 0.7, label: 'Listen slowly' });
  b.replaceChildren(svg(icon('slow', 18)));
  return b;
}

export function jiji(mood = 'idle', size = 96) { return svg(jijiSVG(mood, { size })); }

// Jiji with a speech bubble. `text` may be a node or string; lines are picked from content/jiji-lines.js.
export function jijiSays(text, { mood = 'idle', size = 84 } = {}) {
  return h('div', { class: 'jiji-says' }, jiji(mood, size), h('div', { class: 'bubble' }, text));
}
export function line(key, vars = {}) {
  const pool = LINES[key] || [''];
  return pick(pool).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function romanLine(ko, show, pron) {
  if (!show) return null;
  return h('div', { class: 'roman' }, romanize(ko, { pron }));
}
export function pronLine(ko, override) {
  const p = override || pronounce(ko);
  if (!p || p.replace(/\s/g, '') === ko.replace(/\s/g, '')) return null;
  return h('div', { class: 'pron' }, `sounds like [${p}]`);
}

export function moonEl(level, size = 18, title = '') { return svg(moon(level, size, title)); }
export function iconEl(name, size = 20) { return svg(icon(name, size)); }

export function backLink(href, label = 'Back') {
  return h('a', { href, class: 'btn ghost small' }, iconEl('back', 16), label);
}

export function koText(text, cls = '') { return h('span', { class: `ko ${cls}` }, text); }
