// App state + persistence. Everything lives in her browser (IndexedDB, localStorage fallback).
// The API key is stored separately and is never part of backups.

import { dayKey } from './srs.js';

const DB = 'dalbit', STORE = 'kv', KEY = 'state', LS_KEY = 'dalbit.state', KEY_LS = 'dalbit.apikey';
const SCHEMA = 1;

export function defaultState() {
  return {
    schema: SCHEMA,
    created: Date.now(),
    profile: {
      name: '', catName: '지지', onboarded: false,
      look: { hair: 'bob', hairColor: '#3b2a22', skin: '#f2d3bd', coat: '#e9dcc4' },
    },
    settings: {
      minutes: 15, newPerDay: 10, romanization: 'auto', theme: 'auto', voice: '', rate: 0.9,
      speaking: true, storyEnglish: false, autoplay: true, sound: true,
    },
    placement: null,      // { theta, se, level, skills, startChapter, at, history: [] }
    progress: {},         // itemId -> srs record
    lessons: {},          // lessonId -> { done, runs, at }
    chapters: {},         // chapterId -> { exam, passed, testedOut, spoke, started }
    stories: {},          // episodeId -> { read, quiz, rewind }
    skills: {},           // skill -> { theta, n }
    log: {},              // 'YYYY-MM-DD' -> { ex, ok, ms, new }
    recap: { last: 0, lessonsSince: 0 },
    ai: { mode: 'off', model: '', web: true },
    packs: {},            // AI-made lesson packs / episodes (validated data)
    chat: [],             // recent Ask-Jiji messages
    meta: { lastVersion: '', lastBackup: 0 },
  };
}

let state = defaultState();
let timer = null;
const listeners = new Set();

export const getState = () => state;
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function idb() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in globalThis)) return rej(new Error('no idb'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((res, rej) => {
    const q = db.transaction(STORE).objectStore(STORE).get(key);
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
}
async function idbSet(key, val) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}

function merge(base, saved) {
  for (const k of Object.keys(saved || {})) {
    const v = saved[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], v);
    else base[k] = v;
  }
  return base;
}

export async function loadState() {
  let saved = null;
  try { saved = await idbGet(KEY); } catch { /* fall through */ }
  if (!saved) { try { saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { saved = null; } }
  state = merge(defaultState(), saved || {});
  try { navigator.storage?.persist?.(); } catch { /* optional */ }
  return state;
}

async function writeNow() {
  timer = null;
  const json = JSON.parse(JSON.stringify(state));
  try { await idbSet(KEY, json); } catch {
    try { localStorage.setItem(LS_KEY, JSON.stringify(json)); } catch { /* storage full or blocked */ }
  }
}
export function save() { if (!timer) timer = setTimeout(writeNow, 400); }
export function flush() { if (timer) { clearTimeout(timer); return writeNow(); } }

export function update(fn) {
  fn(state);
  save();
  for (const l of listeners) l(state);
}

export function logActivity({ ex = 0, ok = 0, ms = 0, learned = 0 }) {
  const k = dayKey();
  const d = (state.log[k] ||= { ex: 0, ok: 0, ms: 0, new: 0 });
  d.ex += ex; d.ok += ok; d.ms += Math.min(ms, 60000); d.new += learned;
  save();
}

export function exportBackup() {
  const data = { app: 'dalbit', exported: new Date().toISOString(), state };
  state.meta.lastBackup = Date.now();
  save();
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}
export async function importBackup(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'dalbit' || typeof data.state !== 'object') throw new Error('This is not a Dalbit backup file.');
  state = merge(defaultState(), data.state);
  await writeNow();
  for (const l of listeners) l(state);
}
export async function resetAll() {
  state = defaultState();
  await writeNow();
  for (const l of listeners) l(state);
}

export const getApiKey = () => { try { return localStorage.getItem(KEY_LS) || ''; } catch { return ''; } };
export const setApiKey = (k) => { try { k ? localStorage.setItem(KEY_LS, k) : localStorage.removeItem(KEY_LS); } catch { /* blocked */ } };

globalThis.addEventListener?.('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
globalThis.addEventListener?.('pagehide', () => flush());
