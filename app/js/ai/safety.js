// Everything an AI (or a pasted reply, or a web page via the AI) produces is untrusted data.
// Defence in depth:
//  1. Prompts tell the model that retrieved/pasted content is data, never instructions.
//  2. Replies are parsed as JSON and rebuilt field by field from a whitelist (unknown fields dropped).
//  3. Every string is cleaned: no HTML, no links, no control or invisible characters, length-capped.
//  4. Strings that look like injection, phishing or requests for secrets cause the whole pack to be rejected.
//  5. The UI renders text with textContent only, and the page's CSP only allows network calls to
//     this site, Google Fonts and api.anthropic.com — nothing can be sent elsewhere.
import { SCENES } from '../art/scenes.js';
import { CAST } from '../art/people.js';

const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g;
const RED_FLAGS = [
  [/ignore (all |any |the )?(previous|prior|above|earlier) (instructions|prompts|rules)/i, 'instruction override'],
  [/(system|developer) (prompt|message)|you are now|jailbreak|\bDAN\b/i, 'role manipulation'],
  [/api[ _-]?key|your (password|pin|passcode|card number|account number)|credit card number|security code|비밀번호를 (알려|입력)/i, 'asks for secrets'],
  [/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co\.kr|or\.kr|kr)\b/i, 'contains a link'],
  [/<\s*script|javascript:|on(click|error|load|mouseover)\s*=/i, 'code'],
  [/\b(verify your|log ?in to|sign ?in to|enter your|click (here|this|the link)|visit (this|the) (site|page|link))\b/i, 'asks for an action'],
];

export function flags(text) {
  return RED_FLAGS.filter(([re]) => re.test(text)).map(([, label]) => label);
}

export function clean(s, max = 300) {
  if (s == null) return '';
  return String(s)
    .replace(INVISIBLE, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, max);
}

const hasHangul = (s) => /[가-힣]/.test(s);

// Finds a JSON object in a model reply (raw, fenced, or surrounded by prose).
export function parseJSONLoose(text) {
  const t = String(text || '');
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  const candidates = [];
  if (fence) candidates.push(fence[1]);
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) candidates.push(t.slice(a, b + 1));
  for (const c of candidates) { try { return JSON.parse(c); } catch { /* try next */ } }
  throw new Error('No readable lesson data was found in the reply. Make sure you copied the whole answer.');
}

const MOODS = ['neutral', 'smile', 'happy', 'talk', 'surprised', 'sad', 'think', 'sleepy', 'sick', 'idle', 'smug'];
const WHO = new Set(['me', 'jiji', ...Object.keys(CAST)]);
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

function quiz(list, problems) {
  return arr(list, 4).map((q) => {
    const [qq, opts, ans] = Array.isArray(q) ? q : [q?.q, q?.options, q?.answer];
    const o = arr(opts, 4).map((x) => clean(x, 120)).filter(Boolean);
    const a = Math.round(num(ans, 0, o.length - 1, 0));
    if (o.length < 2 || !clean(qq)) { problems.push('a question was incomplete'); return null; }
    return [clean(qq, 200), o, a];
  }).filter(Boolean);
}

// Rebuilds a lesson pack from untrusted JSON. Returns { pack, problems } or throws with reasons.
export function validatePack(raw, { level = -2 } = {}) {
  if (!raw || typeof raw !== 'object') throw new Error('The reply was not a lesson.');
  const problems = [];
  const id = `x${Date.now().toString(36)}`;
  const title = { ko: clean(raw.title?.ko, 40), en: clean(raw.title?.en, 60) };
  if (!title.en) title.en = 'Your request';
  if (!hasHangul(title.ko)) title.ko = '부탁';
  const words = arr(raw.words, 20).map((w) => ({ kind: 'word', key: clean(w?.ko, 40), ko: clean(w?.ko, 40), en: clean(w?.en, 120), hint: clean(w?.hint, 200),
    ex: w?.ex && hasHangul(clean(w.ex.ko)) ? { ko: clean(w.ex.ko, 120), en: clean(w.ex.en, 160) } : null }))
    .filter((w) => hasHangul(w.ko) && w.en);
  const phrases = arr(raw.phrases, 12).map((p) => ({ kind: 'phrase', key: clean(p?.ko, 120), ko: clean(p?.ko, 120), en: clean(p?.en, 200), hint: clean(p?.note, 200) }))
    .filter((p) => hasHangul(p.ko) && p.en);

  let episode = null;
  if (raw.episode && Array.isArray(raw.episode.panels)) {
    const panels = arr(raw.episode.panels, 12).map((p) => {
      const scene = SCENES[p?.scene] ? p.scene : 'plain';
      const cast = arr(p?.cast, 3).map((c) => {
        const [who, x, mood] = Array.isArray(c) ? c : [c?.who, c?.x, c?.mood];
        return WHO.has(who) ? [who, num(x, 0.12, 0.88, 0.5), MOODS.includes(mood) ? mood : 'neutral'] : null;
      }).filter(Boolean);
      const lines = arr(p?.lines, 3).map((l) => ({ who: WHO.has(l?.who) ? l.who : 'jiji', ko: clean(l?.ko, 120), en: clean(l?.en, 200) }))
        .filter((l) => l.en && (!l.ko || hasHangul(l.ko)));
      const note = clean(p?.note?.en ?? p?.note, 200);
      return { scene, h: ['S', 'M', 'L'].includes(p?.h) ? p.h : 'M', time: p?.time === 'day' || p?.time === 'dusk' ? p.time : 'night', rain: !!p?.rain,
        cast, lines, note: note ? { en: note } : undefined };
    }).filter((p) => p.lines.length || p.note);
    if (panels.length >= 3) {
      episode = { id: `ep-${id}`, title: { ko: clean(raw.episode.title?.ko, 40) || title.ko, en: clean(raw.episode.title?.en, 60) || title.en }, panels, quiz: quiz(raw.episode.quiz, problems) };
    } else problems.push('the story was too short and was left out');
  }

  let reading = null;
  if (raw.reading && hasHangul(clean(raw.reading.ko, 2000))) {
    const source = clean(raw.reading.source, 80).replace(/https?:\S+|www\.\S+|\b[\w-]+\.(com|net|org|io|co\.kr|or\.kr|kr)\b/gi, '').trim();
    reading = { ko: clean(raw.reading.ko, 2000), en: clean(raw.reading.en, 2500), source, questions: quiz(raw.reading.questions, problems) };
  }

  if (words.length + phrases.length < 3 && !reading) throw new Error('The reply didn’t contain enough Korean to make a lesson.');

  // Red-flag scan over every string that survived (the source name was already de-linked above).
  const all = JSON.stringify({ title, words, phrases, episode, reading: reading && { ...reading, source: '' } });
  const red = flags(all);
  if (red.length) throw new Error(`Jiji refused this content (found: ${[...new Set(red)].join(', ')}). That can happen when a web page tries to give the AI instructions. Try a different request.`);

  const lessons = [];
  if (words.length) lessons.push({ id: `${id}-w`, title: { ko: '단어', en: 'Words' }, items: words });
  if (phrases.length) lessons.push({ id: `${id}-p`, title: { ko: '표현', en: 'Phrases' }, items: phrases });
  const pack = { id, extra: true, b: level, created: Date.now(), title, blurb: clean(raw.blurb, 300), lessons, episode, reading };
  return { pack, problems };
}
