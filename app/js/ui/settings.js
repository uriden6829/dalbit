import { h, svg, toast, download, confirmDialog } from '../lib/dom.js';
import { getState, update, exportBackup, importBackup, resetAll, getApiKey, setApiKey, flush } from '../lib/store.js';
import { koreanVoices, setSpeechPrefs, speak, hasSTT, voiceQuality, voiceGender, naturalness, speechPrefsFrom, NUDGES } from '../lib/speech.js';
import { BGM_LIST, bgmRefresh } from '../lib/bgm.js';
import { emit } from '../lib/bus.js';
import { MODELS, DEFAULT_MODEL, testKey } from '../ai/claude.js';
import { VERSION, CHANGELOG } from '../version.js';
import { levelOf } from '../engine/adapt.js';
import { person } from '../art/people.js';

export const title = () => 'Settings';

function seg(options, value, onPick) {
  return h('div', { class: 'seg' }, options.map(([v, label]) => h('button', { class: v === value ? 'on' : '', onclick: () => onPick(v) }, label)));
}
function row(label, control, help) {
  return h('div', { class: 'stack', style: { gap: '6px' } }, h('b', null, label), control, help ? h('div', { class: 'small muted' }, help) : null);
}

export function render(_, { go, onLeave }) {
  const root = h('div', { class: 'stack' });
  // Voices load asynchronously; redraw once they arrive so the list isn't empty.
  const onVoices = () => setTimeout(draw, 50);
  globalThis.speechSynthesis?.addEventListener?.('voiceschanged', onVoices);
  onLeave(() => globalThis.speechSynthesis?.removeEventListener?.('voiceschanged', onVoices));
  const applyTheme = () => {
    const t = getState().settings.theme;
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  };

  function draw() {
    const st = getState();
    const s = st.settings;
    const set = (k, v) => { update((x) => { x.settings[k] = v; }); if (k === 'theme') applyTheme(); if (k === 'companion') emit('companion', v); setSpeechPrefs(speechPrefsFrom(getState().settings)); draw(); };
    const setBgm = (k, v) => { update((x) => { x.settings.bgm[k] = v; }); bgmRefresh(); draw(); };
    const voices = koreanVoices();
    const look = st.profile.look;
    const setLook = (k, v) => { update((x) => { x.profile.look[k] = v; }); draw(); };
    const sw = (list, k) => h('div', { class: 'row' }, list.map((c) => h('button', { 'aria-label': c, onclick: () => setLook(k, c),
      style: { width: '26px', height: '26px', borderRadius: '50%', background: c, cursor: 'pointer', border: look[k] === c ? '3px solid var(--gold)' : '1px solid var(--line-2)' } })));
    const keyIn = h('input', { type: 'password', placeholder: 'sk-ant-…', autocomplete: 'off', value: getApiKey() });
    const aiStatus = h('div', { class: 'small muted' });

    root.replaceChildren(
      h('div', null, h('div', { class: 'eyebrow' }, '설정 · Settings'), h('h1', null, 'Settings')),

      h('section', { class: 'card stack' }, h('h2', null, 'You'),
        row('Name', h('input', { type: 'text', value: st.profile.name, maxlength: 30, onchange: (e) => { update((x) => { x.profile.name = e.target.value.trim(); }); toast('Saved'); } })),
        h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '20px' } },
          svg(`<svg viewBox="-60 -180 120 190" width="90" height="142">${person({ hair: look.hair, hairColor: look.hairColor, skin: look.skin, top: look.coat, scarf: '#6a4d74', hat: 'witch', mood: 'smile' })}</svg>`),
          h('div', { class: 'stack', style: { flex: 1 } },
            seg([['bob', 'Bob'], ['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun'], ['short', 'Short']], look.hair, (v) => setLook('hair', v)),
            sw(['#2a201c', '#4a3226', '#7a5236', '#b08550', '#8f8d96'], 'hairColor'),
            sw(['#f6dcc8', '#f0cdb4', '#ddb08f', '#b98463', '#8c5b3f'], 'skin'),
            sw(['#e9dcc4', '#6a4d74', '#4f6d8c', '#7f9a83', '#b8625b', '#2f2e48'], 'coat'))),
        h('div', { class: 'small muted' }, 'This is how you appear in the stories.')),

      h('section', { class: 'card stack' }, h('h2', null, 'Studying'),
        row('Study evening length', seg([[10, '10 min'], [15, '15 min'], [25, '25 min'], [40, '40 min']], s.minutes, (v) => set('minutes', v)), 'Tonight’s study fills this time with reviews first, then new words.'),
        row('New words per day (max)', seg([[5, '5'], [10, '10'], [15, '15'], [20, '20']], s.newPerDay, (v) => set('newPerDay', v)), 'Fewer new words means more repetition of each one. Reviews are never skipped.'),
        row('Romanization', seg([['auto', 'Until Hangul is solid'], ['always', 'Always'], ['never', 'Never']], s.romanization, (v) => set('romanization', v))),
        row('Speaking exercises in lessons', seg([[true, 'On'], [false, 'Off']], s.speaking, (v) => set('speaking', v)), hasSTT() ? 'Uses the microphone and the browser’s speech recognition (needs internet).' : 'This browser can’t transcribe speech, so speaking uses record-and-compare.'),
        row('Play Korean after a correct answer', seg([[true, 'On'], [false, 'Off']], s.autoplay, (v) => set('autoplay', v))),
        row('Stories show English by default', seg([[false, 'No — tap to reveal'], [true, 'Yes']], s.storyEnglish, (v) => set('storyEnglish', v)))),

      voiceSection(s, set),
      musicSection(s, setBgm),

      h('section', { class: 'card stack' }, h('h2', null, 'Appearance'),
        row('Theme', seg([['auto', 'Follow Windows'], ['light', 'Parchment'], ['dark', 'Night']], s.theme, (v) => set('theme', v))),
        row('Jiji keeps you company', seg([[true, 'In the corner'], [false, 'Hidden']], s.companion, (v) => set('companion', v)), 'Jiji sits in the corner while you study, reacts to your answers and holds the word tools.')),

      h('section', { class: 'card stack' }, h('h2', null, 'Jiji’s magic (AI)'),
        row('Mode', seg([['off', 'Off'], ['bridge', 'Free Claude.ai'], ['api', 'API key']], st.ai.mode, (v) => { update((x) => { x.ai.mode = v; }); draw(); }),
          'Free: Jiji prepares messages for your Claude.ai account and you paste lessons back. API key: everything happens inside the app (paid per use, usually cents).'),
        st.ai.mode === 'api' ? h('div', { class: 'stack' },
          row('API key', keyIn, 'Stored only in this browser. Never included in backups, never sent anywhere except api.anthropic.com.'),
          row('Model', h('select', { onchange: (e) => { update((x) => { x.ai.model = e.target.value; }); draw(); } }, MODELS.map((m) => h('option', { value: m.id, selected: (st.ai.model || DEFAULT_MODEL) === m.id }, `${m.label} — ${m.note}`)))),
          h('div', { class: 'row' },
            h('button', { class: 'btn ghost', onclick: async () => { setApiKey(keyIn.value.trim()); aiStatus.textContent = 'Testing…'; try { await testKey(st.ai.model || DEFAULT_MODEL); aiStatus.textContent = 'Connected ✓'; } catch (e) { aiStatus.textContent = e.message; } } }, 'Save & test'),
            h('button', { class: 'btn ghost', onclick: () => { setApiKey(''); keyIn.value = ''; aiStatus.textContent = 'Key removed from this browser.'; } }, 'Remove key')),
          aiStatus) : null,
        h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'How Jiji stays safe online'),
          h('ul', { class: 'small muted' },
            h('li', null, 'Web search only reads a short list of trusted Korean news, tourism, encyclopedia and dictionary sites.'),
            h('li', null, 'Whatever the AI returns is checked field by field: no links, no code, nothing asking for passwords or actions. Suspicious content is rejected, not shown.'),
            h('li', null, 'The app itself can only talk to this site and api.anthropic.com, so nothing can quietly send your data elsewhere.')))),

      h('section', { class: 'card stack' }, h('h2', null, 'Your progress'),
        h('p', { class: 'small muted' }, 'Progress lives in this browser on this PC. Download a backup now and then — it’s a small file you can restore on any computer.',
          st.meta.lastBackup ? ` Last backup: ${new Date(st.meta.lastBackup).toLocaleDateString()}.` : ' No backup yet.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onclick: () => { download(exportBackup(), `dalbit-backup-${new Date().toISOString().slice(0, 10)}.json`); draw(); } }, 'Download backup'),
          h('label', { class: 'btn ghost' }, 'Restore backup', h('input', { type: 'file', accept: '.json,application/json', class: 'hidden', onchange: async (e) => {
            const f = e.target.files[0]; if (!f) return;
            if (!(await confirmDialog('Replace current progress with this backup?', { yes: 'Restore' }))) return;
            try { await importBackup(await f.text()); toast('Restored'); go('#/home'); } catch (err) { toast(err.message); }
          } }))),
        row('Entrance exam', h('div', { class: 'row' }, h('span', { class: 'small' }, st.placement ? `Last result: ${levelOf(st.placement.theta).label}` : 'Not taken'), h('a', { class: 'btn ghost small', href: '#/placement' }, st.placement ? 'Retake' : 'Take it'))),
        h('div', null, h('button', { class: 'btn danger small', onclick: async () => {
          if (!(await confirmDialog('Erase ALL progress on this PC? This cannot be undone (unless you have a backup).', { yes: 'Erase everything', danger: true }))) return;
          await resetAll(); location.hash = '#/welcome'; location.reload();
        } }, 'Erase all progress'))),

      h('section', { class: 'card stack' }, h('h2', null, 'Updates'),
        h('p', { class: 'small muted' }, `Version ${VERSION}. New chapters and fixes arrive automatically when you open the app online.`),
        h('div', null, h('button', { class: 'btn ghost', onclick: async () => {
          await flush();
          const reg = await navigator.serviceWorker?.getRegistration?.();
          await reg?.update?.().catch(() => {});
          location.reload();
        } }, 'Check for updates now')),
        h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'What’s new'),
          ...CHANGELOG.map((c) => h('div', { class: 'small' }, h('b', null, `v${c.version}`), h('ul', null, c.notes.map((n) => h('li', null, n))))))));
  }
  draw();
  return root;
}

