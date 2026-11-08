// Text-to-speech, speech recognition and simple recording.
//
// Studio voices (default): every line of the course was rendered ahead of time by Supertonic 3, a neural TTS
// with ten real voices, and ships as small Ogg Opus clips (app/voice/, made by tools/voice/build-voice.mjs).
// Same sound in every browser, works offline, each story character has their own voice, and 🐢 slow clips are
// the voice itself speaking slowly (rendered, not stretched). Casting lives in voicecast.js.
//
// Browser voice (fallback, and for text no clip exists for — AI lessons, Ask replies): Edge ships neural Korean
// voices ("Microsoft 선히 / 인준 Online (Natural)", "Hyunsu Multilingual"); Chrome has "Google 한국어". Old desktop
// voices (Microsoft Heami) sound robotic, so they are used only when nothing better exists.
// Slow reading lowers the voice's own speaking rate, so slow audio stays smooth instead of being cut into pieces.

import { emit } from './bus.js';
import { VOICES, TEACHERS, castVoice, clipName, speechText, dialogueTurns } from './voicecast.js';

let voices = [];
let prefs = { voice: '', rate: 1, mix: true, slow: false, maleVoice: '', engine: 'studio' };

let studio = null; // Map text -> ['F1', 'F1s', ...] from voice/index.json
async function loadStudio() {
  try {
    const j = await (await fetch('voice/index.json')).json();
    studio = new Map(Object.entries(j.lines).map(([t, v]) => [t, v.split(' ')]));
  } catch { studio = null; }
  emit('voices', voices);
}

export function initSpeech(p) {
  if (p) prefs = { ...prefs, ...p };
  if (globalThis.fetch && globalThis.Audio) loadStudio();
  if (!('speechSynthesis' in globalThis)) return;
  const load = () => { voices = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang)); emit('voices', voices); };
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}
export const setSpeechPrefs = (p) => { prefs = { ...prefs, ...p }; emit('speech-prefs', prefs); };
export const speechPrefs = () => ({ ...prefs });
export const hasStudio = () => !!studio?.size;
const useStudio = () => prefs.engine !== 'browser' && hasStudio();
export const hasTTS = () => hasStudio() || 'speechSynthesis' in globalThis;
export const hasKoreanVoice = () => voices.length > 0;

// ---- Voice catalogue ----
const FEMALE = /sunhi|선히|seohyeon|서현|jimin|지민|yujin|유진|soonbok|순복|heami|google|yuna|유나|seoyeon|sora|female/i;
const MALE = /injoon|인준|hyunsu|현수|bongjin|봉진|gookmin|국민|male/i;
export function voiceGender(v) { return MALE.test(v.name) && !/female/i.test(v.name) ? 'm' : FEMALE.test(v.name) ? 'f' : 'f'; }
// 0..10: how human the voice sounds.
export function naturalness(v) {
  const n = v.name;
  if (/natural|neural|online/i.test(n)) return 10;
  if (/premium|enhanced/i.test(n)) return 8;
  if (/google/i.test(n)) return 6;
  if (!v.localService) return 5;
  return 1;
}
export const isNatural = (v) => !!v && naturalness(v) >= 6;
const ranked = () => voices.slice().sort((a, b) => naturalness(b) - naturalness(a) || (voiceGender(a) === 'f' ? -1 : 1));
export const koreanVoices = () => ranked();

export function bestVoice(gender) {
  if (!gender && prefs.voice) { const v = voices.find((x) => x.name === prefs.voice); if (v) return v; }
  if (gender === 'm' && prefs.maleVoice) { const v = voices.find((x) => x.name === prefs.maleVoice); if (v) return v; }
  const list = ranked();
  if (!gender) return list[0] || null;
  const top = list[0] ? naturalness(list[0]) : 0;
  // Never trade a natural voice for a robotic one just to get the other gender.
  return list.find((v) => voiceGender(v) === gender && naturalness(v) >= Math.min(top, 6)) || list[0] || null;
}
// 'studio' | 'natural' | 'basic' | 'none' — the settings screen and the first-run hint use this.
export function voiceQuality() {
  if (useStudio()) return 'studio';
  const v = bestVoice();
  return !v ? 'none' : isNatural(v) ? 'natural' : 'basic';
}

