// Smoke test: opens every screen in headless Edge/Chrome (throwaway profile, demo data) and reports
// runtime errors captured by the app. Needs the preview server running (node tools/serve.mjs).
//   node tools/check-routes.mjs [route ...]
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const port = process.env.PORT || 5173;
const routes = process.argv.slice(2).length ? process.argv.slice(2) : [
  'home', 'welcome', 'course', 'chapter/h0', 'chapter/c01', 'chapter/c06', 'study/daily', 'study/lesson/c01-l2', 'study/lesson/h0-l1', 'study/exam/c01',
  'study/review', 'study/recap', 'study/tricky', 'stories', 'story/ep00', 'story/ep01/rewind', 'story/ep05', 'story/ep09', 'story/ep11', 'story/ep12', 'speak', 'speak/c01', 'speak/c01/story',
  'spellbook', 'wordbank', 'wordbank/cards', 'ask', 'settings', 'placement',
];

function load(route, budget = 6000) {
  const profile = mkdtempSync(join(tmpdir(), 'dalbit-check-'));
  const url = `http://localhost:${port}/?demo=1&nosw#/${route}`;
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, `--virtual-time-budget=${budget}`, '--dump-dom', url];
  return new Promise((resolve) => {
    execFile(exe, args, { encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => resolve(stdout || ''));
  });
}

function problems(dom) {
  const m = /<div id="__errors"[^>]*>([\s\S]*?)<\/div><\/body>/.exec(dom);
  if (m) return m[1].replace(/<[^>]+>/g, '\n').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (!dom) return ['no output from browser'];
  if (dom.includes('Something went wrong')) return ['screen showed an error card'];
  if (dom.includes('opening the academy')) return ['still booting when time ran out'];
  return null;
}

let failed = 0;
const queue = [...routes];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const route = queue.shift();
    let p = problems(await load(route));
    if (p && (p[0].startsWith('still booting') || p[0].startsWith('no output'))) p = problems(await load(route, 15000)); // cold-start retry
    if (p) { failed++; console.log(`✗ ${route}\n   ${p.join('\n   ')}`); } else console.log(`✓ ${route}`);
  }
}));
console.log(failed ? `\n${failed} route(s) failed` : '\nall routes rendered');
process.exit(failed ? 1 : 0);
