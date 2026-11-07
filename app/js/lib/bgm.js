// Background music: the Live Studio engine (app/vendor/adaptive-music.js) playing one of the presets in
// content/bgm-presets.js. It follows what she is doing through the bus:
//   route / exercise -> Focus (0 browsing … 1 listening/speaking: the band thins out and goes almost silent)
//   story            -> Story switch (more space)
//   tts              -> ducks under the Korean voice;  mic -> nearly mute so it doesn't leak into the recording
//   answer / session-end -> a soft chime / a rising flourish
import { getState } from './store.js';
import { on } from './bus.js';
import { BGM_PRESETS } from '../../content/bgm-presets.js';

export const BGM_LIST = BGM_PRESETS.map(({ id, name, ko, desc }) => ({ id, name, ko, desc }));

let music = null, loading = null, playing = false, current = '';
let focus = 0.2, story = false, duck = 1, mic = false, lastChime = 0;

const settings = () => getState().settings.bgm;
const presetOf = (id) => (BGM_PRESETS.find((p) => p.id === id) || BGM_PRESETS[0]);

function loadRuntime() {
  if (globalThis.AdaptiveMusic) return Promise.resolve(globalThis.AdaptiveMusic);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'vendor/adaptive-music.js';
    s.onload = () => res(globalThis.AdaptiveMusic);
    s.onerror = () => rej(new Error('music engine failed to load'));
    document.head.append(s);
  });
}

async function ensure() {
  if (music) return music;
  if (!loading) {
    loading = (async () => {
      const AM = await loadRuntime();
      const p = presetOf(settings().preset);
      current = p.id;
      music = await AM.create({ preset: p.preset, workletUrl: 'vendor/am-worklet.js', volume: 0, params: { Focus: focus, Story: story ? 1 : 0 } });
      music.on('error', (m) => console.warn('bgm', m));
      return music;
    })().catch((e) => { console.warn(e); loading = null; return null; });
  }
  return loading;
}

function level() {
  const s = settings();
  return s.on ? s.volume * 0.9 * duck * (mic ? 0.06 : 1) : 0;
}
function applyVolume() { if (music) music.volume(level()); }

// Starts (or stops) according to settings. Browsers need a click/key press before audio may start.
export async function bgmRefresh() {
  const s = settings();
  if (!s.on) { if (music && playing) { music.stop(1.2); playing = false; } return; }
  const m = await ensure();
  if (!m) return;
  if (current !== s.preset) { current = s.preset; m.setPreset(presetOf(s.preset).preset); m.set('Focus', focus, 0); m.set('Story', story ? 1 : 0, 0); }
  if (!playing && gestured) {
    try { await m.start(); playing = true; } catch { /* still blocked */ }
  }
  applyVolume();
}

function setFocus(f, glide) {
  if (Math.abs(f - focus) < 0.01) return;
  focus = f;
  music?.set('Focus', f, glide);
}

const ROUTE_FOCUS = { home: 0.1, course: 0.15, chapter: 0.15, stories: 0.1, story: 0.35, spellbook: 0.25, wordbank: 0.25, ask: 0.3, read: 0.65, settings: 0.1, study: 0.5, speak: 0.92, welcome: 0.1, placement: 0.6 };
const LISTENING = new Set(['listen', 'listenMeaning', 'listenLetter']);

let gestured = false;
export function initBgm() {
  const kick = () => {
    if (gestured) return;
    gestured = true;
    removeEventListener('pointerdown', kick, true); removeEventListener('keydown', kick, true);
    bgmRefresh();
  };
  addEventListener('pointerdown', kick, true);
  addEventListener('keydown', kick, true);
  on('route', (name) => {
    story = name === 'story';
    music?.set('Story', story ? 1 : 0);
    setFocus(ROUTE_FOCUS[name] ?? 0.2, 1.5);
  });
  on('exercise', (ex) => {
    if (!ex) return;
    const listening = LISTENING.has(ex.variant) || ex.prompt?.audio;
    setFocus(ex.type === 'speak' || listening ? 1 : ex.type === 'intro' ? 0.55 : 0.45, listening ? 0.6 : 1.5);
  });
  on('tts', ({ on: speaking }) => { duck = speaking ? 0.4 : 1; applyVolume(); });
  on('mic', ({ on: live }) => { mic = live; applyVolume(); });
  on('answer', ({ correct }) => {
    if (!correct || !playing || Date.now() - lastChime < 4000) return;
    lastChime = Date.now();
    music.event('Correct');
  });
  on('session-end', () => { if (playing) music.event('Lesson done'); });
  document.addEventListener('visibilitychange', () => {
    if (!music) return;
    if (document.hidden) music.ctx.suspend?.(); else if (settings().on) music.ctx.resume?.();
  });
}

// Debug hook for tests (tools and DevTools): what the music engine is doing right now.
globalThis.__dalbitBgm = () => ({ playing, preset: current, focus, duck, mode: music?.mode || null, status: music?.status?.() || null });
