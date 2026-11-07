// Speaking studio: shadowing, story role-play, and a phrasebook of real-life lines.
import { h, toast } from '../lib/dom.js';
import { getState, update, logActivity } from '../lib/store.js';
import { speak, stopSpeaking, hasSTT, listen, record } from '../lib/speech.js';
import { similarity, alignSyllables, romanize } from '../lib/hangul.js';
import { chapters, courseChapters, chapterOf, episodes, items } from '../../content/index.js';
import { chapterUnlocked, speakingPool } from '../engine/plan.js';
import { updateSkill, showRoman } from '../engine/adapt.js';
import { VOICE } from '../art/panel.js';
import { CAST_NAMES } from '../art/people.js';
import { jiji, jijiSays, speakBtn, slowBtn, iconEl, backLink } from './common.js';

export const title = () => 'Speaking';

export function render({ params }, { onLeave }) {
  onLeave(stopSpeaking);
  const [chId, mode] = params;
  if (!chId) return studio();
  const ch = chapterOf(chId);
  if (!ch) return h('p', null, 'Not found');
  if (mode === 'story' && ch.episode) {
    const ep = episodes.get(ch.episode);
    const lines = ep.panels.flatMap((p) => (p.lines || []).filter((l) => l.ko).map((l) => ({ ko: l.ko, en: l.en, who: l.who })));
    return runner(ch, lines, { title: `Shadow the story · ${ep.title.ko}`, roleplay: true, back: `#/story/${ep.id}` });
  }
  const pool = speakingPool(getState(), chId).map((it) => ({ ko: it.ko, en: it.en, id: it.id }));
  return runner(ch, pool, { title: `Speaking · ${ch.title.en}`, back: `#/chapter/${ch.id}`, markChapter: true });
}

function studio() {
  const st = getState();
  const open = courseChapters().filter((c) => chapterUnlocked(st, c) && c.id !== 'h0');
  const phrasebook = open.map((c) => ({ c, list: c.lessons.flatMap((l) => l.items).map((id) => items.get(id)).filter((it) => it.kind === 'phrase') })).filter((x) => x.list.length);
  return h('div', { class: 'stack' },
    h('div', null, h('div', { class: 'eyebrow' }, '말하기 · Speaking'), h('h1', null, 'Say it out loud')),
    jijiSays(hasSTT()
      ? 'Listen, repeat, and I’ll tell you which syllables came through. Shadowing — speaking right on top of the model voice — is the fastest way to a natural rhythm.'
      : 'This browser can’t transcribe speech, so we’ll record you and you compare by ear. (Edge or Chrome on a PC can score you automatically.)', { mood: 'idle' }),
    h('h2', null, 'Practise a chapter'),
    h('div', { class: 'grid two' }, open.map((c) => h('div', { class: 'card stack' },
      h('h3', null, c.title.en, ' ', h('span', { class: 'ko-serif muted' }, c.title.ko)),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary small', href: `#/speak/${c.id}` }, iconEl('mic', 16), 'Phrases'),
        c.episode && st.stories[c.episode]?.read ? h('a', { class: 'btn ghost small', href: `#/speak/${c.id}/story` }, 'Story role-play') : null)))),
    h('h2', null, 'Phrasebook'),
    h('p', { class: 'muted small' }, 'Every real-life phrase you’ve opened, by situation. Tap to hear; useful to glance at before you go out.'),
    ...phrasebook.map(({ c, list }) => h('details', { class: 'card flat' }, h('summary', { style: { cursor: 'pointer', fontWeight: 700 } }, c.title.en, ' · ', h('span', { class: 'ko' }, c.title.ko), ` (${list.length})`),
      h('div', { class: 'wordlist', style: { marginTop: '12px' } }, list.map((it) => h('div', { class: 'wordrow' }, speakBtn(it.ko), h('span', { class: 'ko' }, it.ko), h('span', { class: 'en' }, it.en)))))));
}