// Story cast and lesson speakers. Pitch/rate shifts are small: big shifts make neural voices sound synthetic.
export const PERSONAS = {
  me: { g: 'f', pitch: 1.02 }, minji: { g: 'f', pitch: 1.07, rate: 1.04 }, grandma: { g: 'f', pitch: 0.9, rate: 0.9 },
  mom: { g: 'f', pitch: 0.97 }, pharm: { g: 'f', pitch: 1 }, woman: { g: 'f', pitch: 1.02 }, staff: { g: 'f', pitch: 1.04 },
  clerk: { g: 'm', pitch: 1.02 }, head: { g: 'f', pitch: 0.93, rate: 0.94 }, man: { g: 'm' }, dad: { g: 'm', pitch: 0.94, rate: 0.95 },
  driver: { g: 'm', pitch: 0.96, rate: 0.97 }, jiji: { g: 'f', pitch: 0.9, rate: 0.96 }, narrator: { g: 'f', rate: 0.97 },
  baker: { g: 'm', pitch: 0.95 }, grandpa: { g: 'm', pitch: 1.02, rate: 0.96 }, younggrandma: { g: 'f', pitch: 1.06 }, captain: { g: 'm', pitch: 0.9, rate: 0.95 }, girl: { g: 'f', pitch: 1.12, rate: 1.05 }, boy: { g: 'm', pitch: 1.1 },
};
const hash = (s) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return Math.abs(x); };
function personaFor(who, text) {
  if (who && PERSONAS[who]) return PERSONAS[who];
  if (who === 'teacher' || !prefs.mix) return { g: null };
  // Lesson audio: the same text always gets the same speaker, so replaying sounds identical.
  return { g: hash(text) % 3 === 2 ? 'm' : 'f' };
}

let speakToken = 0;
let playing = null; // the <audio> of the studio clip being played
export function stopSpeaking() {
  speakToken++;
  if (playing) { playing.pause(); playing = null; }
  try { speechSynthesis.cancel(); } catch { /* none */ }
  emit('tts', { on: false });
}

// ---- Studio clips ----
const sentencesOf = (t) => t.split(/(?<=[.!?。])\s+/).filter(Boolean);

// One clip for `text`, preferring the cast voice, then any voice of the same gender, then anyone.
// Slow: the voice's own slow rendering; if only a normal clip exists, it is played a little slower.
function clipFor(text, voice, slow) {
  const have = studio.get(text);
  if (!have) return null;
  const g = VOICES[voice]?.g;
  const names = [...new Set(have.map((v) => v.replace(/s$/, '')))];
  const order = [voice, ...names.filter((v) => VOICES[v]?.g === g), ...names];
  const url = (v, s) => `voice/clips/${clipName(v, s, text)}.ogg`;
  if (slow) { const v = order.find((x) => have.includes(`${x}s`)); if (v) return { url: url(v, true), rate: 1 }; }
  const v = order.find((x) => have.includes(x));
  return v ? { url: url(v, false), rate: slow ? 0.8 : 1 } : null;
}
// Clips for a whole line: one clip, or one per sentence if every sentence has one. null = not covered.
function studioPlan(text, voice, slow) {
  const t = speechText(text);
  const one = clipFor(t, voice, slow);
  if (one) return [one];
  const parts = sentencesOf(t);
  if (parts.length < 2) return null;
  const plan = parts.map((s) => clipFor(s, voice, slow));
  return plan.every(Boolean) ? plan : null;
}
// Clips are fetched whole (plain fetch: no Range requests, so the service worker can keep them) and played
// from memory. The last few dozen stay loaded, so replays and "Listen again" start instantly.
const blobs = new Map();
function loadClip(url) {
  if (!blobs.has(url)) {
    blobs.set(url, fetch(url).then((r) => (r.ok ? r.blob() : null)).then((b) => (b ? URL.createObjectURL(b) : null)).catch(() => null));
    if (blobs.size > 60) { const [k, p] = blobs.entries().next().value; blobs.delete(k); p.then((u) => u && setTimeout(() => URL.revokeObjectURL(u), 30000)); }
  }
  return blobs.get(url);
}
async function playClip({ url, rate }, token) {
  const src = await loadClip(url);
  if (!src) { blobs.delete(url); return false; }
  return new Promise((res) => {
    if (token !== speakToken) return res(true);
    const a = new Audio(src);
    a.preservesPitch = true;
    a.playbackRate = Math.max(0.5, Math.min(1.5, rate * prefs.rate));
    playing = a;
    const end = (ok) => { a.onended = a.onerror = a.onpause = null; if (playing === a) playing = null; res(ok); };
    a.onended = () => end(true);
    a.onpause = () => end(true); // stopSpeaking()
    a.onerror = () => end(false);
    a.play().catch(() => end(false));
  });
}

