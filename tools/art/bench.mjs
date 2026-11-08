// Render + score an art engine:  node bench.mjs [engine] [label] [set,set] [--no-score]
//   engine: app (default) | git:<ref> | a folder holding art/.   sets: cast moods figures figcast scenes jiji panels
//   Writes out/<label>/<set>.png (contact sheet: LOOK at it), out/<label>/<set>-NN.png and out/<label>/scores.json,
//   and prints per-item aes / iqa / clipT (+ nn for the cast: highest similarity to another character, lower = more distinct).
// Needs the preview server (node tools/serve.mjs). Compare two engines by running it twice with different labels.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openRenderer } from './render.mjs';
import { openScorer, cos } from './score.mjs';
import { buildSets, engine } from './sets.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [spec = 'app', label = spec.replace(/[^\w.-]/g, '_'), setsArg = 'cast,figures,jiji,scenes,panels'] = args;
const noScore = process.argv.includes('--no-score');
const outDir = join(import.meta.dirname, 'out', label);
mkdirSync(outDir, { recursive: true });

const sets = await buildSets(engine(spec), setsArg.split(','));
const r = await openRenderer();
const scorer = noScore ? null : await openScorer();
const result = {};
for (const [name, items] of Object.entries(sets)) {
  const rows = [];
  for (const [i, it] of items.entries()) {
    const png = await r.png(it.svg, it.w, it.h, { viewBox: it.viewBox, bg: it.bg || '#fff' });
    writeFileSync(join(outDir, `${name}-${String(i).padStart(2, '0')}.png`), png);
    rows.push({ id: it.id, ...(scorer ? await scorer.score(png, { prompt: it.prompt }) : {}) });
  }
  const wide = name === 'panels' || name === 'scenes';
  writeFileSync(join(outDir, `${name}.png`), await r.sheet(items, { cols: wide ? 4 : 8, w: wide ? 360 : 200, h: wide ? 300 : /fig/.test(name) ? 300 : 250, title: `${label} · ${name}` }));
  if (!scorer) continue;
  const mean = (k) => rows.reduce((a, x) => a + x[k], 0) / rows.length;
  const sum = { aes: mean('aes'), iqa: mean('iqa'), clipT: mean('clipT') };
  if (name === 'cast') {
    rows.forEach((a, i) => (a.nn = Math.max(...rows.filter((_, j) => j !== i).map((b) => cos(a.embed, b.embed)))));
    sum.nnMean = mean('nn');
  }
  result[name] = { summary: sum, rows: rows.map(({ embed, ...x }) => x) };
  console.log(`\n[${label}] ${name}: aes ${sum.aes.toFixed(3)}  iqa ${sum.iqa.toFixed(3)}  clipT ${sum.clipT.toFixed(4)}${sum.nnMean ? `  nn ${sum.nnMean.toFixed(3)}` : ''}`);
  for (const x of rows) console.log(`  ${x.id.padEnd(14)} aes ${x.aes.toFixed(2)}  iqa ${x.iqa.toFixed(3)}  clipT ${x.clipT.toFixed(4)}${x.nn ? `  nn ${x.nn.toFixed(3)}` : ''}`);
}
if (scorer) writeFileSync(join(outDir, 'scores.json'), JSON.stringify(result, null, 1));
await r.close();
console.log('\nsheets in', outDir);
