// Studio voice playback in a real headless browser: covered lines play their Ogg clip (normal / slow / per
// character), uncovered lines and the "Browser voice" setting go to speechSynthesis, conversations take turns in two
// voices, and moving on (stop, answer before autoplay, route change) silences the line. Needs node tools/serve.mjs.
//   node tools/test/voice-play.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const port = process.env.PORT || 5173;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = JSON.parse(readFileSync(new URL('../../app/voice/index.json', import.meta.url), 'utf8'));
const entries = Object.entries(manifest.lines);
const pickLine = (f) => entries.find(([, v]) => f(v.split(' ')))?.[0];
const plain = pickLine((v) => v.some((x) => !x.endsWith('s')) && v.some((x) => x.endsWith('s')));
const long = entries.find(([t, v]) => t.length > 25 && v.split(' ').some((x) => !x.endsWith('s')))?.[0];
if (!plain) { console.log('no clips yet — run node tools/voice/build-voice.mjs'); process.exit(1); }

const PAGE = `(async (plain, long) => {
  const sp = await import('./js/lib/speech.js');
  for (let i = 0; i < 50 && !sp.hasStudio(); i++) await new Promise((r) => setTimeout(r, 100));
  const log = [];
  const realPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { log.push({ kind: 'clip', rate: this.playbackRate }); return realPlay.call(this); };
  speechSynthesis.speak = (u) => { log.push({ kind: 'browser', text: u.text }); setTimeout(() => u.onend && u.onend(), 30); };
  const urls = [];
  const realFetch = fetch;
  window.fetch = (u, ...a) => { urls.push(String(u)); return realFetch(u, ...a); };
  const run = async (name, fn) => { log.length = 0; urls.length = 0; await fn(); return { name, log: log.slice(), urls: urls.slice() }; };
  const out = { studio: sp.hasStudio() };
  out.normal = await run('normal', () => sp.speak(plain));
  out.slow = await run('slow', () => sp.speak(plain, { slow: true }));
  out.missing = await run('missing', () => sp.speak('이 문장은 클립이 없습니다 정말로요'));
  // Jiji in the corner: her own clip, or silence (never a stand-in voice).
  const vc = await import('./js/lib/voicecast.js');
  out.jiji = await run('jiji', () => sp.speak('수고했어요!', { who: 'jiji', studioOnly: true }));
  out.jijiName = vc.clipName('jiji', false, '수고했어요!');
  out.jijiNone = await run('jiji-none', () => sp.speak('이 문장은 클립이 없습니다 정말로요', { who: 'jiji', studioOnly: true }));
  // A conversation: one clip per turn, each in its speaker's voice (two different voices).
  const dlg = '주말에 뭐 할 거예요?\\n친구 결혼식이 있어서 대전에 가요.';
  out.dialogueWant = vc.dialogueTurns(dlg).map(([t, v]) => vc.clipName(v, false, t));
  out.dialogue = await run('dialogue', () => sp.speak(dlg));
  // Moving on silences the old line: a stop mid-clip, a cancelled autoplay timer, a route change.
  const audios = [];
  HTMLMediaElement.prototype.play = function () { audios.push(this); log.push({ kind: 'clip' }); return realPlay.call(this); };
  const sounding = () => audios.some((a) => !a.paused && !a.ended);
  let p = sp.speak(long);
  await new Promise((r) => setTimeout(r, 400));
  out.stopWasPlaying = sounding();
  sp.stopSpeaking();
  await p;
  out.stopSilent = !sounding();
  log.length = 0;
  sp.speakSoon(long, {}, 150);
  sp.stopSpeaking(); // she answered before the autoplay started
  await new Promise((r) => setTimeout(r, 600));
  out.soonCancelled = log.length === 0;
  p = sp.speak(long);
  await new Promise((r) => setTimeout(r, 400));
  out.routeWasPlaying = sounding();
  location.hash = '#/course';
  await p;
  out.routeSilent = !sounding();
  sp.setSpeechPrefs({ engine: 'browser' });
  out.browser = await run('browser', () => sp.speak(plain));
  sp.setSpeechPrefs({ engine: 'studio' });
  const errs = document.getElementById('__errors');
  out.errors = errs ? errs.textContent : '';
  return JSON.stringify(out);
})`;

const profile = mkdtempSync(join(tmpdir(), 'dalbit-voice-'));
const dbg = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(exe, ['--headless=new', '--disable-gpu', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${profile}`, `--remote-debugging-port=${dbg}`,
  `http://localhost:${port}/?demo=1&nosw#/home`], { stdio: 'ignore' });
let failed = 0;
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(500);
    try { target = (await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* not up yet */ }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const evalJS = (expression) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } })); });
  await sleep(2500);
  const m = await evalJS(`(${PAGE})(${JSON.stringify(plain)}, ${JSON.stringify(long)})`);
  const r = JSON.parse(m.result?.result?.value || '{}');
  const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
  check(r.studio, 'manifest loaded');
  check(r.normal?.log.length && r.normal.log.every((x) => x.kind === 'clip'), `"${plain}" plays a studio clip`);
  check(r.slow?.log[0]?.kind === 'clip' && r.slow.urls[0] !== r.normal.urls[0], 'slow plays the separate slow clip');
  check(r.missing?.log[0]?.kind === 'browser', 'line without a clip falls back to the browser voice');
  check(r.browser?.log[0]?.kind === 'browser', 'Browser voice setting uses speechSynthesis');
  check(r.jiji?.log[0]?.kind === 'clip' && r.jiji.urls.some((u) => u.includes(r.jijiName)), 'Jiji speaks her corner line in her own voice');
  check(r.jijiNone?.log.length === 0, 'Jiji stays silent when she has no clip');
  check(r.dialogue?.log.length === 2 && r.dialogue.log.every((x) => x.kind === 'clip') && r.dialogueWant?.every((n, i) => r.dialogue.urls.filter((u) => u.includes('/clips/'))[i]?.includes(n)),
    'a conversation plays each turn in its own speaker’s voice');
  check(r.stopWasPlaying && r.stopSilent, 'stopSpeaking() silences a clip mid-line');
  check(r.soonCancelled, 'an autoplay that has not started yet is cancelled when she answers');
  check(r.routeWasPlaying && r.routeSilent, 'leaving a screen silences it');
  const { CAST_INTRO } = await import('../../app/js/lib/voicecast.js');
  const miss = CAST_INTRO.filter(([who, , , t]) => !(manifest.lines[t] || '').split(' ').includes(who));
  check(!miss.length, `Meet the cast: every character has their own clip ${miss.map((x) => x[0]).join(' ')}`);
  check(!r.errors, `no runtime errors ${r.errors || ''}`);
  if (!r.studio) console.log(JSON.stringify(m).slice(0, 600));
} finally {
  proc.kill();
}
process.exit(failed ? 1 : 0);
