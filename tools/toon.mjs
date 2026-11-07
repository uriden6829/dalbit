// Webtoon drawing tool (the pixel-art app's workflow, for Dalbit toons): render, review, critique.
//   node tools/toon.mjs sheet ep04 [out.png]     contact sheet of every panel (numbered) — look at it
//   node tools/toon.mjs critique ep04            storytelling + pixel checks for one episode (or "all")
//   node tools/toon.mjs lab cast|moods|figures|scenes [out.png]   the character / scene line-ups
// Needs the preview server (node tools/serve.mjs). Panels are data in app/content/story/*.js; the art engine is
// app/js/art/toon/ (folk.js characters, vista.js backgrounds, compose.js shots + props + effects).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { decodePNG } from './lib/png.mjs';
import { episodes } from '../app/content/index.js';
import { panelH } from '../app/js/art/toon/compose.js';

const [cmd = 'critique', arg = 'all', outArg] = process.argv.slice(2);
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
const port = process.env.PORT || 5173;

function shot(path, out, w, h) {
  const profile = mkdtempSync(join(tmpdir(), 'dalbit-toon-'));
  execFileSync(exe, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`, `--window-size=${w},${h}`,
    '--virtual-time-budget=6000', `--screenshot=${resolve(out)}`, `http://localhost:${port}${path}`], { stdio: 'ignore', timeout: 90000 });
  return resolve(out);
}

// ---- storytelling checks (data) ----
function storyCritique(ep) {
  const notes = [];
  const P = ep.panels;
  if (P.length < 10) notes.push(`only ${P.length} panels — a scene needs room to breathe`);
  if (!['establish', 'wide'].includes(P[0].shot)) notes.push('panel 0: open on an establishing or wide shot so the reader knows where we are');
  P.forEach((p, i) => {
    const prev = P.slice(0, i).reverse().find((q) => q.shot !== 'detail');
    if (prev && p.shot !== 'detail' && prev.scene !== p.scene && p.shot !== 'detail' && !['establish', 'wide', 'flight'].includes(p.shot)) notes.push(`panel ${i}: new scene "${p.scene}" starts on a ${p.shot} — consider a wide shot first`);
    if (i >= 3 && [P[i - 1], P[i - 2], P[i - 3]].every((q) => q.shot === p.shot && q.scene === p.scene)) notes.push(`panel ${i}: four ${p.shot} shots in a row — vary the camera`);
    for (const l of p.lines || []) {
      if ((l.ko || l.en).length > 70) notes.push(`panel ${i}: long bubble (${(l.ko || l.en).length} chars) — split it`);
      if (l.who !== 'me' && l.who !== 'jiji' && p.shot !== 'detail' && !(p.cast || []).some(([w]) => w === l.who)) notes.push(`panel ${i}: ${l.who} speaks but is not in the panel`);
    }
    if ((p.lines || []).length > 3) notes.push(`panel ${i}: ${p.lines.length} bubbles — crowded`);
  });
  const talk = P.filter((p) => p.lines?.length).length, silent = P.length - talk;
  if (silent < 2) notes.push('fewer than 2 silent panels — give the art a moment without words');
  const last = P[P.length - 1];
  if (!last.note && !(last.lines || []).length) notes.push('last panel has no line or caption — end on a hook');
  return notes;
}

// ---- pixel checks (rendered) — same idea as the pixel-art app's critique: contrast, darkness, flatness ----
function pixelCritique(id) {
  const ep = episodes.get(id);
  const rows = Math.ceil(ep.panels.length / 4);
  const file = shot(`/toonlab.html?view=grid&ep=${id}`, join(tmpdir(), `toon-${id}.png`), 1480, rows * 340 + 10);
  const img = decodePNG(readFileSync(file));
  const notes = [];
  ep.panels.forEach((p, i) => {
    const x0 = (i % 4) * 370, y0 = Math.floor(i / 4) * 340, h = Math.min(330, panelH({ ...p, h: Math.min(p.h || 0, 0.9) || undefined }));
    let n = 0, sum = 0, sq = 0;
    for (let y = y0; y < y0 + h; y += 3) for (let x = x0; x < x0 + 360; x += 3) {
      const k = (y * img.width + x) * 4, L = (0.2126 * img.data[k] + 0.7152 * img.data[k + 1] + 0.0722 * img.data[k + 2]) / 255;
      n++; sum += L; sq += L * L;
    }
    const mean = sum / n, sd = Math.sqrt(Math.max(0, sq / n - mean * mean));
    if (mean < 0.1) notes.push(`panel ${i}: very dark (mean ${mean.toFixed(2)}) — lift the key light or add a glow`);
    if (sd < 0.07) notes.push(`panel ${i}: flat/low contrast (sd ${sd.toFixed(2)}) — separate figure and background values`);
  });
  return { notes, file };
}

if (cmd === 'sheet') {
  const ep = episodes.get(arg);
  const rows = Math.ceil(ep.panels.length / 4);
  console.log('saved', shot(`/toonlab.html?view=episode&ep=${arg}`, outArg || `toon-${arg}.png`, 1500, rows * 360 + 80));
} else if (cmd === 'lab') {
  console.log('saved', shot(`/toonlab.html?view=${arg}`, outArg || `toon-${arg}.png`, 1500, 1600));
} else {
  const ids = arg === 'all' ? [...episodes.keys()] : [arg];
  let total = 0;
  for (const id of ids) {
    const ep = episodes.get(id);
    if (!ep?.panels[0]?.shot) continue;
    const s = storyCritique(ep);
    const px = process.argv.includes('--no-pixels') ? { notes: [] } : pixelCritique(id);
    const all = [...s, ...px.notes];
    total += all.length;
    console.log(`\n${id} ${ep.title.ko} (${ep.panels.length} panels): ${all.length ? '' : 'no notes'}`);
    for (const n of all) console.log('  - ' + n);
  }
  console.log(`\n${total} note(s). Notes are suggestions, not errors.`);
}
