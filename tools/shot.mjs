// Headless screenshots for visual checks (uses a throwaway Edge/Chrome profile, never the real one).
// node tools/shot.mjs <url-path-and-hash> <out.png> [width] [height]
//   e.g. node tools/shot.mjs "/?demo=1#/home" home.png 1280 900
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [path = '/', out = 'shot.png', w = '1280', hgt = '900'] = process.argv.slice(2);
const browsers = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const exe = browsers.find(existsSync);
if (!exe) { console.error('No Edge/Chrome found'); process.exit(1); }
const profile = mkdtempSync(join(tmpdir(), 'dalbit-shot-'));
const url = `http://localhost:${process.env.PORT || 5173}${path}`;
execFileSync(exe, [
  '--headless=new', ...(process.env.LIGHT ? ['--blink-settings=preferredColorScheme=1'] : []), '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, `--window-size=${w},${hgt}`, `--virtual-time-budget=${process.env.BUDGET || 10000}`,
  `--screenshot=${resolve(out)}`, url,
], { stdio: 'ignore', timeout: 60000 });
console.log('saved', resolve(out));
