// Studio voices: who says what. Shared by the app (speech.js picks the clip) and the voice builder
// (tools/voice/build-voice.mjs renders the clips), so both always agree on the voice for a line.
//
// The clips are made ahead of time with Supertonic 3 (Supertone's on-device neural TTS, 10 preset voices) and
// shipped as small Ogg Opus files in app/voice/. Text the builder never saw (AI lessons, Ask replies) falls back
// to the browser voice.

// Bump to re-render every clip (new engine, new settings). Part of every clip's file name.
export const STUDIO_VERSION = 1;

// Ten preset voices (the teachers, and the roots the character voices below are blended from). speed = the engine's speaking-speed setting for a learner-friendly pace (measured, see
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
  // The man teacher: M2 with a little of M4's warmth, which measured more natural (UTMOS 3.87 → 4.0, level with
  // F1), read single words more clearly, and is still recognisably the same man (task-69 NOTES.md "Follow-up 2").
  M2: { g: 'm', speed: 0.88, mix: { ttl: { M2: 0.7, M4: 0.3 } }, shift: 0, desc: 'calm, clear, warm — the man teacher' },
  M3: { g: 'm', speed: 0.8, desc: 'brisk (sentences only)' },
  M4: { g: 'm', speed: 0.88, desc: 'friendly' },
  M5: { g: 'm', speed: 0.93, desc: 'deep, older (sentences only)' },
};
export const SLOW = 0.66; // slow clips: speed × SLOW, read in short phrases with pauses (≈3.4 syllables a second)
// A voice may set its own `slow` factor instead: below an engine speed of ≈0.5 the model repeats words.

// Character voices, designed for the story cast: a blend of the preset voices (ttl = timbre, dp = rhythm, weights),
// a speed, and a shift in semitones (resampling: + higher and smaller, − bigger and darker). Measured in the
// voice lab (task-69 NOTES.md "Voice personas"): every pair of characters who talk in the same episode sounds like
// two different people (speaker-embedding check), and every blend reads back cleanly in Whisper.
// Ids are the CAST keys; none may end in "s" (the manifest marks slow clips with a trailing s).
const D = (g, ttl, speed, shift = 0, dp = null, desc = '') => ({ g, mix: dp ? { ttl, dp } : { ttl }, speed, shift, desc });
Object.assign(VOICES, {
  // Jiji, the academy's black cat (a she). Modelled on Jiji in Kiki's Delivery Service (Rei Sakuma's Japanese
  // voice): a small, high, cheeky little cat with a boyish edge. Mostly the light young M1 voice with F4's lively
  // rhythm, raised 4 semitones (≈230 Hz and a smaller "body"), so she sounds small without sounding like the
  // girl or Minji (task-69 NOTES.md "Follow-up 3"). Replaces v1.3's low, dry alto. Slow: × 0.8, since the shift
  // already asks the engine for 0.8 / 1.26 and × 0.66 on top made it stutter (≈4.2 syllables a second slow).
  jiji: { ...D('f', { F4: 0.4, M1: 0.6 }, 0.8, 4, { F4: 1 }, 'Jiji: small, high, cheeky — a little black cat with opinions'), slow: 0.8 },
  me: D('f', { F1: 0.5, F4: 0.5 }, 0.9, 0.5, null, 'you: young, earnest, a little brighter than the teacher'),
  minji: D('f', { F2: 1 }, 0.92, 1.2, { F2: 1 }, 'Minji: bright, quick, the youngest adult voice'),
  grandma: D('f', { F5: 0.6, F3: 0.4 }, 0.84, -0.7, { F5: 1 }, 'Grandma: warm, low, unhurried'),
  younggrandma: D('f', { F5: 0.5, F2: 0.5 }, 0.88, 0.3, null, 'Grandma in 1974: her voice fifty years younger'),
  head: D('f', { F3: 0.7, F4: 0.3 }, 0.86, 0, { F3: 1 }, 'Teacher Seo: soft, measured, timeless'),
  mom: D('f', { F4: 0.5, F1: 0.3, F5: 0.2 }, 0.88, -0.4, null, 'Minji’s mother: gentle, grown-up'),
  pharm: D('f', { F4: 0.7, F3: 0.3 }, 0.9, 0, null, 'pharmacist: crisp, professional'),
  staff: D('f', { F4: 0.6, F5: 0.4 }, 0.9, 0, null, 'market stall: lively'),
  woman: D('f', { F3: 0.5, F1: 0.5 }, 0.9, 0.3, null, 'café customer'),
  girl: D('f', { F1: 0.5, F2: 0.5 }, 0.92, 3.2, null, 'a child'),
  boy: D('m', { M1: 1 }, 0.92, 3, null, 'a child'),
  captain: D('m', { M5: 1 }, 0.8, -1.2, null, 'the Captain: deep, weathered, few words'),
  grandpa: D('m', { M1: 0.7, M4: 0.3 }, 0.84, 0.3, null, 'the young sailor in 1974: light, shy'),
  baker: D('m', { M4: 0.6, M1: 0.4 }, 0.86, -0.5, null, 'Minji’s father: the sailor’s son, so a little of his voice, older'),
  driver: D('m', { M3: 0.8, M5: 0.2 }, 0.9, -0.3, null, 'bus driver: brisk, matter-of-fact'),
  clerk: D('m', { M1: 0.7, M3: 0.3 }, 0.92, 0, null, 'shop clerk: young'),
  man: D('m', { M4: 0.5, M5: 0.5 }, 0.9, -0.3, null, 'café customer'),
});

