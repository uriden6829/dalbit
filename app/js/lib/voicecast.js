// Studio voices: who says what. Shared by the app (speech.js picks the clip) and the voice builder
// (tools/voice/build-voice.mjs renders the clips), so both always agree on the voice for a line.
//
// The clips are made ahead of time with Supertonic 3 (Supertone's on-device neural TTS, 10 preset voices) and
// shipped as small Ogg Opus files in app/voice/. Text the builder never saw (AI lessons, Ask replies) falls back
// to the browser voice.

// Bump to re-render every clip (new engine, new settings). Part of every clip's file name.
export const STUDIO_VERSION = 1;

// Ten real voices. speed = the engine's speaking-speed setting for a learner-friendly pace (measured, see
// NOTES.md "Build iterations"); slow = the same voice speaking slowly for the 🐢 buttons.
// Speeds even out the voices' natural pace to ≈5 syllables a second (a clear, unhurried native pace).
// F4, M3 and M5 blur isolated words, so they only play characters who speak in full sentences.
export const VOICES = {
  F1: { g: 'f', speed: 0.9, desc: 'warm, clear — the woman teacher, and you' },
  F2: { g: 'f', speed: 0.84, desc: 'bright, young' },
  F3: { g: 'f', speed: 1.0, desc: 'soft, unhurried' },
  F4: { g: 'f', speed: 0.85, desc: 'quick, lively (sentences only)' },
  F5: { g: 'f', speed: 0.93, desc: 'low, mature' },
  M1: { g: 'm', speed: 0.86, desc: 'light, young' },
  M2: { g: 'm', speed: 0.88, desc: 'calm, clear — the man teacher' },
  M3: { g: 'm', speed: 0.8, desc: 'brisk (sentences only)' },
  M4: { g: 'm', speed: 0.88, desc: 'friendly' },
  M5: { g: 'm', speed: 0.93, desc: 'deep, older (sentences only)' },
};
export const SLOW = 0.66; // slow clips: speed × SLOW, read in short phrases with pauses (≈3.4 syllables a second)

// Lesson audio alternates teachers so she hears more than one speaker.
export const TEACHERS = { f: 'F1', m: 'M2' };

// Story characters (FOLK in art/toon/folk.js) and lesson role-play speakers.
export const CAST = {
  me: 'F1', minji: 'F2', grandma: 'F5', head: 'F3', pharm: 'F3', mom: 'F3', staff: 'F4', woman: 'F4',
  younggrandma: 'F2', girl: 'F2', narrator: 'F3',
  jiji: 'M1', boy: 'M1', grandpa: 'M4', baker: 'M4', clerk: 'M2', man: 'M2', dad: 'M2', driver: 'M3', captain: 'M5',
};

const hash = (s) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return Math.abs(x); };

// The exact string a clip is made from: what speech.js would hand to the engine.
// Glosses in brackets ("저는 비빔밥을 먹어요. (먹다)") are for reading, not for saying; in a filled-in number drill
// ("15,000원 = 만 오천 원") she hears the Korean reading on the right.
export const speechText = (t) => String(t).split(/\s=\s/).pop().replace(/\s*\([^)]*\)/g, '').replace(/[“”"「」『』]/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/~/g, '').replace(/\s+/g, ' ').trim();

// Voice for a line. Lesson text: the same text always gets the same teacher, so replays sound identical.
export function castVoice(text, who = '', mix = true) {
  if (who && CAST[who]) return CAST[who];
  if (who === 'teacher' || !mix) return TEACHERS.f;
  return hash(String(text)) % 3 === 2 ? TEACHERS.m : TEACHERS.f;
}

// Clip file name (without folder): changes when the text, voice, its speed or STUDIO_VERSION change, so the
// builder re-renders exactly what changed. FNV-1a, base36.
export function clipName(voice, slow, text) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (const c of `${STUDIO_VERSION}|${voice}|${VOICES[voice]?.speed}|${slow ? SLOW : 'n'}|${text}`) {
    const k = c.codePointAt(0);
    h1 = Math.imul(h1 ^ k, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ k, 2246822519) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

// Lines the app says outside the course content (settings samples), so they get studio clips too.
export const EXTRA_LINES = [
  '안녕하세요. 오늘 저녁에 같이 한국어 공부해요. 천천히 해도 괜찮아요.',
];
