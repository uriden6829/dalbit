// End-to-end: plays whole study sessions in headless Edge/Chrome through the DevTools protocol,
// answering like a so-so learner, and fails on any runtime error or if the summary never appears.
// Needs the preview server (node tools/serve.mjs).   node tools/e2e.mjs [route ...]
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const port = process.env.PORT || 5173;
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['study/lesson/c01-l2', 'study/lesson/h0-l2', 'study/exam/c01', 'study/daily'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs inside the page: performs one user action on whatever is on screen. Returns a status string.
const STEP = `(() => {
  const q = (s) => [...document.querySelectorAll(s)];
  const vis = (el) => el && el.offsetParent !== null && !el.disabled;
  const errs = document.getElementById('__errors');
  if (errs && errs.textContent.trim()) return 'error:' + errs.textContent.slice(0, 400);
  if (document.querySelector('.summary') || document.body.textContent.includes('Entrance exam results')) return 'done';
  const self = q('.choice-card').find(vis); if (self) { q('.choice-card')[2].click(); return 'self-assess'; }
  const skipSpeak = q('button').find((b) => vis(b) && b.textContent.trim() === 'Skip speaking'); if (skipSpeak) { skipSpeak.click(); return 'skip-speak'; }
  const cont = q('.feedback .btn.primary').find(vis); if (cont) { cont.click(); return 'continue'; }
  const got = q('.btn.primary.big').find(vis); if (got) { got.click(); return 'intro'; }
  const cant = q('.speak-area .linkish').find(vis); if (cant) { cant.click(); return 'skip-speak'; }
  const match = document.querySelector('.match');
  if (match) {
    const l = q('.match .opt.ko-opt').filter((b) => !b.classList.contains('gone'));
    const r = q('.match .opt:not(.ko-opt)').filter((b) => !b.classList.contains('gone'));
    if (l.length && r.length) { l[0].click(); r[Math.floor(Math.random() * r.length)].click(); return 'match'; }
    return 'match-wait';
  }
  const tiles = q('.tiles-bank .tilebtn:not(.used)').filter(vis);
  const check = q('.btn.primary').find((b) => b.textContent.trim() === 'Check');
  if (check && !check.disabled) { check.click(); return 'check'; }
  if (tiles.length) { tiles[0].click(); return 'tile'; }
  const opts = q('.options .opt').filter(vis);
  if (opts.length) { opts[Math.floor(Math.random() * opts.length)].click(); return 'choice'; }
  return 'idle';
})()`;

async function run(route) {
  const profile = mkdtempSync(join(tmpdir(), 'dalbit-e2e-'));
  const dbg = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(exe, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${dbg}`,
    `http://localhost:${port}/?demo=1&nosw#/${route}`], { stdio: 'ignore' });
  try {
    let target;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(500);
      try { target = (await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* not up yet */ }
    }
    if (!target) return 'browser did not start';
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const evalJS = (expression) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, returnByValue: true } })); });
    await sleep(2500);
    const counts = {};
    for (let step = 0; step < 900; step++) {
      const res = (await evalJS(STEP)).result?.result?.value || 'none';
      const kind = res.split(':')[0];
      counts[kind] = (counts[kind] || 0) + 1;
      if (res === 'done') { ws.close(); return `ok ${JSON.stringify(counts)}`; }
      if (res.startsWith('error')) { ws.close(); return res; }
      await sleep(kind === 'match' ? 700 : kind === 'choice' || kind === 'check' ? 120 : 60);
    }
    ws.close();
    return `never finished ${JSON.stringify(counts)}`;
  } finally { proc.kill(); }
}

let failed = 0;
for (const r of routes) {
  const res = await run(r);
  if (!res.startsWith('ok')) failed++;
  console.log(`${res.startsWith('ok') ? '✓' : '✗'} ${r}  ${res}`);
}
process.exit(failed ? 1 : 0);
