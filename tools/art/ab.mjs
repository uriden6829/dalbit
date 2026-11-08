// Before/after LOOK: node ab.mjs <set> <engineA> <engineB> [out.png] [--cell=WxH] [--cols=N] [--grid] [--only=id,id] [--bg=#hex]
//   e.g. node ab.mjs cast git:HEAD app --cols=8      (the same drawing side by side, A then B — judge pairs, not singles)
//   --grid overlays a 10x10 grid so a fix can be placed by coordinates; render bigger cells to inspect detail.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openRenderer } from './render.mjs';
import { buildSets, engine } from './sets.mjs';

const args = process.argv.slice(2);
const flag = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : args.includes(`--${k}`) ? true : d; };
const [set, A = 'git:HEAD', B = 'app', out = join(import.meta.dirname, 'out', `ab-${set}.png`)] = args.filter((a) => !a.startsWith('--'));
const [cw, ch] = String(flag('cell', '220x270')).split('x').map(Number);
const only = flag('only', '') ? String(flag('only')).split(',') : null;
const a = (await buildSets(engine(A), [set]))[set], b = (await buildSets(engine(B), [set]))[set];
const items = [];
a.forEach((it, i) => { if (only && !only.includes(it.id)) return; items.push({ ...it, label: `A · ${it.label}`, bg: flag('bg', it.bg) }, { ...b[i], label: `B · ${b[i].label}`, bg: flag('bg', b[i].bg) }); });
const r = await openRenderer();
writeFileSync(out, await r.sheet(items, { cols: +flag('cols', 6), w: cw, h: ch, grid: !!flag('grid') }));
await r.close();
console.log('saved', out);
