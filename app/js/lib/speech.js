// Text-to-speech, speech recognition and simple recording, all through browser APIs.
//
// Natural voice: Edge ships neural Korean voices ("Microsoft 선히 / 인준 Online (Natural)", "Hyunsu Multilingual");
// Chrome has "Google 한국어". Old desktop voices (Microsoft Heami) sound robotic, so they are used only when
// nothing better exists, and the app says how to get the natural ones.
// Several people: story characters each get a persona (voice + small pitch/speed shifts), and lessons can
// alternate between a woman's and a man's voice so she hears words from more than one speaker.
// Slow reading lowers the voice's own speaking rate (the neural engine stretches the speech without
// chopping it), so slow audio stays smooth instead of being cut into pieces.

import { emit } from './bus.js';

let voices = [];
let prefs = { voice: '', rate: 1, mix: true, slow: false, maleVoice: '' };

export function initSpeech(p) {
  if (p) prefs = { ...prefs, ...p };
  if (!('speechSynthesis' in globalThis)) return;
  const load = () => { voices = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang)); emit('voices', voices); };
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}
export const setSpeechPrefs = (p) => { prefs = { ...prefs, ...p }; emit('speech-prefs', prefs); };
export const speechPrefs = () => ({ ...prefs });
export const hasTTS = () => 'speechSynthesis' in globalThis;
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
// 'natural' | 'basic' | 'none' — the settings screen and the first-run hint use this.
export function voiceQuality() {
  const v = bestVoice();
  return !v ? 'none' : isNatural(v) ? 'natural' : 'basic';
}

// Story cast and lesson speakers. Pitch/rate shifts are small: big shifts make neural voices sound synthetic.
export const PERSONAS = {
  me: { g: 'f', pitch: 1.02 }, minji: { g: 'f', pitch: 1.07, rate: 1.04 }, grandma: { g: 'f', pitch: 0.9, rate: 0.9 },
  mom: { g: 'f', pitch: 0.97 }, pharm: { g: 'f', pitch: 1 }, woman: { g: 'f', pitch: 1.02 }, staff: { g: 'f', pitch: 1.04 },
  clerk: { g: 'm', pitch: 1.02 }, head: { g: 'f', pitch: 0.93, rate: 0.94 }, man: { g: 'm' }, dad: { g: 'm', pitch: 0.94, rate: 0.95 },
  driver: { g: 'm', pitch: 0.96, rate: 0.97 }, jiji: { g: 'm', pitch: 1.08, rate: 1.02 }, narrator: { g: 'f', rate: 0.97 },
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
export function stopSpeaking() { speakToken++; try { speechSynthesis.cancel(); } catch { /* none */ } emit('tts', { on: false }); }

// Text -> chunks the engine can say in one breath. Neural voices get whole sentences (natural phrasing);
// very long text is split at sentence ends because some engines stop after ~15 seconds.
function chunks(text) {
  const clean = String(text).replace(/[“”"「」『』]/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/~/g, '').trim();
  if (clean.length <= 160) return [clean];
  return clean.split(/(?<=[.!?。…])\s+/).filter(Boolean);
}

// speak(text, { rate, pitch, who, slow, voice })  — resolves when finished (or interrupted).
export function speak(text, { rate = 1, pitch = 1, who = '', slow = false, gender } = {}) {
  if (!hasTTS() || !text) return Promise.resolve();
  stopSpeaking();
  const token = speakToken;
  const parts = chunks(text);
  const per = personaFor(who, String(text));
  const voice = bestVoice(gender || per.g);
  const natural = isNatural(voice);
  // Slow: 0.68× of her chosen speed (or slower still if the global slow switch is on).
  const slowF = slow ? (prefs.slow ? 0.6 : 0.68) : prefs.slow ? 0.78 : 1;
  const r = Math.max(0.45, Math.min(1.6, prefs.rate * rate * (per.rate || 1) * slowF));
  // Robotic voices get no pitch tricks (they sound worse); natural ones get the persona's shift.
  const p = Math.max(0.6, Math.min(1.5, pitch * (natural ? per.pitch || 1 : 1)));
  emit('tts', { on: true, text, who });
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
  return run.then(() => { if (token === speakToken) emit('tts', { on: false }); });
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
  { id: 'robotic', label: 'Sounds robotic', apply: (s) => ({ voice: nextNatural(s.voice) }) },
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
export const speechPrefsFrom = (s) => ({ voice: s.voice, rate: s.rate, mix: s.voiceMix, maleVoice: s.maleVoice, slow: s.slowAll });
