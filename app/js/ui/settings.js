import { h, svg, toast, download, confirmDialog } from '../lib/dom.js';
import { getState, update, exportBackup, importBackup, resetAll, getApiKey, setApiKey, flush } from '../lib/store.js';
import { koreanVoices, setSpeechPrefs, speak, hasSTT, hasKoreanVoice } from '../lib/speech.js';
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
    const set = (k, v) => { update((x) => { x.settings[k] = v; }); if (k === 'theme') applyTheme(); if (k === 'voice' || k === 'rate') setSpeechPrefs({ [k]: v }); draw(); };
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

      h('section', { class: 'card stack' }, h('h2', null, 'Voice'),
        voices.length ? row('Korean voice', h('select', { onchange: (e) => set('voice', e.target.value) },
          h('option', { value: '', selected: !s.voice }, 'Best available'), voices.map((v) => h('option', { value: v.name, selected: s.voice === v.name }, v.name)))) :
          h('p', { class: 'muted small' }, hasKoreanVoice() ? '' : 'No Korean voice found. Microsoft Edge includes natural Korean voices (SunHi, InJoon) — open the app in Edge, or add the Korean speech pack in Windows Settings → Time & language → Speech.'),
        row(`Speed: ${s.rate.toFixed(2)}×`, h('input', { type: 'range', min: 0.6, max: 1.2, step: 0.05, value: s.rate, onchange: (e) => set('rate', Number(e.target.value)) })),
        h('div', null, h('button', { class: 'btn ghost', onclick: () => speak('안녕하세요. 저는 지지예요. 만나서 반가워요.') }, 'Test voice'))),

      h('section', { class: 'card stack' }, h('h2', null, 'Appearance'),
        row('Theme', seg([['auto', 'Follow Windows'], ['light', 'Parchment'], ['dark', 'Night']], s.theme, (v) => set('theme', v)))),

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
