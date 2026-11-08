// What the art lab draws: evaluation sets, each item = { id, label, w, h, svg, viewBox?, bg?, prompt }.
// prompt = a plain description the picture should match (CLIPScore), never a style word.
// Engines: 'app' = the working tree's app/js/art; 'git:<ref>' = app/js/art exported from that commit (for before/after).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT = resolve(import.meta.dirname, '../..');
export const APP = join(ROOT, 'app');

// Returns a folder that contains `art/` (the engine to load).
export function engine(spec = 'app') {
  if (spec === 'app') return join(APP, 'js');
  if (!spec.startsWith('git:')) return resolve(spec);
  const ref = spec.slice(4), out = join(import.meta.dirname, 'out', 'engines', ref.replace(/[^\w.-]/g, '_'));
  const files = execFileSync('git', ['-C', ROOT, 'ls-tree', '-r', '--name-only', ref, 'app/js/art'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const f of files) {
    const dest = join(out, f.replace(/^app\/js\//, ''));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, execFileSync('git', ['-C', ROOT, 'show', `${ref}:${f}`]));
  }
  writeFileSync(join(out, 'package.json'), '{"type":"module"}\n');
  return out;
}

const DESC = {
  me: 'a young woman student witch with a short dark bob haircut in a dark navy school uniform with a red bow',
  minji: 'a cheerful young Korean barista woman with a black ponytail and an orange apron',
  grandma: 'a kind elderly Korean grandmother with grey hair in a bun and round glasses',
  head: 'an elegant middle-aged headmistress with long silver hair in a dark robe',
  driver: 'a middle-aged Korean bus driver man with a mustache and a navy cap',
  baker: 'a middle-aged Korean baker man in a grey apron',
  mom: 'a middle-aged Korean mother with short curly permed hair in a purple cardigan',
  pharm: 'a young Korean pharmacist woman with long black hair, thin glasses and a white coat',
  clerk: 'a young Korean shop clerk man with short black hair in a blue shirt',
  staff: 'a middle-aged Korean restaurant worker woman with permed hair and a red apron',
  captain: 'an old sea captain with a white beard and a navy captain hat',
  grandpa: 'a young Korean sailor man in the 1970s with a navy cap and coat',
  younggrandma: 'a young Korean woman in the 1970s with a long braid and an apron',
  man: 'a middle-aged Korean man in a blue shirt',
  woman: 'a middle-aged Korean woman with a bob haircut in a brown cardigan',
  girl: 'a little Korean girl with pigtails in a pink shirt',
};
const POSE_DESC = { stand: 'standing', walk: 'walking', wave: 'waving her hand', hold: 'holding a basket of bread', sit: 'sitting', run: 'running', point: 'pointing', think: 'thinking with a hand on her chin' };
const JIJI_DESC = { idle: 'sitting calmly', happy: 'smiling happily with closed eyes', sleepy: 'sleepy', surprised: 'surprised', think: 'thinking', sad: 'sad', smug: 'smug' };
export const SET_NAMES = ['cast', 'moods', 'figures', 'figcast', 'scenes', 'jiji', 'panels'];

export async function buildSets(dir, which = ['cast', 'figures', 'jiji', 'panels']) {
  const base = pathToFileURL(join(dir, 'art') + '/').href;
  const folk = await import(base + 'toon/folk.js'), jiji = await import(base + 'jiji.js'), compose = await import(base + 'toon/compose.js');
  const out = {};
  if (which.includes('cast')) out.cast = Object.keys(folk.FOLK).map((k) => ({ id: k, label: k, w: 300, h: 360, viewBox: '-110 -110 220 264', svg: folk.bust(folk.FOLK[k], { mood: 'smile', turn: 0.25, hat: k === 'me' }), prompt: `a webtoon portrait of ${DESC[k] || k}` }));
  if (which.includes('moods')) out.moods = ['smile', 'happy', 'sad', 'surprised', 'worried', 'think', 'determined', 'embarrassed'].map((m) => ({ id: m, label: m, w: 240, h: 290, viewBox: '-110 -110 220 264', svg: folk.bust(folk.FOLK.minji, { mood: m, turn: 0.2 }), prompt: `a webtoon portrait of a young woman looking ${m}` }));
  if (which.includes('figures')) out.figures = Object.keys(POSE_DESC).map((p) => ({ id: p, label: p, w: 260, h: 380, viewBox: '-260 -760 520 780', svg: folk.figure(folk.FOLK.me, { pose: p, mood: 'smile', hat: true }), prompt: `a full-body illustration of a young witch girl ${POSE_DESC[p]}` }));
  if (which.includes('figcast')) out.figcast = ['me', 'minji', 'grandma', 'head', 'baker', 'captain', 'pharm', 'girl'].map((k, i) => ({ id: k, label: k, w: 260, h: 380, viewBox: '-260 -760 520 780', svg: folk.figure(folk.FOLK[k], { pose: ['stand', 'hold', 'stand', 'stand', 'stand', 'stand', 'think', 'wave'][i], mood: 'smile', hat: k === 'me' }), prompt: `a full-body illustration of ${DESC[k]}` }));
  if (which.includes('scenes')) {
    const SC = [['town', 'night', 'establish', 'a seaside hill town with a lighthouse at night'], ['town', 'morning', 'establish', 'a seaside hill town with a lighthouse in the morning'],
      ['harbour', 'day', 'establish', 'a small fishing harbour with boats and a pier on a sunny day'], ['harbour', 'dusk', 'wide', 'a small fishing harbour with boats at dusk'],
      ['street', 'dusk', 'wide', 'a hillside alley with stairs and street lamps at dusk'], ['hill', 'night', 'establish', 'a grassy hill above a town under a huge full moon'],
      ['busstop', 'dusk', 'wide', 'a bus stop in a town at dusk'], ['station', 'night', 'wide', 'a small train station platform at night'], ['skyride', 'night', 'flight', 'flying over a town at night under the moon']];
    out.scenes = SC.map(([scene, time, shot, d]) => { const p = { shot, scene, time, cast: [] }; return { id: `${scene}-${time}`, label: `${scene} ${time}`, w: 360, h: compose.panelH(p), svg: compose.panelSVG2(p, {}), prompt: `webtoon background art of ${d}` }; });
  }
  if (which.includes('jiji')) out.jiji = Object.keys(JIJI_DESC).map((m) => ({ id: m, label: m, w: 240, h: 300, viewBox: '0 0 120 150', bg: '#2a2b52', svg: jiji.jijiGroup(m), prompt: `a cute black cat wearing a purple witch hat, ${JIJI_DESC[m]}` }));
  if (which.includes('panels')) {
    const { episodes } = await import(pathToFileURL(join(APP, 'content/index.js')).href);
    const pick = [['ep01', [0, 2, 5]], ['ep02', [0, 1, 2, 9, 15]], ['ep04', [0, 3]], ['ep06', [0, 4]], ['ep08', [0, 2]], ['ep10', [0, 3]], ['ep12', [0, 5]]];
    out.panels = [];
    for (const [ep, idx] of pick) for (const i of idx) {
      const p = episodes.get(ep)?.panels[i];
      if (p) out.panels.push({ id: `${ep}-${i}`, label: `${ep}#${i} ${p.shot} ${p.scene || ''}`, w: 360, h: compose.panelH(p), svg: compose.panelSVG2(p, {}), prompt: `a webtoon panel, ${p.shot} shot, ${p.scene || ''}` });
    }
  }
  return out;
}
