// Composes one webtoon panel (v2) into SVG. Speech bubbles and captions are HTML laid over it by the reader,
// so Korean text stays selectable, breakable (Shift) and saveable (Ctrl+click).
//
// Panel: { shot, scene, time, weather, lit, h, cast, fx, prop, sfx }
//   shot: establish | wide | medium | bust | close | detail | flight
//   h: height / width (default by shot).  cast: [[who, { x, mood, turn, hand, pose, hat, flip, prop, y, s }]]
//   fx: sparkle | rays | vignette | speed | hearts | dark | glow | sepia | snow | petals
//   prop (detail shots): letter | oldletter | photo | stew | songpyeon | phone | bread | lantern | medicine | map | ticket | broom
import { FOLK, learner, bust, figure, flyer } from './folk.js';
import { VISTAS, blurred, bokeh, rain } from './vista.js';
import { jijiGroup } from '../jiji.js';
import { shade, mix } from '../color.js';

export const W = 360;
export const SHOTS = ['establish', 'wide', 'medium', 'bust', 'close', 'detail', 'flight'];
const SHOT_H = { establish: 0.82, wide: 0.72, medium: 0.8, bust: 0.72, close: 0.62, detail: 0.6, flight: 0.9 };
let n = 0;
const id = (p) => `${p}${(++n).toString(36)}`;

export const panelH = (p) => Math.round(W * (p.h || SHOT_H[p.shot || 'wide'] || 0.72));

function who(name, look) {
  if (name === 'me') return learner(look);
  return FOLK[name] || FOLK.woman;
}
const LIGHT = {
  night: { rim: '#a9b6ff', side: 1, tint: '#2b2f6a', tintA: 0.14 }, late: { rim: '#a9b6ff', side: 1, tint: '#1d2050', tintA: 0.2 },
  dusk: { rim: '#ffb38a', side: -1, tint: '#a0607a', tintA: 0.1 }, warm: { rim: '#ffd59a', side: -1, tint: '#ff9a4a', tintA: 0.06 },
  storm: { rim: '#9fb4d0', side: 1, tint: '#1c2a40', tintA: 0.24 }, day: null, morning: { rim: '#fff0c8', side: -1 }, sepia: null,
};
const INDOOR = new Set(['bakery', 'attic', 'kitchen', 'table', 'living', 'lantern', 'sickroom', 'pharmacy', 'bus']);
function lightFor(p) {
  const t = p.time || (INDOOR.has(p.scene) ? 'day' : 'night');
  if (INDOOR.has(p.scene) && (t === 'night' || t === 'late')) return LIGHT.warm;
  return LIGHT[t] || null;
}

function jiji(o, s) {
  const mood = o.mood === 'neutral' || !o.mood ? 'idle' : ['happy', 'sleepy', 'surprised', 'think', 'sad', 'smug'].includes(o.mood) ? o.mood : 'idle';
  return `<g transform="scale(${(o.flip ? -1 : 1) * s} ${s}) translate(-60 -146)">${jijiGroup(mood)}</g>`;
}

function castLayer(p, H, look, ground) {
  const shot = p.shot || 'wide';
  const light = lightFor(p);
  const list = p.cast || [];
  const solo = list.filter(([w]) => w !== 'jiji').length <= 1;
  return list.map(([name, o = {}]) => {
    const x = (o.x ?? 0.5) * W;
    if (name === 'jiji') {
      const js = o.s || { establish: 0.22, wide: 0.42, medium: 0.7, bust: 1.05, close: 1.5, flight: 0.5 }[shot] || 0.5;
      const y = o.y != null ? o.y * H : shot === 'bust' || shot === 'close' ? H + 12 : ground;
      return `<g transform="translate(${x} ${y})">${jiji(o, js)}</g>`;
    }
    const c = who(name, look);
    if (shot === 'bust' || shot === 'close') {
      const s = o.s || (shot === 'close' ? W * 0.52 / 100 : solo ? W * 0.34 / 100 : W * 0.27 / 100);
      const y = o.y != null ? o.y * H : shot === 'close' ? H * 0.5 : H * 0.44;
      return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})">${bust(c, { mood: o.mood, turn: o.flip ? -(o.turn || 0) : o.turn || 0, hand: o.hand, light, hat: o.hat })}</g>`;
    }
    const fh = { establish: H * 0.16, wide: H * 0.6, medium: H * 1.05 }[shot] || H * 0.6;
    const s = (o.s || 1) * fh / 640;
    const y = o.y != null ? o.y * H : shot === 'medium' ? ground + fh * 0.22 : ground;
    return `<g transform="translate(${x} ${y}) scale(${s})">${figure(c, { mood: o.mood, pose: o.pose, turn: o.turn || 0, prop: o.prop, light, hat: o.hat, flip: o.flip })}</g>`;
  }).join('');
}