// Text -> chunks the engine can say in one breath. Neural voices get whole sentences (natural phrasing);
// very long text is split at sentence ends because some engines stop after ~15 seconds.
function chunks(text) {
  const clean = String(text).replace(/\s*\([^)]*\)/g, '').replace(/[“”"「」『』]/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/~/g, '').trim();
  if (clean.length <= 160) return [clean];
  return clean.split(/(?<=[.!?。…])\s+/).filter(Boolean);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// speak(text, { rate, pitch, who, slow, gender, studioOnly })  — resolves when finished (or interrupted).
// studioOnly: say nothing unless the speaker's own studio clip exists (Jiji's voice, never a stand-in).
// A conversation (one turn per line, "주말에 뭐 할 거예요?\n친구 결혼식이…") is read by two people taking turns.
export function speak(text, o = {}) {
  if (!hasTTS() || !text) return Promise.resolve();
  if (o.studioOnly && !(useStudio() && studio.get(speechText(text))?.includes(castVoice(speechText(text), o.who)))) return Promise.resolve();
  stopSpeaking();
  const token = speakToken;
  const turns = o.gender ? [[String(text), TEACHERS[o.gender]]] : dialogueTurns(text, o.who, prefs.mix);
  emit('tts', { on: true, text, who: o.who || '' });
  return (async () => {
    for (const [i, [t, voice]] of turns.entries()) {
      if (token !== speakToken) return;
      if (i) await wait(o.slow || prefs.slow ? 650 : 450); // a breath between speakers
      await sayTurn(t, voice, turns.length > 1 ? { ...o, gender: VOICES[voice]?.g } : o, token);
    }
    if (token === speakToken) emit('tts', { on: false });
  })();
}

// Autoplay when a question appears. Skipped if anything stops or replaces the audio before it starts — she
// answered, moved on, or pressed a play button herself — so a late timer never talks over the next screen.
export function speakSoon(text, o = {}, ms = 250) {
  const token = speakToken;
  setTimeout(() => { if (token === speakToken) speak(text, o); }, ms);
}

async function sayTurn(text, voice, o, token) {
  if (useStudio()) {
    const plan = studioPlan(String(text), voice, !!o.slow || prefs.slow);
    if (plan) {
      // 🐢 with the global slow switch also on: the slow clip, a touch slower still.
      if (o.slow && prefs.slow) for (const c of plan) c.rate *= 0.88;
      plan.forEach((c) => loadClip(c.url));
      for (const [i, clip] of plan.entries()) {
        if (token !== speakToken) return;
        if (i) await wait(o.slow ? 380 : 220);
        // A clip that can't play (offline and not cached yet) is read by the browser voice instead.
        if (!(await playClip(clip, token)) && token === speakToken) return browserSpeak(text, o, token);
      }
      return;
    }
  }
  return browserSpeak(text, o, token);
}

function browserSpeak(text, { rate = 1, pitch = 1, who = '', slow = false, gender } = {}, token) {
  if (!('speechSynthesis' in globalThis)) return Promise.resolve();
  const parts = chunks(text);
  const per = personaFor(who, String(text));
  const voice = bestVoice(gender || per.g);
  const natural = isNatural(voice);
  // Slow: 0.68× of her chosen speed (or slower still if the global slow switch is on).
  const slowF = slow ? (prefs.slow ? 0.6 : 0.68) : prefs.slow ? 0.78 : 1;
  const r = Math.max(0.45, Math.min(1.6, prefs.rate * rate * (per.rate || 1) * slowF));
  // Robotic voices get no pitch tricks (they sound worse); natural ones get the persona's shift.
  const p = Math.max(0.6, Math.min(1.5, pitch * (natural ? per.pitch || 1 : 1)));
  const run = parts.reduce((prev, part, i) => prev.then(() => new Promise((res) => {
    if (token !== speakToken) return res();
    const u = new SpeechSynthesisUtterance(part);
    u.lang = 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = r;
    u.pitch = p;
    let done = false;
    const end = () => { if (done) return; done = true; clearTimeout(guard); setTimeout(res, slow && i < parts.length - 1 ? 260 : 60); };
    u.onend = u.onerror = end;
    // Safety net if the engine never fires onend; scaled by speed so slow speech is never cut short.
    const guard = setTimeout(end, (3000 + part.length * 420) / r);
    speechSynthesis.speak(u);
  })), Promise.resolve());
  return run;
}
export const speakSlow = (text, o = {}) => speak(text, { ...o, slow: true });

const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const hasSTT = () => !!Recognition;

// Resolves { alternatives: [text...], error }
export function listen({ timeoutMs = 9000 } = {}) {
  return new Promise((resolve) => {
    if (!Recognition) return resolve({ alternatives: [], error: 'unsupported' });
    stopSpeaking();
    emit('mic', { on: true });
    const r = new Recognition();
    r.lang = 'ko-KR';
    r.interimResults = false;
    r.maxAlternatives = 5;
    let done = false;
    const finish = (val) => { if (done) return; done = true; clearTimeout(t); try { r.stop(); } catch { /* already */ } emit('mic', { on: false }); resolve(val); };
    const t = setTimeout(() => finish({ alternatives: [], error: 'timeout' }), timeoutMs);
    r.onresult = (e) => {
      const res = e.results[0];
      const alts = [];
      for (let i = 0; i < res.length; i++) alts.push(res[i].transcript.trim());
      finish({ alternatives: alts });
    };
    r.onerror = (e) => finish({ alternatives: [], error: e.error || 'error' });
    r.onend = () => finish({ alternatives: [], error: 'no-speech' });
    try { r.start(); } catch (e) { finish({ alternatives: [], error: String(e) }); }
  });
}

// Record her voice so she can compare it with the model voice (works without recognition).
export async function record(ms = 4000) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  emit('mic', { on: true });
  const rec = new MediaRecorder(stream);
  const chunksArr = [];
  rec.ondataavailable = (e) => chunksArr.push(e.data);
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start();
  setTimeout(() => rec.state !== 'inactive' && rec.stop(), ms);
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  emit('mic', { on: false });
  return URL.createObjectURL(new Blob(chunksArr, { type: rec.mimeType || 'audio/webm' }));
}

// ---- Voice tuning (adapted from the Voice Lab's "Something sounds wrong?" nudges) ----
// One click = one step, always within range; the settings screen shows these as buttons.
export const NUDGES = [
  { id: 'robotic', label: 'Sounds robotic', apply: (s) => (hasStudio() && s.voiceEngine === 'browser' ? { voiceEngine: 'studio' } : { voice: nextNatural(s.voice) }) },
  { id: 'fast', label: 'Too fast', apply: (s) => ({ rate: Math.max(0.6, +(s.rate - 0.05).toFixed(2)) }) },
  { id: 'slow', label: 'Too slow', apply: (s) => ({ rate: Math.min(1.25, +(s.rate + 0.05).toFixed(2)) }) },
  { id: 'same', label: 'Always the same voice', apply: () => ({ mix: true }) },
];
function nextNatural(current) {
  const list = ranked().filter(isNatural);
  if (!list.length) return current;
  const i = list.findIndex((v) => v.name === current);
  return list[(i + 1) % list.length].name;
}
export const speechPrefsFrom = (s) => ({ voice: s.voice, rate: s.rate, mix: s.voiceMix, maleVoice: s.maleVoice, slow: s.slowAll, engine: s.voiceEngine || 'studio' });
