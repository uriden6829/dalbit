// Prepares app/ for publishing: writes app/files.json (offline precache list) and stamps sw.js with a
// content hash so installed copies notice the update. Optional: --icons regenerates the app icons.
//   node tools/build.mjs [--icons]
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const app = resolve(fileURLToPath(new URL('../app/', import.meta.url)));
const SKIP = new Set(['sw.js', 'files.json', 'toonlab.html', 'js/art/toon/lab.js']);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (process.argv.includes('--icons')) await icons();

const files = walk(app).map((p) => relative(app, p).replaceAll('\\', '/')).filter((f) => !SKIP.has(f) && !f.startsWith('.')).sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(app, f)));
const build = hash.digest('hex').slice(0, 12);
writeFileSync(join(app, 'files.json'), JSON.stringify({ build, files: ['./', ...files] }, null, 0) + '\n');
const swPath = join(app, 'sw.js');
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/const BUILD = '[^']*';/, `const BUILD = '${build}';`));
console.log(`build ${build}: ${files.length} files`);

async function icons() {
  const { jijiGroup } = await import(pathToFileURL(join(app, 'js/art/jiji.js')).href);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34356f"/><stop offset="1" stop-color="#191a38"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#f6e7b8" stop-opacity=".35"/><stop offset="1" stop-color="#f6e7b8" stop-opacity="0"/></radialGradient></defs>
<rect width="512" height="512" rx="112" fill="url(#bg)"/>
<circle cx="300" cy="200" r="190" fill="url(#glow)"/>
<path d="M392 296A150 150 0 1 1 216 86a118 118 0 0 0 176 210z" fill="#e7c66f"/>
<circle cx="120" cy="120" r="3" fill="#fff" opacity=".8"/><circle cx="420" cy="90" r="2.4" fill="#fff" opacity=".7"/><circle cx="90" cy="300" r="2" fill="#fff" opacity=".6"/>
<g transform="translate(196 214) scale(1.9)">${jijiGroup('happy')}</g>
</svg>`;
  mkdirSync(join(app, 'icons'), { recursive: true });
  writeFileSync(join(app, 'icons/icon.svg'), svg);
  const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => { try { return statSync(p).isFile(); } catch { return false; } });
  if (!exe) { console.warn('No Edge/Chrome: PNG icons not regenerated'); return; }
  const tmp = join(process.env.TEMP || '/tmp', `dalbit-icons-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  for (const size of [192, 512]) {
    // Headless windows have a minimum width, so pin the image to the top-left corner at the exact size.
    const page = join(tmp, `icon-${size}.html`);
    writeFileSync(page, `<!doctype html><body style="margin:0;background:transparent"><img src="${pathToFileURL(join(app, 'icons/icon.svg')).href}" style="position:fixed;left:0;top:0;width:${size}px;height:${size}px">`);
    execFileSync(exe, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', `--user-data-dir=${join(tmp, `p${size}`)}`,
      `--window-size=${size},${size}`, `--screenshot=${join(app, `icons/icon-${size}.png`)}`, pathToFileURL(page).href], { stdio: 'ignore', timeout: 60000 });
  }
  console.log('icons written');
}