// ---------------------------------------------------------------- detail inserts
const INK = '#3a2a30';
const PROPS = {
  letter: (w, h) => `<g transform="translate(${w / 2} ${h / 2}) rotate(-4)"><rect x="-110" y="-62" width="220" height="124" rx="4" fill="#f6efdf" stroke="${INK}" stroke-width="2.5"/><path d="M-110 -62 L0 12 L110 -62" stroke="${INK}" stroke-width="2" fill="none"/><circle cx="0" cy="12" r="15" fill="#b8524c"/><path d="M-6 8 a7 7 0 1 0 10 8 a5.5 5.5 0 1 1 -10 -8Z" fill="#f3d9a0"/></g>`,
  oldletter: (w, h) => `<g transform="translate(${w / 2} ${h / 2}) rotate(3)"><rect x="-120" y="-70" width="240" height="140" rx="3" fill="#e9d9b2" stroke="${INK}" stroke-width="2.5"/><rect x="-120" y="-70" width="240" height="140" rx="3" fill="#a07a40" opacity=".12"/><path d="M-120 -70 L0 6 L120 -70" stroke="${INK}" stroke-width="2" fill="none" opacity=".7"/><text x="-96" y="44" font-family="Gowun Batang, serif" font-size="22" fill="#4a3a30">오순자 씨께</text><text x="40" y="58" font-family="Gowun Batang, serif" font-size="13" fill="#6a5a48">1974. 9.</text><circle cx="0" cy="6" r="13" fill="#8a3a32"/></g>`,
  photo: (w, h) => `<g transform="translate(${w / 2} ${h / 2}) rotate(-3)"><rect x="-120" y="-84" width="240" height="168" fill="#f4efe4" stroke="${INK}" stroke-width="2"/><rect x="-106" y="-70" width="212" height="124" fill="#b9a68a"/><rect x="-106" y="-70" width="212" height="60" fill="#d9c9a8"/><path d="M-106 -10 h212 v64 h-212Z" fill="#8f9fa8"/><g transform="translate(-40 40) scale(.11)">${figure(FOLK.grandpa, { mood: 'smile' })}</g><g transform="translate(40 40) scale(.11)">${figure(FOLK.head, { mood: 'calm' })}</g><path d="M60 -50 l0 -18 l6 0 l0 18" fill="#f2ede4"/><text x="0" y="74" text-anchor="middle" font-family="Gowun Batang, serif" font-size="13" fill="#5a4a3a">1974 · 달무리 등대</text><rect x="-106" y="-70" width="212" height="124" fill="#a07a40" opacity=".22"/></g>`,
  stew: (w, h) => `${VISTAS.table(w, h * 1.6, { time: 'night' }).bg.replace(/^/, `<g transform="translate(0 ${-h * 0.75})">`)}</g>`,
  songpyeon: (w, h) => `<ellipse cx="${w / 2}" cy="${h * 0.62}" rx="${w * 0.34}" ry="${h * 0.22}" fill="#f2ede4" stroke="${INK}" stroke-width="2"/>${[[-60, 0, '#f4f0e6'], [-20, -12, '#c9d9a8'], [24, -4, '#f2c2c8'], [62, 8, '#f4f0e6'], [-36, 22, '#e8d49a'], [12, 20, '#c9d9a8'], [50, 30, '#f2c2c8']].map(([dx, dy, c]) => `<path d="M${w / 2 + dx - 22} ${h * 0.6 + dy} Q${w / 2 + dx} ${h * 0.6 + dy - 26} ${w / 2 + dx + 22} ${h * 0.6 + dy} Q${w / 2 + dx} ${h * 0.6 + dy + 8} ${w / 2 + dx - 22} ${h * 0.6 + dy}Z" fill="${c}" stroke="${INK}" stroke-width="1.6"/>`).join('')}<path d="M${w * 0.3} ${h * 0.4} l6 -10 l6 10" stroke="#7b8f6a" stroke-width="4" fill="none"/>`,
  phone: (w, h) => `<g transform="translate(${w / 2} ${h / 2})"><rect x="-58" y="-100" width="116" height="200" rx="16" fill="#2a2840" stroke="${INK}" stroke-width="2"/><rect x="-50" y="-86" width="100" height="172" rx="6" fill="#eef1f6"/><rect x="-42" y="-70" width="70" height="26" rx="10" fill="#d9dde6"/><rect x="-30" y="-36" width="72" height="26" rx="10" fill="#e7c66f"/><rect x="-42" y="-2" width="60" height="26" rx="10" fill="#d9dde6"/><text x="-36" y="-52" font-family="Noto Sans KR" font-size="11" fill="#2a2840">어디예요?</text><text x="-24" y="-18" font-family="Noto Sans KR" font-size="11" fill="#2a2840">등대 앞이에요</text><text x="-36" y="16" font-family="Noto Sans KR" font-size="11" fill="#2a2840">지금 가요!</text></g>`,
  bread: (w, h) => `<rect width="${w}" height="${h}" fill="#e8d2ae"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<g transform="translate(${w * (0.12 + (i % 4) * 0.25)} ${h * (0.35 + Math.floor(i / 4) * 0.38)}) scale(2.2)"><ellipse rx="22" ry="13" fill="${['#c9843f', '#d79a52', '#b97a3c', '#e2b06a'][i % 4]}" stroke="${INK}" stroke-width=".9"/><path d="M-10 -5 l5 7 M0 -7 l5 7 M10 -5 l5 7" stroke="#f2c98a" stroke-width="1.6" stroke-linecap="round"/></g>`).join('')}`,
  lantern: (w, h) => VISTAS.lantern(w, h, { lit: 0.15 }).bg,
  medicine: (w, h) => `<g transform="translate(${w / 2} ${h / 2})"><rect x="-90" y="-50" width="120" height="90" rx="6" fill="#f2f0ea" stroke="${INK}" stroke-width="2"/><rect x="-90" y="-50" width="120" height="22" rx="6" fill="#3f8a5e"/><text x="-30" y="-34" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" font-size="12" fill="#fff">감기약</text><text x="-30" y="0" text-anchor="middle" font-family="Noto Sans KR" font-size="13" fill="#2a2840">하루 세 번</text><text x="-30" y="22" text-anchor="middle" font-family="Noto Sans KR" font-size="12" fill="#2a2840">식후 30분</text><ellipse cx="70" cy="10" rx="34" ry="12" fill="#f6efe4" stroke="${INK}" stroke-width="2"/><path d="M40 6 q30 -18 60 0" fill="#f2e6cc" stroke="${INK}" stroke-width="1.6"/></g>`,
  ticket: (w, h) => `<g transform="translate(${w / 2} ${h / 2}) rotate(-6)"><rect x="-120" y="-50" width="240" height="100" rx="8" fill="#f3e6c4" stroke="${INK}" stroke-width="2"/><path d="M60 -50 v100" stroke="${INK}" stroke-dasharray="5 5"/><text x="-100" y="-14" font-family="Noto Sans KR" font-size="14" fill="#2a2840">서울 → 달무리</text><text x="-100" y="16" font-family="Gowun Batang" font-weight="700" font-size="26" fill="#2f2b4a">달무리</text><text x="68" y="6" font-family="Noto Sans KR" font-size="12" fill="#2a2840">밤 11:40</text></g>`,
  order: (w, h) => `<g transform="translate(${w / 2} ${h / 2}) rotate(-3)"><rect x="-110" y="-86" width="220" height="172" fill="#fbf6ea" stroke="${INK}" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M-96 ${-52 + i * 22} H96" stroke="#c9d4e6" stroke-width="1"/>`).join('')}<text x="-96" y="-60" font-family="Gowun Batang, serif" font-weight="700" font-size="16" fill="#2f2b4a">배달 — 달빛 빵집</text><text x="-96" y="-28" font-family="Noto Sans KR" font-size="13" fill="#3a2a30">1. 우유 하나 — 3번지</text><text x="-96" y="-6" font-family="Noto Sans KR" font-size="13" fill="#3a2a30">2. 빵 두 개 — 12번지</text><text x="-96" y="16" font-family="Noto Sans KR" font-size="13" fill="#3a2a30">3. 빵 세 개 — 시장 앞</text><text x="-96" y="44" font-family="Noto Sans KR" font-weight="700" font-size="14" fill="#b8524c">4. 빵 하나, 우유 하나 — 등대. 서</text><ellipse cx="40" cy="40" rx="78" ry="16" fill="none" stroke="#b8524c" stroke-width="2"/></g>`,
  map: (w, h) => `<rect x="${w * 0.1}" y="${h * 0.1}" width="${w * 0.8}" height="${h * 0.8}" fill="#efe2c4" stroke="${INK}" stroke-width="2"/><path d="M${w * 0.15} ${h * 0.7} C${w * 0.3} ${h * 0.5} ${w * 0.5} ${h * 0.6} ${w * 0.6} ${h * 0.4} S${w * 0.8} ${h * 0.25} ${w * 0.85} ${h * 0.2}" stroke="#b8524c" stroke-width="3" stroke-dasharray="7 6" fill="none"/><text x="${w * 0.14}" y="${h * 0.8}" font-family="Noto Sans KR" font-size="13">빵집</text><text x="${w * 0.7}" y="${h * 0.18}" font-family="Noto Sans KR" font-size="13">등대</text><text x="${w * 0.42}" y="${h * 0.64}" font-family="Noto Sans KR" font-size="13">시장</text>`,
};

export const PROP_NAMES = Object.keys(PROPS);

function fxLayer(fx, H, p) {
  let out = '';
  for (const f of fx || []) {
    if (f === 'vignette') { const g = id('vg'); out += `<defs><radialGradient id="${g}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0a1a" stop-opacity=".55"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`; }
    if (f === 'sparkle') for (let i = 0; i < 9; i++) { const x = (i * 97) % W, y = ((i * 53) % H) * 0.8 + 10, s = 4 + (i % 3) * 3; out += `<path d="M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25}Z" fill="#fff6c8" opacity=".85"/>`; }
    if (f === 'rays') { const g = id('ry'); out += `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4" stop-opacity=".45"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient></defs>${[0.15, 0.4, 0.62, 0.85].map((x) => `<path d="M${W * x} 0 L${W * (x + 0.08)} 0 L${W * (x + 0.2)} ${H} L${W * (x - 0.02)} ${H}Z" fill="url(#${g})"/>`).join('')}`; }
    if (f === 'speed') for (let i = 0; i < 22; i++) { const y = (i * 37) % H, l = 60 + (i * 29) % 140; out += `<path d="M${W} ${y} h-${l}" stroke="#fff" stroke-width="${1 + (i % 3)}" opacity=".35"/>`; }
    if (f === 'hearts') for (let i = 0; i < 5; i++) { const x = W * (0.2 + i * 0.15), y = H * (0.2 + (i % 2) * 0.1); out += `<path d="M${x} ${y + 6} C${x - 10} ${y - 2} ${x - 4} ${y - 10} ${x} ${y - 4} C${x + 4} ${y - 10} ${x + 10} ${y - 2} ${x} ${y + 6}Z" fill="#f08f9a" opacity=".8"/>`; }
    if (f === 'dark') out += `<rect width="${W}" height="${H}" fill="#0a0c20" opacity=".35"/>`;
    if (f === 'glow') out += bokeh(W, H, ['#ffe6a0', '#ffd0a0', '#fff'], { n: 18, seed: 8 });
    if (f === 'snow' || f === 'petals') for (let i = 0; i < 30; i++) out += `<circle cx="${(i * 71) % W}" cy="${(i * 43) % H}" r="${1.5 + (i % 3)}" fill="${f === 'snow' ? '#fff' : '#f6c6cf'}" opacity=".8"/>`;
    if (f === 'rain') out += rain(W, H, { amt: 90 });
  }
  return out;
}

