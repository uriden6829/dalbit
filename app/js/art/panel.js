// Composes one webtoon panel: scene background + cast + foreground + paper grain.
// Panel data: { scene, h: 'S'|'M'|'L', time, rain, tone, fx, cast: [[who, x 0..1, mood, { zoom, face, arms, prop }]] }
import { SCENES } from './scenes.js';
import { person, CAST, meLook } from './people.js';
import { jijiGroup } from './jiji.js';

const HEIGHTS = { S: 210, M: 270, L: 340 };
let uidN = 0;

export function panelHeight(p) {
  let h = p.h || 'M';
  const load = (p.lines?.length || 0) + (p.note ? 1 : 0);
  if (load >= 3 && h !== 'L') h = 'L';
  return HEIGHTS[h] || HEIGHTS.M;
}

export function panelSVG(p, { look } = {}) {
  const W = 360, H = panelHeight(p), u = `u${++uidN}`;
  const sc = (SCENES[p.scene] || SCENES.plain)(W, H, { time: p.time, rain: p.rain, tone: p.tone, fx: p.fx }, u);
  const ground = H - 16;
  // Close-ups (zoom > 1) are nearer the camera than counters and tables, so they draw after the foreground.
  const draw = (list) => list.map(([who, x, mood = 'neutral', o = {}]) => {
    const zoom = o.zoom || 1, cx = x * W;
    if (who === 'jiji') {
      const s = 0.5 * zoom, baseY = ground + Math.max(0, zoom - 1) * 20;
      const flip = o.face === 'left' ? -1 : 1;
      return `<g transform="translate(${cx} ${baseY}) scale(${s * flip} ${s}) translate(-60 -146)">${jijiGroup(mood === 'neutral' ? 'idle' : mood)}</g>`;
    }
    const base = who === 'me' ? meLook(look || {}, p.scene) : CAST[who] || CAST.woman;
    // Staff standing behind a counter are further back, so they sit higher in the frame.
    const back = zoom === 1 && sc.lift && sc.behind && x >= sc.behind[0] && x <= sc.behind[1] ? sc.lift : 0;
    const baseY = ground - back + Math.max(0, zoom - 1) * 105;
    return `<g transform="translate(${cx} ${baseY}) scale(${zoom})">${person({ ...base, mood, face: o.face, arms: o.arms, prop: o.prop })}</g>`;
  }).join('');
  const cast = p.cast || [];
  const isClose = (c) => (c[3]?.zoom || 1) > 1;
  const figs = draw(cast.filter((c) => !isClose(c)));
  const front = draw(cast.filter(isClose));
  const grain = `<filter id="g${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${uidN % 50}"/><feColorMatrix values="0 0 0 0 .25 0 0 0 0 .2 0 0 0 0 .18 0 0 0 .1 0"/></filter>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${sc.bg}${figs}${sc.fg || ''}${front}<defs>${grain}</defs><rect width="${W}" height="${H}" filter="url(#g${u})"/></svg>`;
}

// Which side a speaker's bubble sits on.
export function speakerSide(p, who) {
  const c = (p.cast || []).find(([w]) => w === who);
  if (!c) return { side: who === 'me' ? 'l' : 'r', off: true };
  return { side: c[1] < 0.4 ? 'l' : c[1] > 0.6 ? 'r' : 'c', off: false };
}

export const VOICE = {
  jiji: { pitch: 1.25 }, head: { pitch: 0.9, rate: 0.92 }, grandma: { pitch: 0.85, rate: 0.85 }, minji: { pitch: 1.12 },
  man: { pitch: 0.8 }, dad: { pitch: 0.78 }, driver: { pitch: 0.8 }, clerk: { pitch: 0.85 }, me: { pitch: 1.05 }, staff: { pitch: 0.95 },
  mom: { pitch: 0.95 }, pharm: { pitch: 1.0 }, woman: { pitch: 1.05 },
};
