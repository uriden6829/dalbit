// Story library and webtoon reader.
import { h, svg, toast } from '../lib/dom.js';
import { getState, update } from '../lib/store.js';
import { speak, stopSpeaking } from '../lib/speech.js';
import { emit } from '../lib/bus.js';
import { romanize } from '../lib/hangul.js';
import { episodes, chapters, chapterOf, items } from '../../content/index.js';
import { chapterUnlocked } from '../engine/plan.js';
import { panelSVG, speakerSide, panelHeight } from '../art/panel.js';
import { panelSVG2, speakerSide2, panelH } from '../art/toon/compose.js';
import { showRoman } from '../engine/adapt.js';
import { makeQuiz } from '../engine/exercises.js';
import { iconEl, backLink, jiji } from './common.js';
import { shuffle } from '../lib/rand.js';

export const title = (p) => (p[0] ? episodes.get(p[0])?.title.en || 'Story' : 'Stories');

export function render({ name, params }, { onLeave }) {
  onLeave(stopSpeaking);
  return name === 'story' ? reader(params[0], params[1] === 'rewind') : library();
}

function cover(ep) {
  const look = getState().profile.look;
  if (ep.panels[0]?.shot) {
    const p = ep.panels.find((x) => x.shot === 'wide' && x.cast?.length > 1) || ep.panels.find((x) => x.shot === 'establish') || ep.panels[0];
    return svg(panelSVG2({ ...p, h: 0.56, fx: (p.fx || []).filter((f) => f !== 'rays') }, { look }));
  }
  const first = ep.panels.find((p) => p.cast?.length) || ep.panels[0];
  return svg(panelSVG({ ...first, h: 'S', lines: [], note: null }, { look }));
}

function library() {
  const st = getState();
  const eps = chapters.filter((c) => c.episode).map((c) => ({ ep: episodes.get(c.episode), ch: c, open: chapterUnlocked(st, c) }));
  return h('div', { class: 'stack' },
    h('div', null, h('div', { class: 'eyebrow' }, '이야기 · Stories'), h('h1', null, 'Tales from the academy')),
    h('p', { class: 'muted' }, 'Each chapter has an episode. Tap a speech bubble to hear it; tap again for the meaning. Read them twice — the second time is where the words stick.'),
    h('div', { class: 'grid two' }, eps.map(({ ep, ch, open }) => {
      const read = st.stories[ep.id]?.read;
      return h('a', { class: `card tile ${open ? '' : 'locked'}`, href: open ? `#/story/${ep.id}` : null, style: { flexDirection: 'column', padding: '0', overflow: 'hidden', opacity: open ? 1 : 0.55 } },
        h('div', { style: { width: '100%' } }, cover(ep)),
        h('div', { style: { padding: '14px 16px' } },
          h('div', { class: 'eyebrow' }, ch.extra ? 'Made for you' : ch.title.en),
          h('h3', { class: 'ko-serif' }, ep.title.ko), h('p', null, ep.title.en),
          h('div', { class: 'small', style: { marginTop: '6px' } }, !open ? 'Locked' : read ? '✓ Read' : 'New')));
    })));
}