export function panelSVG2(p, { look } = {}) {
  const H = panelH(p);
  const shot = p.shot || 'wide';
  const o = { time: p.time, weather: p.weather, lit: p.lit, seed: p.seed, counter: p.counter };
  let bg = '', fg = '', ground = H * 0.96;
  if (shot === 'detail') {
    bg = `<rect width="${W}" height="${H}" fill="${p.bgColor || '#efe4cf'}"/>` + (PROPS[p.prop]?.(W, H) || '');
  } else if (shot === 'bust' || shot === 'close') {
    bg = blurred(p.scene || 'plain', W, H, o, shot === 'close' ? 3.4 : 2.4);
    if (p.time === 'night' || p.time === 'late') bg += bokeh(W, H, ['#ffd88a', '#a9b6ff'], { n: 8, seed: (p.seed || 3) + 1, y1: 0.6 });
  } else {
    const v = (VISTAS[p.scene] || VISTAS.plain)(W, H, o);
    bg = shot === 'medium' ? `<g transform="translate(${-W * 0.12} ${-H * 0.06}) scale(1.24)">${v.bg}</g>` : v.bg;
    fg = shot === 'medium' && v.fg ? `<g transform="translate(${-W * 0.12} ${-H * 0.06}) scale(1.24)">${v.fg}</g>` : v.fg || '';
    ground = shot === 'medium' ? H * 1.0 : v.ground;
  }
  let figs = castLayer(p, H, look, ground);
  if (shot === 'flight') {
    const sc = p.flyScale || 0.44;
    figs = `<g transform="translate(${(p.flyX ?? 0.4) * W} ${(p.flyY ?? 0.55) * H}) scale(${sc}) rotate(${p.tilt ?? -8})">${flyer(learner(look))}<g transform="translate(-60 -40) scale(.6)">${jijiGroup('idle').replace('class="jiji-art', 'class="jiji-art sil')}</g></g>` + figs;
  }
  const light = lightFor(p);
  const tint = light?.tint ? `<rect width="${W}" height="${H}" fill="${light.tint}" opacity="${light.tintA}" style="mix-blend-mode:multiply"/>` : '';
  const sfx = (p.sfx || []).map((s) => `<text x="${s.x * W}" y="${s.y * H}" transform="rotate(${s.rot || -8} ${s.x * W} ${s.y * H})" font-family="Noto Sans KR, sans-serif" font-weight="800" font-size="${s.size || 26}" fill="${s.color || '#fff'}" stroke="${INK}" stroke-width="${(s.size || 26) / 9}" paint-order="stroke" letter-spacing="1">${s.text}</text>`).join('');
  const sepia = p.fx?.includes('sepia') ? id('sp') : null;
  const grain = id('gr');
  const body = `${bg}${figs}${fg}${tint}${fxLayer((p.fx || []).filter((f) => f !== 'sepia'), H, p)}${sfx}`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs>
    <filter id="${grain}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${n % 40}"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .25 0 0 0 0 .2 0 0 0 .07 0"/></filter>
    ${sepia ? `<filter id="${sepia}"><feColorMatrix type="matrix" values=".5 .45 .2 0 .06  .42 .42 .18 0 .04  .32 .32 .14 0 .02  0 0 0 1 0"/></filter>` : ''}</defs>
    <g ${sepia ? `filter="url(#${sepia})"` : ''}>${body}</g><rect width="${W}" height="${H}" filter="url(#${grain})"/></svg>`;
}

// Which side a speaker's bubble sits on (v2 cast format).
export function speakerSide2(p, name) {
  const c = (p.cast || []).find(([w]) => w === name);
  if (!c) return { side: name === 'me' ? 'l' : 'r', off: true };
  const x = c[1]?.x ?? 0.5;
  return { side: x < 0.4 ? 'l' : x > 0.6 ? 'r' : 'c', off: false, x };
}

// Lab view: every panel of an episode, numbered (used by tools/toon.mjs for review).
export async function renderEpisodeLab(epId, only) {
  const { episodes } = await import('../../../content/index.js');
  const ep = episodes.get(epId);
  if (!ep) return `<p>no episode ${epId}</p>`;
  const list = only ? [ep.panels[+only]] : ep.panels;
  return `<h2>${ep.title.ko} · ${ep.title.en}</h2><div style="display:flex;flex-wrap:wrap;gap:8px">` + list.map((p, i) => `<div style="width:360px;background:#fff"><div style="font:11px sans-serif">${only ?? i} · ${p.shot || ''} ${p.scene || ''} ${(p.lines || []).map((l) => l.ko || l.en).join(' / ').slice(0, 80)}</div>${panelSVG2(p, {})}</div>`).join('') + '</div>';
}