const SAMPLE = '안녕하세요. 오늘 저녁에 같이 한국어 공부해요. 천천히 해도 괜찮아요.';

function voiceSection(s, set) {
  const voices = koreanVoices();
  const q = voiceQuality();
  const label = (v) => `${v.name.replace(/^Microsoft\s+/, '').replace(/\s*-\s*Korean.*$/, '')}${naturalness(v) >= 6 ? ' · natural' : ' · basic'}`;
  const pickFor = (g, key) => h('select', { onchange: (e) => set(key, e.target.value) },
    h('option', { value: '', selected: !s[key] }, 'Most natural available'),
    voices.filter((v) => voiceGender(v) === g).map((v) => h('option', { value: v.name, selected: s[key] === v.name }, label(v))));
  const status = q === 'natural'
    ? h('div', { class: 'pill', style: { background: 'color-mix(in srgb, var(--sage) 25%, transparent)' } }, '✓ Natural neural voices are on')
    : h('div', { class: 'card', style: { background: 'color-mix(in srgb, var(--rose) 14%, transparent)', padding: '12px 14px' } },
      h('b', null, q === 'none' ? 'No Korean voice found.' : 'Only a basic (robotic) Korean voice is available here.'),
      h('div', { class: 'small' }, 'Open Dalbit in Microsoft Edge: it includes natural Korean voices (선히, 인준, Hyunsu) that sound like real people. They need internet; without it the basic voice is used.'));
  return h('section', { class: 'card stack' }, h('h2', null, 'Voice'),
    status,
    voices.length ? row('Woman’s voice', pickFor('f', 'voice')) : null,
    voices.some((v) => voiceGender(v) === 'm') ? row('Man’s voice', pickFor('m', 'maleVoice')) : null,
    row('Different people', seg([[true, 'Mix voices'], [false, 'One voice']], s.voiceMix, (v) => set('voiceMix', v)),
      'Mix: lessons alternate between a woman’s and a man’s voice, and every story character speaks with their own voice — like hearing Korean from real people.'),
    row(`Speed: ${s.rate.toFixed(2)}×`, h('input', { type: 'range', min: 0.6, max: 1.25, step: 0.05, value: s.rate, onchange: (e) => set('rate', Number(e.target.value)) }), '1.00× is natural speaking speed.'),
    row('Slow everything down', seg([[false, 'Normal'], [true, 'Slow (turtle)']], s.slowAll, (v) => set('slowAll', v)),
      'Every 🐢 button always plays slowly. This switch (also on Jiji’s corner) makes all Korean audio slower. The voice itself speaks slower — it is not stretched, so it does not crackle.'),
    h('div', { class: 'stack', style: { gap: '6px' } }, h('b', null, 'Something sounds wrong?'),
      h('div', { class: 'row' }, NUDGES.map((n) => h('button', { class: 'btn ghost small', onclick: () => {
        const ch = n.apply(s);
        for (const [k, v] of Object.entries(ch)) set(k === 'mix' ? 'voiceMix' : k, v);
        speak(SAMPLE);
      } }, n.label)))),
    h('div', { class: 'row' },
      h('button', { class: 'btn ghost', onclick: () => speak(SAMPLE, { gender: 'f' }) }, 'Hear her'),
      h('button', { class: 'btn ghost', onclick: () => speak(SAMPLE, { gender: 'm' }) }, 'Hear him'),
      h('button', { class: 'btn ghost', onclick: () => speak(SAMPLE, { slow: true }) }, '🐢 Hear it slowly')));
}

function musicSection(s, setBgm) {
  const b = s.bgm;
  return h('section', { class: 'card stack' }, h('h2', null, 'Music'),
    row('Background music', seg([[true, 'On'], [false, 'Off']], b.on, (v) => setBgm('on', v)),
      'Live music played by a small band inside the app. It gets quieter and simpler while you concentrate and almost silent in listening and speaking exercises.'),
    row('Mood', h('div', { class: 'grid two', style: { gap: '8px' } }, BGM_LIST.map((p) => h('button', {
      class: `card tile ${b.preset === p.id ? 'on' : ''}`, style: { textAlign: 'left', padding: '10px 12px', border: b.preset === p.id ? '2px solid var(--gold)' : '' },
      onclick: () => { setBgm('preset', p.id); if (!b.on) setBgm('on', true); },
    }, h('div', null, h('b', { class: 'ko-serif' }, p.ko), ' ', h('span', null, p.name), h('div', { class: 'small muted' }, p.desc)))))),
    row(`Volume: ${Math.round(b.volume * 100)}%`, h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: b.volume, oninput: (e) => { update((x) => { x.settings.bgm.volume = Number(e.target.value); }); bgmRefresh(); }, onchange: (e) => setBgm('volume', Number(e.target.value)) })));
}