function runner(ch, lines, { title, roleplay = false, back, markChapter = false }) {
  const st = getState();
  const roman = showRoman(st);
  let i = 0, playMe = false;
  const scores = [];
  const host = h('div', { class: 'stack' });
  const root = h('div', { class: 'stack' }, backLink(back), h('h1', null, title), host);
  if (!lines.length) { host.append(h('p', null, 'Nothing to practise here yet.')); return root; }

  function setup() {
    if (!roleplay) return step();
    const whoList = [...new Set(lines.map((l) => l.who))];
    host.replaceChildren(jijiSays('Role-play: choose your part. The others will speak their lines, and you say yours.', { mood: 'smug' }),
      h('div', { class: 'row' }, whoList.map((w) => h('button', { class: 'btn ghost', onclick: () => { playMe = w; step(); } }, CAST_NAMES[w] || w)),
        h('button', { class: 'btn primary', onclick: () => { playMe = null; step(); } }, 'Shadow every line')));
  }

  async function step() {
    if (i >= lines.length) return finish();
    const l = lines[i];
    const mine = !roleplay || playMe === null || l.who === playMe;
    const heard = h('div', { class: 'heard' });
    const status = h('div', { class: 'muted small' });
    const next = h('button', { class: 'btn primary', onclick: () => { i++; step(); } }, i === lines.length - 1 ? 'Finish' : 'Next ', iconEl('arrow', 16));
    const card = h('div', { class: 'card stack center' },
      h('div', { class: 'small muted' }, `${i + 1} / ${lines.length}${roleplay && l.who ? ` · ${CAST_NAMES[l.who] || l.who}` : ''}`),
      h('div', { class: 'big-ko ko', style: { fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' } }, l.ko),
      roman ? h('div', { class: 'muted' }, romanize(l.ko)) : null,
      h('div', { class: 'muted' }, l.en),
      h('div', { class: 'row', style: { justifyContent: 'center' } }, speakBtn(l.ko), slowBtn(l.ko)));
    host.replaceChildren(card);
    await speak(l.ko, VOICE[l.who] || {});
    if (!mine) { card.append(h('div', { class: 'row', style: { justifyContent: 'center' } }, next)); return; }
    if (hasSTT()) {
      const mic = h('button', { class: 'mic-btn', onclick: async () => {
        mic.classList.add('live'); status.textContent = 'Listening…';
        const r = await listen();
        mic.classList.remove('live');
        if (!r.alternatives.length) { status.textContent = r.error === 'not-allowed' ? 'Microphone blocked — allow it in the address bar.' : 'I didn’t catch that. Try again.'; return; }
        let top = r.alternatives[0], s = 0;
        for (const a of r.alternatives) { const x = similarity(l.ko, a); if (x > s) { s = x; top = a; } }
        heard.replaceChildren(...alignSyllables(l.ko, top).map((c) => h('span', { class: c.ok ? 'hit' : 'miss' }, c.ch)));
        status.textContent = `${Math.round(s * 100)}% ${s >= 0.85 ? '— lovely.' : s >= 0.65 ? '— close. Once more?' : '— listen again, slowly.'}`;
        scores[i] = Math.max(scores[i] || 0, s);
        logActivity({ ex: 1, ok: s >= 0.7 ? 1 : 0, ms: 8000 });
        if (l.id) updateSkill(getState(), 'speaking', items.get(l.id)?.b ?? -2, s >= 0.7, { guess: 0.05 });
      } }, iconEl('mic', 36));
      card.append(h('div', { class: 'speak-area' }, mic, status, heard), h('div', { class: 'row', style: { justifyContent: 'center' } }, next));
    } else {
      const rec = h('button', { class: 'mic-btn', onclick: async () => {
        try {
          rec.classList.add('live'); status.textContent = 'Recording…';
          const url = await record(Math.min(9000, 2500 + l.ko.length * 220));
          rec.classList.remove('live');
          status.replaceChildren(h('button', { class: 'btn small ghost', onclick: () => new Audio(url).play() }, 'Play me'), ' ', h('button', { class: 'btn small ghost', onclick: () => speak(l.ko) }, 'Play model'));
          new Audio(url).play();
          scores[i] = 1;
        } catch { rec.classList.remove('live'); status.textContent = 'Microphone not available.'; }
      } }, iconEl('mic', 36));
      card.append(h('div', { class: 'speak-area' }, rec, status), h('div', { class: 'row', style: { justifyContent: 'center' } }, next));
    }
  }

  function finish() {
    const done = scores.filter((x) => x != null);
    const avg = done.length ? done.reduce((a, b) => a + b, 0) / done.length : 0;
    if (markChapter) update((s) => { (s.chapters[ch.id] ||= {}).spoke = true; });
    host.replaceChildren(h('div', { class: 'card stack center' }, jiji('happy', 110),
      h('h2', null, '수고했어요!'),
      h('p', { class: 'muted' }, done.length && hasSTT() ? `Average match ${Math.round(avg * 100)}% over ${done.length} lines.` : 'Every line said out loud counts.'),
      h('div', { class: 'row', style: { justifyContent: 'center' } },
        h('button', { class: 'btn ghost', onclick: () => { i = 0; scores.length = 0; setup(); } }, 'Again'),
        h('a', { class: 'btn primary', href: back }, 'Done'))));
    toast('Speaking practice saved');
  }

  setup();
  return root;
}

export { chapters };
