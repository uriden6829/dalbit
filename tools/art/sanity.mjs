// Do the critics still move the right way? Scores the cast against deliberately damaged copies of itself.
// Run after updating the model or the head. Expected (task 70, 16 busts): orig > jitter2 > jitter5 on aes and clipT;
// noline and flat below orig on aes. If not, do not trust bench.mjs numbers until it is understood.
import { join } from 'node:path';
import { openRenderer } from './render.mjs';
import { openScorer } from './score.mjs';
import { buildSets, engine } from './sets.mjs';

const { cast } = await buildSets(engine(process.argv[2] || 'app'), ['cast']);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
const jitter = (amt) => (svg) => svg.replace(/ d="([^"]+)"/g, (_, d) => ` d="${d.replace(/-?\d+(\.\d+)?/g, (n) => (+n + rnd() * 2 * amt).toFixed(1))}"`);
const VARIANTS = {
  orig: (s) => s,
  jitter2: jitter(2),
  jitter5: jitter(5),
  noline: (s) => s.replace(/ stroke="#3a2a30"/g, ' stroke="none"'),
  flat: (s) => s.replace(/fill="url\([^)]*\)"/g, 'fill="none"').replace(/ opacity="[.\d]+"/g, ' opacity="0"'),
};
const r = await openRenderer();
const sc = await openScorer();
for (const [name, fn] of Object.entries(VARIANTS)) {
  const acc = { aes: 0, iqa: 0, clipT: 0 };
  for (const it of cast) {
    const s = await sc.score(await r.png(fn(it.svg), it.w, it.h, { viewBox: it.viewBox }), { prompt: it.prompt });
    for (const k of Object.keys(acc)) acc[k] += s[k] / cast.length;
  }
  console.log(name.padEnd(8), `aes ${acc.aes.toFixed(3)}  iqa ${acc.iqa.toFixed(3)}  clipT ${acc.clipT.toFixed(4)}`);
}
await r.close();