// Lesson audio alternates teachers so she hears more than one speaker.
export const TEACHERS = { f: 'F1', m: 'M2' };

// Story characters (FOLK in art/toon/folk.js) and lesson role-play speakers: their own designed voice.
export const CAST = {
  ...Object.fromEntries(Object.keys(VOICES).filter((v) => VOICES[v].mix).map((v) => [v, v])),
  dad: 'baker', narrator: 'F3',
};

// Clip-name key of a voice: presets keep their old key (speed), so adding characters re-renders nothing else.
const voiceKey = (v) => { const d = VOICES[v]; return d?.mix ? JSON.stringify([d.speed, d.mix, d.shift]) : d?.speed; };

const hash = (s) => { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return Math.abs(x); };

// The exact string a clip is made from: what speech.js would hand to the engine.
// Glosses in brackets ("저는 비빔밥을 먹어요. (먹다)") are for reading, not for saying; in a filled-in number drill
// ("15,000원 = 만 오천 원") she hears the Korean reading on the right.
export const speechText = (t) => String(t).split(/\s=\s/).pop().replace(/\s*\([^)]*\)/g, '').replace(/[“”"「」『』]/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/~/g, '').replace(/\s+/g, ' ').trim();

// Voice for a line. Lesson text: the same text always gets the same teacher, so replays sound identical.
// `who` may also name a voice directly (a turn in a conversation, below).
export function castVoice(text, who = '', mix = true) {
  if (who && CAST[who]) return CAST[who];
  if (who && VOICES[who]) return who;
  if (who === 'teacher' || !mix) return TEACHERS.f;
  return hash(String(text)) % 3 === 2 ? TEACHERS.m : TEACHERS.f;
}

// Example conversations are written one turn per line: '주말에 뭐 할 거예요?\n친구 결혼식이 있어서 대전에 가요.'
// Two people are talking, so the turns alternate between the two teachers, a woman and a man — always, even with
// "one voice" in Settings, because who is speaking is part of the meaning ("Why is the second speaker…?"). Who speaks
// first depends on the text, so she hears both. Returns [[turn, voice], …]; a plain line is one turn in its usual voice.
// Every turn ends like a sentence (. ! ? …); other multi-line text (a menu: '카페 메뉴\n라떼 3,500원') is one voice.
export function dialogueTurns(text, who = '', mix = true) {
  const turns = String(text).split('\n').map((t) => t.trim()).filter(Boolean);
  if (turns.length < 2 || !turns.every((t) => /[.!?…]$/.test(t))) return [[String(text), castVoice(speechText(text), who, mix)]];
  const pair = hash(turns[0]) % 2 ? [TEACHERS.m, TEACHERS.f] : [TEACHERS.f, TEACHERS.m];
  return turns.map((t, i) => [t, pair[i % 2]]);
}

// Clip file name (without folder): changes when the text, voice, its speed or STUDIO_VERSION change, so the
// builder re-renders exactly what changed. FNV-1a, base36.
export function clipName(voice, slow, text) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (const c of `${STUDIO_VERSION}|${voice}|${voiceKey(voice)}|${slow ? VOICES[voice]?.slow || SLOW : 'n'}|${text}`) {
    const k = c.codePointAt(0);
    h1 = Math.imul(h1 ^ k, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ k, 2246822519) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

// The Korean Jiji says out loud from a mixed bubble: '수고했어요! Good work tonight.' -> '수고했어요!',
// 'Slowly now. 천천히.' -> '천천히.' (a Hangul run up to its end mark; English stays written only).
export const jijiKorean = (t) => (String(t).match(/[가-힣][가-힣\s,]*[.!?…]?/g) || []).map((s) => s.trim()).join(' ');

// Settings → "Meet the cast": one line each, from the story (so the clips exist). No spoilers: the 1974
// flashback voices stay a surprise.
export const CAST_INTRO = [
  ['jiji', '지지', 'Jiji', '제 이름은 지지예요.'],
  ['me', '나', 'You', '저는 학생이에요. 마법 학생이에요.'],
  ['minji', '민지', 'Minji', '안녕하세요! 저는 민지예요.'],
  ['grandma', '할머니', 'Grandma', '만나서 반가워요. 이름이 뭐예요?'],
  ['head', '서 선생님', 'Teacher Seo', '어서 와요.'],
  ['captain', '선장님', 'the Captain', '등대가… 또 어두워요.'],
  ['baker', '민지 아버지', 'Minji’s father', '어머니, 이제 주무세요.'],
  ['mom', '민지 어머니', 'Minji’s mother', '어머님, 차 드세요.'],
  ['driver', '기사님', 'the bus driver', '여기서 내리세요. 똑바로 가서 왼쪽이에요.'],
  ['pharm', '약사', 'the pharmacist', '어서 오세요. 어디가 아프세요?'],
  ['staff', '직원', 'the market stall', '어서 오세요! 사과 사세요!'],
];

// Lines the app says outside the course content (settings samples), so they get studio clips too.
export const EXTRA_LINES = [
  '안녕하세요. 오늘 저녁에 같이 한국어 공부해요. 천천히 해도 괜찮아요.',
];
