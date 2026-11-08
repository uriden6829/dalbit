// Ablations — which change moved which critic? node ablate.mjs <set> <engine> <variants.mjs>
// variants.mjs exports default { name: (svg, item) => svg } — string edits of the drawing (e.g. remove the rim light).
// Prints aes / clipT / iqa (+ each antonym pair) per variant and saves a sheet of the first item of each variant.
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openRenderer } from './render.mjs';
import { openScorer, IQA_PAIRS, cos } from './score.mjs';
import { buildSets, engine } from './sets.mjs';

const [set, spec = 'app', vfile] = process.argv.slice(2);
const items = (await buildSets(engine(spec), [set]))[set];
const V = vfile ? (await import(pathToFileURL(resolve(vfile)).href)).default : { as_is: (s) => s };
const r = await openRenderer();
const sc = await openScorer();
const sheet = [];
for (const [name, fn] of Object.entries(V)) {
  const acc = { aes: 0, clipT: 0, pairs: IQA_PAIRS.map(() => 0) };
  for (const it of items) {
    const svg = fn(it.svg, it);
    const png = await r.png(svg, it.w, it.h, { viewBox: it.viewBox, bg: it.bg || '#fff' });
    const s = await sc.score(png, { prompt: it.prompt });
    acc.aes += s.aes / items.length; acc.clipT += s.clipT / items.length;
    for (const [k, [p, n]] of IQA_PAIRS.entries()) acc.pairs[k] += 1 / (1 + Math.exp((cos(s.embed, await sc.textEmb(n)) - cos(s.embed, await sc.textEmb(p))) * 100)) / items.length;
    if (it === items[0]) sheet.push({ ...it, svg, label: name });
  }
  console.log(`${name.padEnd(14)} aes ${acc.aes.toFixed(3)}  clipT ${acc.clipT.toFixed(4)}  iqa ${(acc.pairs.reduce((a, b) => a + b) / acc.pairs.length).toFixed(3)} [${acc.pairs.map((x) => x.toFixed(2)).join(' ')}]`);
}
writeFileSync(join(import.meta.dirname, 'out', `ablate-${set}.png`), await r.sheet(sheet, { cols: Math.min(6, sheet.length), w: 200, h: 250 }));
await r.close();
