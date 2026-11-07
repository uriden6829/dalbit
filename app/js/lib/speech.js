// Text-to-speech, speech recognition and simple recording, all through browser APIs.
// Edge ships natural online Korean voices (SunHi / InJoon); Chrome has "Google 한국의".

let voices = [];
let prefs = { voice: '', rate: 0.9 };

export function initSpeech(p) {
  if (p) prefs = { ...prefs, ...p };
  if (!('speechSynthesis' in globalThis)) return;
  const load = () => { voices = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang)); };
  load();
  speechSynthesis.addEventListener?.('voiceschanged', load);
}
export const setSpeechPrefs = (p) => { prefs = { ...prefs, ...p }; };
export const koreanVoices = () => voices.slice();
export const hasTTS = () => 'speechSynthesis' in globalThis;
export const hasKoreanVoice = () => voices.length > 0;

function score(v) {
  let s = 0;
  if (/natural|online|neural/i.test(v.name)) s += 4;
  if (/google/i.test(v.name)) s += 3;
  if (/sunhi|seoyeon|yuna|heami/i.test(v.name)) s += 1;
  if (!v.localService) s += 1;
  return s;
}
export function bestVoice() {
  if (prefs.voice) { const v = voices.find((x) => x.name === prefs.voice); if (v) return v; }
  return voices.slice().sort((a, b) => score(b) - score(a))[0] || null;
}

let speakToken = 0;
export function stopSpeaking() { speakToken++; try { speechSynthesis.cancel(); } catch { /* none */ } }

// Long text is split per sentence: Chrome cuts utterances off after ~15 s.
export function speak(text, { rate = 1, pitch = 1 } = {}) {
  if (!hasTTS() || !text) return Promise.resolve();
  stopSpeaking();
  const token = speakToken;
  const parts = String(text).split(/(?<=[.!?。…])\s+/).filter(Boolean);
  const voice = bestVoice();
  return parts.reduce((p, part) => p.then(() => new Promise((res) => {
    if (token !== speakToken) return res();
    const u = new SpeechSynthesisUtterance(part);
    u.lang = 'ko-KR';
    if (voice) u.voice = voice;
    u.rate = Math.max(0.5, Math.min(1.5, prefs.rate * rate));
    u.pitch = pitch;
    u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
    setTimeout(res, 2000 + part.length * 400);
  })), Promise.resolve());
}

const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const hasSTT = () => !!Recognition;

// Resolves { alternatives: [text...], error }
export function listen({ timeoutMs = 9000 } = {}) {
  return new Promise((resolve) => {
    if (!Recognition) return resolve({ alternatives: [], error: 'unsupported' });
    stopSpeaking();
    const r = new Recognition();
    r.lang = 'ko-KR';
    r.interimResults = false;
    r.maxAlternatives = 5;
    let done = false;
    const finish = (val) => { if (done) return; done = true; clearTimeout(t); try { r.stop(); } catch { /* already */ } resolve(val); };
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
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  const stopped = new Promise((res) => { rec.onstop = res; });
  rec.start();
  setTimeout(() => rec.state !== 'inactive' && rec.stop(), ms);
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  return URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
}