function reader(id, rewind) {
  const st = getState();
  const ep = episodes.get(id);
  if (!ep) return h('p', null, 'Story not found.');
  const ch = chapterOf(ep.chapter);
  let showEn = st.settings.storyEnglish, showRo = showRoman(st), slow = false;
  const vocab = chapterWords(ch);
  const panelsHost = h('div', { class: 'toon' });
  const tools = h('div', { class: 'toon-tools' });

  function drawTools() {
    tools.replaceChildren(h('div', { class: 'seg' },
      h('button', { class: showEn ? 'on' : '', onclick: () => { showEn = !showEn; update((s) => { s.settings.storyEnglish = showEn; }); draw(); } }, 'English'),
      h('button', { class: showRo ? 'on' : '', onclick: () => { showRo = !showRo; draw(); } }, 'Romanization'),
      h('button', { class: slow ? 'on' : '', title: 'Read every bubble slowly', onclick: () => { slow = !slow; drawTools(); } }, '🐢 Slow'),
      h('button', { onclick: () => readAll() }, '▶ Read aloud')));
  }

  async function readAll() {
    const bubbles = [...panelsHost.querySelectorAll('.tb[data-ko]')];
    for (const b of bubbles) {
      if (!document.body.contains(b)) return;
      b.scrollIntoView({ behavior: 'smooth', block: 'center' });
      b.classList.add('playing');
      await speak(b.dataset.ko, { who: b.dataset.who, slow });
      b.classList.remove('playing');
    }
  }

  function bubble(p, l) {
    const { side, off } = p.shot ? speakerSide2(p, l.who) : speakerSide(p, l.who);
    const cat = l.who === 'jiji';
    const hasKo = !!l.ko;
    let ko = l.ko;
    let blanked = null;
    if (rewind && hasKo) {
      const w = vocab.find((v) => ko.includes(v) && v.length >= 2);
      if (w) { blanked = w; }
    }
    const koEl = hasKo ? h('span', { class: 't-ko' }) : null;
    if (koEl) {
      if (blanked) {
        const [a, ...rest] = ko.split(blanked);
        koEl.append(a, h('span', { class: 'blank-word', title: 'Tap to reveal' }, blanked), rest.join(blanked));
      } else koEl.textContent = ko;
    }
    const en = h('span', { class: `t-en ${hasKo ? '' : 'only'} ${hasKo && !showEn ? 'hidden' : ''}` }, l.en);
    const b = h('div', { class: `tb ${side} ${off ? 'off' : ''} ${cat ? 'cat' : ''} ${hasKo ? '' : 'en-only'}`, 'data-who': l.who, 'data-ko': hasKo ? ko : null, 'data-en': l.en, title: hasKo ? 'Tap to hear · tap again for meaning' : '' },
      koEl, hasKo && showRo ? h('span', { class: 't-ro' }, romanize(ko)) : null, en);
    let taps = 0;
    b.addEventListener('click', async () => {
      if (!hasKo) return;
      taps++;
      const bw = b.querySelector('.blank-word');
      if (bw) { bw.style.color = 'inherit'; bw.style.borderColor = 'transparent'; }
      if (taps > 1) en.classList.toggle('hidden');
      b.classList.add('playing');
      await speak(ko, { who: l.who, slow: slow || !!l.slow });
      b.classList.remove('playing');
    });
    return b;
  }

  function draw() {
    drawTools();
    const look = getState().profile.look;
    panelsHost.replaceChildren(
      h('div', { class: 'toon-head' }, h('div', { class: 'eyebrow' }, rewind ? 'Rewind · fill the gaps from memory' : ch.extra ? 'Made for you' : ch.title.en),
        h('div', { class: 'ko-title' }, ep.title.ko), h('div', { class: 'muted' }, ep.title.en)),
      tools,
      ...ep.panels.flatMap((p, i) => {
        if (p.shot) return panelV2(p, i, look);
        const H = panelHeight(p);
        const layer = h('div', { class: 'layer' },
          p.note ? h('div', { class: 'note' }, p.note.ko ? h('span', { class: 'ko' }, p.note.ko, ' ') : null, p.note.en) : null,
          ...(p.lines || []).map((l) => bubble(p, l)));
        const panel = h('div', { class: 'panel', style: { aspectRatio: `360 / ${H}` } }, svg(panelSVG(p, { look })), layer);
        const signs = p.signs?.length ? h('div', { class: 'signs' }, p.signs.map(([ko, en]) =>
          h('button', { class: 'chip', title: en, onclick: (e) => { speak(ko); e.currentTarget.lastChild.textContent = ` ${en}`; } }, iconEl('eye', 14), h('span', { class: 'ko' }, ko), h('span', { class: 'small muted' }, '')))) : null;
        return signs ? [panel, signs] : [panel];
      }),
      endBlock());
  }

  // v2: caption box over the top edge, art, then the speech bubbles in the gutter below (tails point up at the panel).
  function panelV2(p, i, look) {
    const prev = ep.panels[i - 1];
    const sceneChange = !prev || prev.scene !== p.scene || p.shot === 'establish';
    const block = h('section', { class: `tp ${sceneChange && i ? 'tp-gap' : ''} tp-${p.shot}` },
      p.note ? h('div', { class: 'tp-cap', 'data-en': p.note.en }, p.note.ko ? h('span', { class: 'ko' }, p.note.ko, ' ') : null, p.note.en) : null,
      h('div', { class: 'tp-art', style: { aspectRatio: `360 / ${panelH(p)}` } }, svg(panelSVG2(p, { look }))),
      p.lines?.length ? h('div', { class: 'tp-talk' }, p.lines.map((l) => bubble(p, l))) : null,
      p.signs?.length ? h('div', { class: 'signs' }, p.signs.map(([ko, en]) =>
        h('button', { class: 'chip', title: en, onclick: (e) => { speak(ko); e.currentTarget.lastChild.textContent = ` ${en}`; } }, iconEl('eye', 14), h('span', { class: 'ko' }, ko), h('span', { class: 'small muted' }, '')))) : null);
    return [block];
  }

  function endBlock() {
    const qs = (ep.quiz || []).map((q) => makeQuiz(q));
    const box = h('div', { class: 'card stack', style: { marginTop: '12px' } }, h('h3', null, 'After the story'),
      jiji('smug', 70));
    let right = 0, answered = 0;
    if (!qs.length) markRead(null);
    qs.forEach((q, qi) => {
      const optsEl = q.options.map((o, i) => h('button', { class: `opt ${o.ko ? 'ko-opt' : ''}`, onclick: () => pick(i) }, o.text));
      let done = false;
      function pick(i) {
        if (done) return; done = true; answered++;
        if (i === q.answer) right++;
        optsEl.forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
        if (answered === qs.length) markRead(right / qs.length);
      }
      box.append(h('div', { class: 'stack' }, h('b', null, `${qi + 1}. ${q.prompt.en}`), h('div', { class: 'options' }, optsEl)));
    });
    box.append(h('div', { class: 'row' },
      h('a', { class: 'btn primary', href: `#/speak/${ch.id}/story` }, iconEl('mic', 16), 'Shadow this story'),
      !rewind ? h('a', { class: 'btn ghost', href: `#/story/${ep.id}/rewind` }, 'Rewind (fill the gaps)') : h('a', { class: 'btn ghost', href: `#/story/${ep.id}` }, 'Normal view'),
      h('a', { class: 'btn ghost', href: ch.extra ? '#/stories' : `#/chapter/${ch.id}` }, 'Back')));
    return box;
  }

  function markRead(score) {
    update((s) => {
      const r = (s.stories[ep.id] ||= {});
      r.read = Date.now();
      if (score != null) r.quiz = Math.max(r.quiz || 0, score);
      if (rewind) r.rewind = Date.now();
    });
    if (score != null) toast(score === 1 ? 'Every answer right. 완벽해요!' : `Story read · ${Math.round(score * 100)}% on the questions`);
  }

  draw();
  emit('story', { id: ep.id });
  return h('div', { class: 'stack' }, backLink(ch.extra ? '#/stories' : `#/chapter/${ch.id}`, ch.title.en), panelsHost);
}

// Words from this chapter and earlier, longest first, used to blank out words in rewind mode.
function chapterWords(ch) {
  const ids = new Set();
  for (const c of chapters) { for (const L of c.lessons) L.items.forEach((id) => ids.add(id)); if (c === ch) break; }
  return shuffle([...ids].map((id) => items.get(id)).filter((it) => it && it.kind === 'word').map((it) => it.ko)).sort((a, b) => b.length - a.length);
}
