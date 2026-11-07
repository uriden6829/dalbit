// Word tools that work on ANY Korean text in the app, without screens doing anything special:
//   Hold Shift (or lock it on Jiji's corner)  -> breakdown: hovering highlights the word (and the phrase it
//                                                belongs to) and shows its meaning and parts; click = hear it.
//   Ctrl+click a word, or click while the word picker is on -> save it to the word bank.
// Words are found under the mouse with the caret-from-point API, so plain text, buttons and bubbles all work.
import { h, toast } from '../lib/dom.js';
import { speak } from '../lib/speech.js';
import { emit, on } from '../lib/bus.js';
import { addToBank, inBank } from '../lib/wordbank.js';

let dict = null;
const loadDict = () => (dict ||= import('../lib/dictionary.js'));

const mode = { shift: false, lock: false, pick: false, ctrl: false };
export const wordMode = () => ({ ...mode });
export function setWordMode(k, v) { mode[k] = v; refresh(); emit('wordmode', wordMode()); }
const breakdownOn = () => mode.shift || mode.lock;

let hl = null, tip = null, cur = null, lastXY = null, showTok = 0;

function wordAt(x, y) {
  let node, offset;
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); node = p?.offsetNode; offset = p?.offset; }
  else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); node = r?.startContainer; offset = r?.startOffset; }
  if (!node || node.nodeType !== 3 || node.parentElement?.closest('.wt-tip, input, textarea, [contenteditable]')) return null;
  const text = node.data;
  const isW = (c) => c && /[가-힣0-9]/.test(c);
  let s = offset, e = offset;
  if (!isW(text[s]) && isW(text[s - 1])) s = e = offset - 1;
  if (!isW(text[s])) return null;
  while (s > 0 && /[^\s.,!?…~"“”'‘’()「」『』:;·—–]/.test(text[s - 1])) s--;
  while (e < text.length && /[^\s.,!?…~"“”'‘’()「」『』:;·—–]/.test(text[e])) e++;
  const word = text.slice(s, e);
  if (!/[가-힣]/.test(word)) return null;
  const range = document.createRange();
  range.setStart(node, s); range.setEnd(node, e);
  // caret APIs snap to the nearest text; make sure the pointer is really over the word.
  const hit = [...range.getClientRects()].some((r) => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 3 && y <= r.bottom + 3);
  if (!hit) return null;
  const holder = node.parentElement.closest('[data-ko]') || node.parentElement;
  const enEl = node.parentElement.closest('[data-en]');
  return { node, start: s, end: e, word, range, sentence: text, ctx: holder.dataset?.ko || text.trim(), ctxEn: enEl?.dataset.en || '' };
}

function ensureEls() {
  if (hl) return;
  hl = h('div', { class: 'wt-hl', 'aria-hidden': 'true' });
  tip = h('div', { class: 'wt-tip', role: 'tooltip' });
  document.body.append(hl, tip);
}
function clear() { cur = null; if (hl) { hl.replaceChildren(); tip.classList.remove('show'); } }

async function show(w, x, y) {
  ensureEls();
  const tok = ++showTok;
  const D = await loadDict();
  const a = D.analyzeWord(w.word);
  const expr = D.expressionAt(w.sentence, w.start);
  if (tok !== showTok) return;
  cur = { ...w, a };
  // highlights: the phrase segment (soft) and the word (strong)
  const boxes = [];
  if (expr && expr.start !== undefined && expr.end <= w.sentence.length) {
    const r = document.createRange();
    r.setStart(w.node, expr.start); r.setEnd(w.node, expr.end);
    for (const b of r.getClientRects()) boxes.push(h('i', { class: 'seg', style: box(b) }));
  }
  for (const b of w.range.getClientRects()) boxes.push(h('i', { class: 'word', style: box(b) }));
  hl.replaceChildren(...boxes);
  const saved = inBank(a?.lemma || w.word);
  tip.replaceChildren(...[
    h('div', { class: 'wt-head' }, h('b', { class: 'ko' }, a?.lemma || w.word), a ? h('span', { class: 'wt-en' }, a.en) : h('span', { class: 'wt-en muted' }, 'not in Jiji’s dictionary yet')),
    a?.parts?.length ? h('div', { class: 'wt-parts' }, h('span', { class: 'chip-ko ko' }, w.word.replace(/[^가-힣0-9]/g, '')), ' = ', h('span', { class: 'ko' }, a.lemma), ...a.parts.flatMap((p) => [' + ', h('span', { class: 'part' }, h('b', { class: 'ko' }, p.ko), ' ', p.en)])) : null,
    a?.alt?.length ? h('div', { class: 'wt-alt small muted' }, 'or: ', a.alt.map((x) => `${x.lemma} (${x.en})`).join(', ')) : null,
    expr ? h('div', { class: 'wt-expr' }, h('span', { class: 'ko' }, expr.ko), ' — ', expr.en) : null,
    w.ctxEn && w.ctx.length > w.word.length + 2 ? h('div', { class: 'wt-ctx small muted' }, w.ctxEn) : null,
    h('div', { class: 'wt-keys small' }, 'Click: hear it · Ctrl+click: ', saved ? 'already in your word bank ✓' : 'save to word bank')].filter(Boolean));
  place(w.range.getBoundingClientRect());
  tip.classList.add('show');
}
const box = (b) => ({ left: `${b.left - 2}px`, top: `${b.top - 1}px`, width: `${b.width + 4}px`, height: `${b.height + 2}px` });
function place(r) {
  const tw = Math.min(340, innerWidth - 16);
  tip.style.maxWidth = `${tw}px`;
  const left = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
  tip.style.left = `${left}px`;
  const below = r.bottom + 10;
  tip.style.top = below + 150 > innerHeight ? 'auto' : `${below}px`;
  tip.style.bottom = below + 150 > innerHeight ? `${innerHeight - r.top + 10}px` : 'auto';
}

let raf = 0;
function onMove(e) {
  lastXY = [e.clientX, e.clientY];
  if (!breakdownOn() && !mode.pick && !(e.ctrlKey || e.metaKey)) { if (cur) clear(); return; }
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const w = wordAt(lastXY[0], lastXY[1]);
    if (!w) { clear(); return; }
    if (cur && cur.node === w.node && cur.start === w.start) return;
    if (breakdownOn()) show(w, ...lastXY);
    else { ensureEls(); cur = w; hl.replaceChildren(...[...w.range.getClientRects()].map((b) => h('i', { class: 'word pick', style: box(b) }))); tip.classList.remove('show'); }
  });
}
function refresh() {
  document.body.classList.toggle('wt-breakdown', breakdownOn());
  document.body.classList.toggle('wt-picking', mode.pick);
  if (!breakdownOn() && !mode.pick) clear();
  else if (lastXY) onMove({ clientX: lastXY[0], clientY: lastXY[1], ctrlKey: mode.ctrl });
}

async function save(w) {
  const D = await loadDict();
  const a = D.analyzeWord(w.word);
  const r = addToBank({ surface: w.word.replace(/[^가-힣0-9]/g, ''), a, ctx: w.ctx, ctxEn: w.ctxEn });
  toast(r.dup ? `${r.ko} is already in your word bank` : `Saved ${r.ko}${a ? ` (${a.en})` : ''} to your word bank`);
  if (hl) for (const i of hl.children) i.classList.add('saved');
}

function onClickCapture(e) {
  const want = e.ctrlKey || e.metaKey || mode.pick || breakdownOn();
  if (!want || e.button !== 0) return;
  const w = wordAt(e.clientX, e.clientY);
  if (!w) return;
  e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  if (e.ctrlKey || e.metaKey || mode.pick) save(w);
  else speak(w.word.replace(/[^가-힣0-9\s]/g, ''), {});
}

export function initWordTools() {
  addEventListener('mousemove', onMove, { passive: true });
  addEventListener('click', onClickCapture, true);
  // Shift+click would start a text selection; stop that over Korean words.
  addEventListener('mousedown', (e) => { if ((breakdownOn() || e.ctrlKey || mode.pick) && wordAt(e.clientX, e.clientY)) e.preventDefault(); }, true);
  addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'Shift' && !mode.shift) { mode.shift = true; refresh(); }
    if (e.key === 'Control' || e.key === 'Meta') { mode.ctrl = true; }
    if (e.key === 'Escape' && (mode.pick || mode.lock)) { mode.pick = false; mode.lock = false; refresh(); emit('wordmode', wordMode()); }
  });
  addEventListener('keyup', (e) => {
    if (e.key === 'Shift') { mode.shift = false; refresh(); }
    if (e.key === 'Control' || e.key === 'Meta') { mode.ctrl = false; if (!breakdownOn() && !mode.pick) clear(); }
  });
  addEventListener('blur', () => { mode.shift = false; mode.ctrl = false; refresh(); });
  addEventListener('scroll', () => { if (cur) clear(); }, { passive: true, capture: true });
  on('route', () => clear());
}
