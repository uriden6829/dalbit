// Webtoon characters: soft anime style with clean line art, one cel-shadow tone (hue-shifted with color.js),
// glossy eyes, hair with a highlight band, and a full set of expressions.
//   bust(spec, { mood, turn, look, hand, light })   head + shoulders, head width = 100 units, origin = head centre
//   figure(spec, { mood, pose, turn, prop, light })  whole body, feet at y=0, ~700 units tall
// spec: an entry of FOLK (or the learner's look). Every function returns SVG markup (our own, trusted).
//
// Faces are CONSTRUCTED, not traced: profile() turns gender / age / kid / face type (+ per-character `build`
// overrides) into numbers — cheek, jaw and chin widths, chin length, eye size and height, brow weight, neck width —
// and every part is placed from those numbers. Line weight: silhouettes 2.5, inner lines 1.2-1.8, tapered brows.
import { shade, tint, mix } from '../color.js';

let uid = 0;
const nid = (p) => `${p}${(++uid).toString(36)}`;
const INK = '#3a2a30';
const f1 = (n) => Math.round(n * 10) / 10;
const P = (pts) => pts.map((p, i) => (typeof p === 'string' ? p : `${i ? '' : 'M'}${f1(p[0])} ${f1(p[1])}`)).join(' ');

// ---------------------------------------------------------------- cast
export const FOLK = {
  me: { name: 'You', hair: 'bob', hairColor: '#3b2a22', skin: '#f6dccb', eyes: 'round', eyeColor: '#6b4a3a', outfit: 'witch', cloth: '#2f2b4a', accent: '#e9dcc4', ribbon: '#b8524c', gender: 'f' },
  minji: { name: '민지', hair: 'ponytail', hairColor: '#2b1f1c', skin: '#f3d3be', eyes: 'bright', eyeColor: '#5a3b2c', outfit: 'apron', cloth: '#d99a6c', accent: '#fbf3e6', ribbon: '#e6b44c', gender: 'f', freckles: true },
  grandma: { name: '할머니', hair: 'granny', hairColor: '#d9d4d6', skin: '#efcfb6', eyes: 'gentle', eyeColor: '#5d4636', outfit: 'cardigan', cloth: '#7e9a74', accent: '#f4ecdf', gender: 'f', age: 2, face: 'round', glasses: 'round' },
  head: { name: '서 선생님', hair: 'silver', hairColor: '#cfd0e4', skin: '#f4e1d6', eyes: 'calm', eyeColor: '#7f74a8', outfit: 'robe', cloth: '#2b2547', accent: '#d4b26a', gender: 'f', face: 'long', earrings: true, age: 1, build: { eyeS: 0.92 } },
  driver: { name: '기사님', hair: 'short', hairColor: '#5e5a60', skin: '#e2b896', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'uniform', cloth: '#3d4f66', accent: '#e8e1d0', gender: 'm', age: 1, cap: '#2e3b4f', mustache: true, face: 'square' },
  baker: { name: '민지 아버지', hair: 'crop', hairColor: '#2e2724', skin: '#e8bf9c', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'apron', cloth: '#6b7a86', accent: '#f6efe2', gender: 'm', age: 1, face: 'round', glasses: 'square' },
  mom: { name: '민지 어머니', hair: 'perm', hairColor: '#3a2c26', skin: '#f0caa9', eyes: 'soft', eyeColor: '#4e3a2e', outfit: 'cardigan', cloth: '#9a7aa8', accent: '#f4ecdf', gender: 'f', age: 1 },
  pharm: { name: '약사', hair: 'long', hairColor: '#2a1f1b', skin: '#f3d5bf', eyes: 'soft', eyeColor: '#4a3428', outfit: 'whitecoat', cloth: '#f4f1ea', accent: '#9fb8c8', gender: 'f', glasses: 'thin' },
  clerk: { name: '점원', hair: 'fringe', hairColor: '#1f1a18', skin: '#e9c3a5', eyes: 'round', eyeColor: '#3d2e26', outfit: 'shirt', cloth: '#6f8fa8', accent: '#f2efe8', gender: 'm', build: { jawW: 37, chinY: 63, eyeS: 0.92 } },
  staff: { name: '직원', hair: 'bun', hairColor: '#2e2420', skin: '#e8c0a0', eyes: 'soft', eyeColor: '#4a3428', outfit: 'apron', cloth: '#a35d5d', accent: '#f3eee6', gender: 'f', age: 1, face: 'round' },
  captain: { name: '선장님', hair: 'short', hairColor: '#e7e3dd', skin: '#d9a98a', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'coat', cloth: '#2f3d52', accent: '#c9a457', gender: 'm', age: 2, beard: true, cap: '#27324a', face: 'square' },
  grandpa: { name: '할아버지 (젊을 때)', hair: 'short', hairColor: '#231b18', skin: '#e6bb98', eyes: 'round', eyeColor: '#3d2e26', outfit: 'coat', cloth: '#3f5168', accent: '#e8e1d0', gender: 'm', cap: '#33415a', build: { jawW: 39 } },
  younggrandma: { name: '할머니 (젊을 때)', hair: 'braid', hairColor: '#2b201c', skin: '#f3d3be', eyes: 'bright', eyeColor: '#5a3b2c', outfit: 'apron', cloth: '#c98b6b', accent: '#fbf3e6', gender: 'f', ribbon: '#c9a457', face: 'round' },
  man: { name: '아저씨', hair: 'crop', hairColor: '#2a2421', skin: '#e8c0a0', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'shirt', cloth: '#5a6b8a', accent: '#f2efe8', gender: 'm', age: 1, face: 'long' },
  woman: { name: '아주머니', hair: 'bob', hairColor: '#3b2a22', skin: '#f2d3bd', eyes: 'soft', eyeColor: '#4a3428', outfit: 'cardigan', cloth: '#b68e6a', accent: '#f4ecdf', gender: 'f', age: 1, face: 'round' },
  girl: { name: '아이', hair: 'pigtails', hairColor: '#2b1f1c', skin: '#f6dccb', eyes: 'bright', eyeColor: '#5a3b2c', outfit: 'shirt', cloth: '#e3a0a8', accent: '#fff7ee', gender: 'f', kid: true, ribbon: '#e6b44c' },
};
// Her own look from Settings (hair style + colours) on top of the default learner.
export function learner(look = {}) {
  const hairMap = { bob: 'bob', long: 'long', ponytail: 'ponytail', bun: 'bun', short: 'pixie' };
  return { ...FOLK.me, hair: hairMap[look.hair] || 'bob', hairColor: look.hairColor || FOLK.me.hairColor, skin: look.skin || FOLK.me.skin, accent: look.coat || FOLK.me.accent };
}

// Face construction numbers (head units; head centre at 0,0, skull top y=-62).
function profile(c) {
  const m = c.gender === 'm', old = (c.age || 0) >= 2, kid = !!c.kid;
  const p = {
    cheek: kid ? 49 : 47, jawW: m ? 40 : kid ? 37 : 34, jawY: m ? 36 : 31, chinW: m ? 13 : kid ? 12 : 7, chinY: kid ? 56 : m ? 67 : 62,
    eyeS: kid ? 1.1 : m ? 0.84 : old ? 0.88 : 1, eyeY: kid ? 14 : 10, sp: m ? 23.5 : 23, browW: m ? 4.2 : 2.6, neck: m ? 16 : kid ? 11 : 12.5,
  };
  if (c.face === 'round') { p.cheek += 2; p.jawW += 6; p.chinY -= 3; p.chinW += 6; }
  if (c.face === 'long') { p.chinY += 5; p.jawW -= 2; p.eyeY += 1; }
  if (c.face === 'square') { p.jawW += 4; p.chinW += 5; p.jawY += 4; }
  return Object.assign(p, c.build || {});
}

// ---------------------------------------------------------------- expressions
// eye: open (0..1.2) | 'arc' (smiling shut) | 'line' (sleepy/shut) | 'wide'; brow: [innerLift, outerLift]; mouth shape; extras
const MOODS = {
  neutral: { eye: 1, brow: [0, 0], mouth: 'flat' },
  smile: { eye: 0.92, brow: [0.5, 0], mouth: 'smile', blush: 0.35 },
  happy: { eye: 'arc', brow: [2, 0], mouth: 'grin', blush: 0.55 },
  laugh: { eye: 'arc', brow: [3, 1], mouth: 'laugh', blush: 0.6 },
  gentle: { eye: 'arc', brow: [1.5, -0.5], mouth: 'smile', blush: 0.25 },
  talk: { eye: 1, brow: [0.5, 0], mouth: 'talk' },
  surprised: { eye: 1.18, pupil: 0.6, brow: [5, 4], mouth: 'o', lines: true },
  shock: { eye: 'wide', brow: [6, 5], mouth: 'gasp', lines: true, sweat: true },
  worried: { eye: 0.95, brow: [5, -2], mouth: 'wavy', sweat: true },
  sad: { eye: 0.72, look: [0, 3], brow: [5, -3], mouth: 'frown' },
  cry: { eye: 0.7, look: [0, 2], brow: [6, -3], mouth: 'cry', tears: true, blush: 0.5 },
  sick: { eye: 0.55, brow: [3, -2], mouth: 'wavy', blush: 0.9, sweat: true },
  sleepy: { eye: 'line', brow: [1, -1], mouth: 'small' },
  think: { eye: 0.9, look: [5, -4], brow: [3, -1], mouth: 'side' },
  determined: { eye: 0.88, brow: [-4, 1.5], mouth: 'set' },
  embarrassed: { eye: 0.9, look: [-4, 2], brow: [4, -1], mouth: 'wavy', blush: 1, sweat: true },
  pout: { eye: 0.85, brow: [-3, 1], mouth: 'pout', blush: 0.4 },
  smug: { eye: 0.58, brow: [-1, 1.5], mouth: 'smirk' },
  calm: { eye: 0.62, brow: [0, 0], mouth: 'flat' },
  awe: { eye: 1.12, look: [0, -4], brow: [4, 2], mouth: 'o', sparkle: true },
  tender: { eye: 0.75, look: [0, 2], brow: [3, -1], mouth: 'smile', blush: 0.3 },
};
export const MOOD_NAMES = Object.keys(MOODS);

// ---------------------------------------------------------------- face parts
const EYE_SHAPES = {
  round: { w: 15.5, h: 19, tilt: 0 }, bright: { w: 16, h: 20, tilt: -1.5 }, soft: { w: 15, h: 16.5, tilt: 1.5 },
  gentle: { w: 13, h: 11, tilt: 2.5 }, calm: { w: 15.5, h: 15, tilt: -2 }, narrow: { w: 14, h: 11, tilt: -1.5 },
};

function eye(side, cx, cy, m, c, t, p) {
  const S = EYE_SHAPES[c.eyes] || EYE_SHAPES.round;
  const male = c.gender === 'm', old = (c.age || 0) >= 2;
  const far = side * t < 0 ? 1 - Math.abs(t) * 0.28 : 1;
  const w = S.w * p.eyeS * far, tilt = S.tilt * side, sh = S.h * p.eyeS;
  const lw = male ? 2.9 : 2.6;
  const marks = old ? `<path d="M${cx - side * w * 0.6} ${cy + sh * 0.62} Q${cx} ${cy + sh * 0.9} ${cx + side * w * 0.75} ${cy + sh * 0.55}" stroke="${shade(c.skin, 0.28, 330)}" stroke-width="1.1" fill="none" opacity=".75"/><path d="M${cx + side * (w + 3)} ${cy - 1} l${side * 5} -2 M${cx + side * (w + 3)} ${cy + 3} l${side * 5} 1.5" stroke="${shade(c.skin, 0.28, 330)}" stroke-width="1" stroke-linecap="round" opacity=".7"/>` : '';
  if (m.eye === 'arc') {
    return `<path d="M${cx - w} ${cy + 2} Q${cx} ${cy - 9 * p.eyeS} ${cx + w} ${cy + 2}" stroke="${INK}" stroke-width="${lw + 0.4}" fill="none" stroke-linecap="round"/>${marks}`;
  }
  if (m.eye === 'line') {
    return `<path d="M${cx - w} ${cy + 1} Q${cx} ${cy + 5} ${cx + w} ${cy + 1}" stroke="${INK}" stroke-width="${lw}" fill="none" stroke-linecap="round"/>` +
      (male ? '' : `<path d="M${cx + side * w} ${cy + 1} l${side * 3} -2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`) + marks;
  }
  const open = m.eye === 'wide' ? 1.2 : m.eye;
  const h = sh * open;
  const top = cy - h * 0.66, bot = cy + h * 0.42;
  const xo = cx + side * w, xi = cx - side * w;
  const lid = `M${xi} ${cy + 1} C${xi + side * w * 0.2} ${top - 1} ${xo - side * w * 0.35} ${top - 2 + tilt} ${xo} ${cy - 2 + tilt}`;
  const lower = `C${xo - side * w * 0.2} ${bot} ${xi + side * w * 0.3} ${bot + 1} ${xi} ${cy + 1}`;
  const clip = nid('ec');
  const [lx, ly] = m.look || [0, 0];
  const pr = (m.pupil || 1);
  const ir = w * (male ? 0.66 : 0.74), irh = sh * 0.66 * Math.max(0.8, Math.min(1.1, open));
  const ix = cx + lx * 0.9 + t * 3, iy = cy + ly * 0.7 - 0.5;
  const ig = nid('ig');
  const blank = m.eye === 'wide';
  return `<defs><clipPath id="${clip}"><path d="${lid} ${lower} Z"/></clipPath>
      <linearGradient id="${ig}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c.eyeColor, 0.18)}"/><stop offset=".55" stop-color="${c.eyeColor}"/><stop offset="1" stop-color="${tint(c.eyeColor, 0.22)}"/></linearGradient></defs>
    <path d="${lid} ${lower} Z" fill="#fffdf9"/>
    <g clip-path="url(#${clip})">
      <path d="${lid} L${xo} ${top - 6} L${xi} ${top - 6} Z" fill="${shade(c.skin, 0.12)}" opacity=".35"/>
      ${blank ? `<ellipse cx="${ix}" cy="${iy}" rx="${ir * 0.45}" ry="${irh * 0.45}" fill="none" stroke="${c.eyeColor}" stroke-width="1.6"/>` : `
      <ellipse cx="${ix}" cy="${iy}" rx="${ir}" ry="${irh}" fill="url(#${ig})"/>
      <ellipse cx="${ix}" cy="${iy + 0.5}" rx="${ir * 0.48 * pr}" ry="${irh * 0.55 * pr}" fill="${shade(c.eyeColor, 0.42)}"/>
      <ellipse cx="${ix}" cy="${iy}" rx="${ir}" ry="${irh}" fill="none" stroke="${shade(c.eyeColor, 0.3)}" stroke-width="1.1"/>
      <path d="M${ix - ir * 0.8} ${iy + irh * 0.35} Q${ix} ${iy + irh * 0.95} ${ix + ir * 0.8} ${iy + irh * 0.35}" stroke="${tint(c.eyeColor, 0.35)}" stroke-width="1.6" fill="none" opacity=".7"/>
      <path d="${lid} L${xo} ${top + 3} L${xi} ${top + 3} Z" fill="${shade(c.eyeColor, 0.35)}" opacity=".22"/>
      <ellipse cx="${ix + 3.2 * p.eyeS}" cy="${iy - irh * 0.42}" rx="${(male ? 2.3 : 2.9) * p.eyeS}" ry="${(male ? 2.6 : 3.4) * p.eyeS}" fill="#fff"/>
      <circle cx="${ix - 3}" cy="${iy + irh * 0.35}" r="1.3" fill="#fff" opacity=".85"/>
      ${m.sparkle ? `<circle cx="${ix - 2.5}" cy="${iy - 2}" r="1.4" fill="#fff"/><circle cx="${ix + 2}" cy="${iy + 4}" r=".9" fill="#fff"/>` : ''}`}
    </g>
    <path d="${lid}" stroke="${INK}" stroke-width="${lw + 0.6}" fill="none" stroke-linecap="round"/>
    ${male ? `<path d="M${xi + side * w * 0.15} ${top - 4} Q${cx} ${top - 6.5} ${xo - side * w * 0.05} ${top - 2.5 + tilt}" stroke="${INK}" stroke-width="1.1" fill="none" opacity=".45"/>`
    : `<path d="M${xo - side * 1} ${cy - 2 + tilt} l${side * 4} ${-2.5}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M${xi + side * w * 0.2} ${top - 4.5} Q${cx} ${top - 8} ${xo - side * w * 0.1} ${top - 4.5 + tilt}" stroke="${INK}" stroke-width=".9" fill="none" opacity=".35"/>`}
    <path d="M${xo - side * w * 0.15} ${bot - 0.5} Q${cx} ${bot + 1.6} ${xi + side * w * 0.45} ${bot - 0.5}" stroke="${INK}" stroke-width="1" fill="none" opacity=".55"/>${marks}`;
}

// Tapered brow: thick at the inner end, thin at the outer end (a filled crescent, not a stroke).
function brow(side, cx, cy, m, c, t, p) {
  const [inner, outer] = m.brow || [0, 0];
  const far = side * t < 0 ? 0.8 : 1;
  const male = c.gender === 'm';
  const xi = cx - side * 11 * far, xo = cx + side * (male ? 13 : 12) * far;
  const yi = cy - 19 - inner + (male ? 1.5 : 0), yo = cy - 18 - outer;
  const arch = Math.min(yi, yo) - (male ? 2 : 3.5), bw = p.browW;
  const col = (c.age || 0) >= 2 ? shade(c.hairColor, 0.3) : shade(c.hairColor, 0.05);
  const xm = (xi + xo) / 2;
  return `<path d="M${xi} ${yi - bw / 2} Q${xm} ${arch - bw / 2} ${xo} ${yo + 0.6} Q${xm} ${arch + bw * 0.55} ${xi} ${yi + bw / 2} Z" fill="${col}" stroke="${col}" stroke-width=".6" stroke-linejoin="round"/>`;
}

function mouth(cx, cy, m, c, p) {
  const lip = shade(c.skin, 0.32, 15);
  const k = c.gender === 'm' ? 1.1 : 1;
  switch (m.mouth) {
    case 'smile': return `<path d="M${cx - 8 * k} ${cy - 1} Q${cx} ${cy + 6} ${cx + 8 * k} ${cy - 1}" stroke="${INK}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
    case 'grin': return `<path d="M${cx - 10} ${cy - 2} Q${cx} ${cy + 11} ${cx + 10} ${cy - 2} Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${cx - 5} ${cy + 4.5} Q${cx} ${cy + 1.5} ${cx + 5} ${cy + 4.5} Q${cx} ${cy + 7} ${cx - 5} ${cy + 4.5}" fill="#e88b88"/><path d="M${cx - 8.5} ${cy - 1} L${cx + 8.5} ${cy - 1} L${cx + 7} ${cy + 1.2} L${cx - 7} ${cy + 1.2}Z" fill="#fff"/>`;
    case 'laugh': return `<path d="M${cx - 12} ${cy - 3} Q${cx} ${cy + 15} ${cx + 12} ${cy - 3} Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${cx - 6} ${cy + 6} Q${cx} ${cy + 2} ${cx + 6} ${cy + 6} Q${cx} ${cy + 10} ${cx - 6} ${cy + 6}" fill="#e88b88"/>`;
    case 'talk': return `<path d="M${cx - 6} ${cy} Q${cx} ${cy + 7} ${cx + 6} ${cy} Q${cx} ${cy + 2} ${cx - 6} ${cy}Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    case 'o': return `<ellipse cx="${cx}" cy="${cy + 2}" rx="4" ry="5" fill="#7a3b3f" stroke="${INK}" stroke-width="1.7"/>`;
    case 'gasp': return `<path d="M${cx - 7} ${cy + 6} Q${cx - 7} ${cy - 4} ${cx} ${cy - 4} Q${cx + 7} ${cy - 4} ${cx + 7} ${cy + 6} Q${cx} ${cy + 9} ${cx - 7} ${cy + 6}Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.8"/>`;
    case 'wavy': return `<path d="M${cx - 8} ${cy + 1} q2.6 -3 5.3 0 t5.3 0 t5.3 0" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    case 'frown': return `<path d="M${cx - 7} ${cy + 3} Q${cx} ${cy - 3} ${cx + 7} ${cy + 3}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'cry': return `<path d="M${cx - 8} ${cy + 4} Q${cx} ${cy - 4} ${cx + 8} ${cy + 4} Q${cx} ${cy + 2} ${cx - 8} ${cy + 4}Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.7"/>`;
    case 'small': return `<path d="M${cx - 3} ${cy + 1} Q${cx} ${cy + 3} ${cx + 3} ${cy + 1}" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    case 'side': return `<path d="M${cx - 4} ${cy + 1} Q${cx + 2} ${cy + 2} ${cx + 7} ${cy - 1}" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    case 'set': return `<path d="M${cx - 6} ${cy + 1} L${cx + 6} ${cy}" stroke="${INK}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
    case 'pout': return `<path d="M${cx - 4} ${cy + 2} Q${cx} ${cy - 2.5} ${cx + 4} ${cy + 2}" stroke="${INK}" stroke-width="2" fill="${lip}" stroke-linecap="round"/>`;
    case 'smirk': return `<path d="M${cx - 6} ${cy + 1} Q${cx + 1} ${cy + 3} ${cx + 7} ${cy - 3}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    default: return `<path d="M${cx - 5 * k} ${cy + 1} Q${cx} ${cy + 2.4} ${cx + 5 * k} ${cy + 1}" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  }
}

// ---------------------------------------------------------------- hair
// Each style: back (behind head), front (bangs, over face), plus optional extras. Coordinates in head units.
// strands: thin flow lines inside the front hair (drawn clipped to it).
function hairShapes(style, t) {
  const sx = (x) => x + t * 6; // bangs follow the turn a little
  switch (style) {
    case 'bob': return {
      back: 'M-58 -12 C-63 -60 -27 -77 0 -76 C29 -77 64 -58 59 -10 C58 18 62 40 54 57 C41 64 26 55 22 44 L-22 44 C-26 55 -43 64 -56 56 C-62 40 -58 18 -58 -12Z',
      front: `M-55 -4 C-60 -48 -30 -71 ${sx(2)} -71 C31 -71 60 -50 55 -4 C52 -16 47 -26 41 -30 C39 -18 33 -12 26 -10 C28 -22 26 -30 22 -36 C16 -22 6 -16 ${sx(-4)} -14 C${sx(0)} -24 ${sx(-2)} -32 ${sx(-6)} -38 C-14 -24 -26 -16 -38 -12 C-34 -22 -34 -28 -36 -32 C-44 -26 -49 -16 -55 -4Z`,
      side: 'M-55 -4 C-58 14 -56 30 -48 44 C-46 30 -45 14 -43 0Z M55 -4 C58 14 56 30 48 44 C46 30 45 14 43 0Z',
      strands: ['M-44 -52 Q-40 -36 -37 -14', 'M-18 -66 Q-14 -50 -6 -38', 'M14 -66 Q20 -48 24 -36', 'M38 -54 Q42 -40 40 -30'],
    };
    case 'pixie': return {
      back: 'M-55 -8 C-60 -58 -26 -74 0 -74 C28 -74 60 -57 56 -8 C55 4 53 14 49 18 L-49 18 C-53 12 -55 4 -55 -8Z',
      front: `M-53 -2 C-57 -46 -28 -70 ${sx(2)} -70 C32 -70 59 -48 53 -6 C49 -20 41 -30 31 -34 C31 -24 25 -18 18 -16 C${sx(10)} -26 ${sx(4)} -32 ${sx(-4)} -36 C-12 -24 -26 -18 -40 -16 C-45 -14 -49 -8 -53 -2Z`,
      side: 'M-53 -2 C-55 8 -53 16 -49 22 L-45 4Z M53 -6 C55 6 53 14 49 20 L45 2Z',
      strands: ['M-40 -56 Q-36 -40 -38 -20', 'M-10 -66 Q-4 -50 -2 -36', 'M22 -62 Q28 -48 28 -36'],
    };
    case 'long': return {
      back: 'M-58 -12 C-62 -60 -27 -77 0 -76 C29 -77 63 -58 59 -10 C62 40 66 110 72 170 L-72 170 C-66 110 -62 40 -58 -12Z',
      front: `M-55 -2 C-60 -48 -30 -71 ${sx(2)} -71 C31 -71 60 -50 55 -2 C52 -14 47 -24 39 -30 C37 -20 31 -14 24 -12 C26 -24 22 -32 18 -38 C12 -24 4 -18 ${sx(-6)} -16 C${sx(-4)} -26 ${sx(-8)} -34 ${sx(-12)} -40 C-20 -26 -30 -18 -42 -12 C-40 -22 -42 -30 -44 -34 C-50 -26 -53 -14 -55 -2Z`,
      side: 'M-55 -2 C-60 30 -58 70 -52 100 C-48 70 -46 30 -44 4Z M55 -2 C60 30 58 70 52 100 C48 70 46 30 44 4Z',
      strands: ['M-46 -50 Q-42 -36 -42 -16', 'M-20 -66 Q-16 -52 -10 -40', 'M12 -66 Q18 -50 20 -38', 'M-52 10 Q-52 50 -50 86', 'M52 10 Q52 50 50 86'],
    };
    case 'silver': return {
      back: 'M-57 -14 C-61 -62 -26 -78 0 -77 C29 -78 62 -60 58 -12 C60 50 62 130 66 200 L-66 200 C-62 130 -60 50 -57 -14Z',
      front: `M-54 0 C-59 -48 -30 -73 0 -73 C30 -73 59 -48 54 0 C52 -14 47 -24 41 -30 C39 -20 35 -14 28 -12 C30 -24 26 -34 20 -40 C${sx(10)} -28 ${sx(-4)} -22 ${sx(-20)} -20 C-30 -22 -40 -16 -49 -6 C-51 -4 -53 -2 -54 0Z`,
      side: 'M-54 0 C-58 40 -56 90 -50 130 C-46 90 -46 40 -46 4Z M54 0 C58 40 56 90 50 130 C46 90 46 40 46 4Z',
      strands: ['M-6 -70 Q-30 -62 -42 -34', 'M6 -70 Q30 -62 44 -34', 'M-52 20 Q-52 70 -49 116', 'M52 20 Q52 70 49 116'],
    };
    case 'ponytail': return {
      back: 'M-56 -12 C-60 -60 -27 -76 0 -75 C29 -76 61 -58 57 -10 C57 6 54 18 48 26 L-48 26 C-54 16 -56 4 -56 -12Z',
      tail: 'M40 -54 C67 -62 88 -42 82 -6 C78 24 84 52 94 80 C71 72 61 41 59 12 C57 -12 52 -30 40 -42Z',
      front: `M-54 -4 C-59 -48 -30 -71 ${sx(2)} -71 C31 -71 59 -50 54 -4 C50 -18 43 -28 35 -32 C35 -22 29 -16 22 -14 C24 -24 22 -32 18 -38 C10 -26 2 -20 ${sx(-8)} -18 C${sx(-6)} -28 ${sx(-8)} -34 ${sx(-12)} -40 C-22 -28 -32 -20 -44 -16 C-49 -12 -51 -8 -54 -4Z`,
      side: 'M-54 -4 C-57 10 -56 22 -50 32 C-48 18 -48 8 -46 0Z M54 -4 C57 10 56 22 50 32 C48 18 48 8 46 0Z',
      strands: ['M-42 -56 Q-38 -40 -40 -20', 'M-12 -68 Q-8 -52 -8 -38', 'M18 -66 Q24 -52 26 -40', 'M66 -40 Q76 -10 72 30'],
      tie: '#e6b44c',
    };
    case 'pigtails': return {
      back: 'M-56 -12 C-60 -60 -27 -76 0 -75 C29 -76 61 -58 57 -10 C57 6 54 18 48 26 L-48 26 C-54 16 -56 4 -56 -12Z',
      tail: 'M-52 -20 C-76 -24 -86 0 -82 26 C-78 44 -72 54 -66 60 C-68 40 -64 20 -56 0Z M52 -20 C76 -24 86 0 82 26 C78 44 72 54 66 60 C68 40 64 20 56 0Z',
      front: `M-54 -4 C-59 -48 -30 -71 ${sx(2)} -71 C31 -71 59 -50 54 -4 C48 -14 39 -22 29 -24 C${sx(14)} -20 ${sx(0)} -20 ${sx(-12)} -24 C-31 -22 -45 -14 -54 -4Z`,
      side: '',
      strands: ['M-36 -60 Q-30 -44 -28 -28', 'M4 -70 Q8 -50 6 -30', 'M34 -60 Q38 -44 36 -30'],
      tie: '#e6b44c',
    };
    case 'braid': return {
      back: 'M-56 -12 C-60 -60 -27 -76 0 -75 C29 -76 61 -58 57 -10 C57 6 54 18 48 26 L-48 26 C-54 16 -56 4 -56 -12Z',
      tail: 'M30 30 C40 50 36 70 42 90 C46 110 40 130 46 150 L32 152 C28 132 32 112 28 92 C24 72 26 50 18 32Z',
      front: `M-54 -4 C-59 -48 -30 -71 ${sx(2)} -71 C31 -71 59 -50 54 -4 C48 -20 37 -34 ${sx(8)} -40 C${sx(-6)} -34 -31 -26 -45 -14 C-49 -10 -51 -8 -54 -4Z`,
      side: 'M-54 -4 C-57 10 -56 22 -50 32 C-48 18 -48 8 -46 0Z',
      strands: ['M-30 -64 Q-22 -50 -14 -40', 'M10 -70 Q22 -56 30 -44', 'M-46 -40 Q-48 -26 -50 -12'],
      tie: '#c9a457',
    };
    case 'bun': return {
      back: 'M-56 -12 C-60 -60 -27 -76 0 -75 C29 -76 61 -58 57 -10 C57 4 54 14 50 20 L-50 20 C-54 14 -56 4 -56 -12Z',
      bun: 'M-24 -72 C-26 -100 24 -102 24 -74 C18 -66 -18 -66 -24 -72Z',
      front: `M-54 -4 C-59 -48 -30 -71 ${sx(2)} -71 C31 -71 59 -50 54 -4 C50 -18 43 -28 35 -32 C${sx(18)} -26 ${sx(2)} -22 ${sx(-12)} -26 C-27 -28 -41 -20 -54 -4Z`,
      side: 'M-54 -4 C-57 10 -56 22 -50 30 C-48 18 -48 8 -46 0Z M54 -4 C57 10 56 22 50 30 C48 18 48 8 46 0Z',
      strands: ['M-40 -58 Q-30 -44 -22 -32', 'M0 -70 Q8 -54 14 -32', 'M36 -60 Q42 -46 42 -32'],
    };
    case 'granny': return {
      back: 'M-54 -10 C-58 -58 -27 -73 0 -73 C27 -73 58 -58 54 -10 C54 0 52 8 48 12 L-48 12 C-52 8 -54 0 -54 -10Z',
      bun: 'M-27 -66 C-31 -99 31 -99 27 -66 C19 -60 -19 -60 -27 -66Z',
      front: `M-53 -6 C-57 -48 -29 -69 0 -69 C29 -69 57 -48 53 -6 C47 -26 31 -45 ${sx(2)} -47 C-27 -45 -47 -26 -53 -6Z`,
      side: 'M-53 -6 C-55 4 -54 12 -50 18 L-46 0Z M53 -6 C55 4 54 12 50 18 L46 0Z',
      strands: ['M-40 -48 Q-24 -60 -6 -64', 'M8 -64 Q26 -60 40 -48', 'M-46 -30 Q-30 -50 -10 -56', 'M12 -56 Q32 -50 46 -30'],
    };
    case 'perm': return {
      back: 'M-62 -10 C-68 -64 -29 -81 0 -80 C31 -81 68 -64 62 -10 C64 8 62 24 54 34 C48 40 39 36 35 30 L-35 30 C-39 36 -48 40 -54 34 C-62 24 -64 8 -62 -10Z',
      front: `M-57 -2 C-64 -52 -31 -75 ${sx(2)} -75 C35 -75 64 -52 57 -2 C54 -16 50 -22 42 -24 C37 -30 29 -32 23 -28 C17 -34 6 -34 ${sx(0)} -28 C-6 -34 -17 -34 -23 -28 C-29 -32 -39 -30 -43 -24 C-50 -22 -54 -16 -57 -2Z`,
      side: 'M-57 -2 C-62 12 -60 22 -54 30 C-52 18 -50 8 -48 2Z M57 -2 C62 12 60 22 54 30 C52 18 50 8 48 2Z',
      strands: ['M-46 -56 q6 4 4 10 q-2 6 4 10', 'M-16 -68 q6 4 4 10 q-2 6 4 10', 'M14 -68 q6 4 4 10 q-2 6 4 10', 'M40 -56 q6 4 4 10 q-2 6 4 10'],
    };
    case 'fringe': return { // young man: soft side-swept fringe, ears visible
      back: 'M-55 -6 C-59 -56 -27 -73 0 -73 C29 -73 59 -56 55 -6 C55 2 54 8 51 12 L-51 12 C-54 8 -55 2 -55 -6Z',
      front: `M-54 -4 C-58 -48 -29 -71 ${sx(4)} -71 C33 -71 59 -50 54 -6 C50 -18 44 -24 36 -26 C${sx(30)} -20 ${sx(20)} -16 ${sx(8)} -16 C${sx(14)} -22 ${sx(14)} -28 ${sx(10)} -32 C${sx(-2)} -22 -16 -18 -30 -18 C-24 -24 -22 -30 -24 -34 C-34 -26 -44 -18 -54 -4Z`,
      side: 'M-54 -4 C-55 6 -54 12 -51 16 L-48 2Z M54 -6 C55 6 54 12 51 16 L48 2Z',
      strands: ['M-36 -58 Q-28 -42 -26 -24', 'M-4 -68 Q4 -48 8 -24', 'M24 -64 Q32 -48 34 -30'],
    };
    case 'crop': return { // middle-aged man: short, neat, higher hairline
      back: 'M-54 -10 C-58 -56 -27 -72 0 -72 C28 -72 58 -56 54 -10 C54 -2 53 4 50 8 L-50 8 C-53 4 -54 -2 -54 -10Z',
      front: `M-53 -8 C-57 -50 -28 -70 ${sx(2)} -70 C30 -70 57 -50 53 -10 C50 -24 44 -34 34 -38 C${sx(20)} -42 ${sx(-4)} -44 ${sx(-20)} -40 C-34 -36 -46 -26 -53 -8Z`,
      side: 'M-53 -8 C-54 2 -53 8 -50 12 L-47 -2Z M53 -10 C54 2 53 8 50 12 L47 -4Z',
      strands: ['M-38 -56 Q-24 -64 -8 -64', 'M10 -64 Q26 -62 38 -54', 'M-46 -36 Q-32 -50 -14 -54'],
    };
    default: // short (men)
      return {
        back: 'M-55 -6 C-59 -56 -27 -73 0 -73 C29 -73 59 -56 55 -6 C55 2 54 8 51 12 L-51 12 C-54 8 -55 2 -55 -6Z',
        front: `M-54 -4 C-58 -48 -29 -71 ${sx(2)} -71 C33 -71 59 -50 54 -6 C50 -18 43 -26 33 -30 L${sx(26)} -22 C${sx(20)} -30 ${sx(10)} -34 ${sx(0)} -34 L${sx(-4)} -26 C${sx(-12)} -32 -25 -32 -33 -28 C-41 -22 -49 -14 -54 -4Z`,
        side: 'M-54 -4 C-55 6 -54 12 -51 16 L-48 2Z M54 -6 C55 6 54 12 51 16 L48 2Z',
        strands: ['M-38 -58 Q-34 -44 -34 -30', 'M-6 -68 Q0 -52 2 -36', 'M24 -64 Q30 -50 30 -32'],
      };
  }
}

function hairLayer(d, col, { line = true, w = 2.3 } = {}) {
  if (!d) return '';
  return `<path d="${d}" fill="${col}"${line ? ` stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"` : ''}/>`;
}
// Shine: a broken "angel ring" band across the crown + soft top light + flow strands, all clipped to the hair.
function hairDetail(H, hc, t, clipD) {
  const cl = nid('hc'), gr = nid('hg');
  const dark = !/^#[c-f]/i.test(hc);
  const ring = tint(hc, dark ? 0.3 : 0.12), line = shade(hc, dark ? 0.12 : 0.2);
  const o = t * 6;
  return `<defs><clipPath id="${cl}"><path d="${clipD}"/></clipPath><linearGradient id="${gr}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint(hc, 0.12)}" stop-opacity=".45"/><stop offset=".45" stop-color="${hc}" stop-opacity="0"/><stop offset="1" stop-color="${shade(hc, 0.22)}" stop-opacity=".5"/></linearGradient></defs>
    <g clip-path="url(#${cl})"><path d="${clipD}" fill="url(#${gr})"/>
      ${(H.strands || []).map((d) => `<path d="${d}" transform="translate(${o * 0.6} 0)" stroke="${line}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`).join('')}
      <path d="M${-44 + o} -42 Q${o} -64 ${44 + o} -42" stroke="${ring}" stroke-width="4.2" fill="none" opacity=".3" stroke-linecap="round"/>${[-30, -13, 9, 27].map((x, i) => { const y = -42 - 22 * (1 - ((x / 44) ** 2)) + 1.5; return `<path d="M${x - 3 + o} ${y} L${x + o + (i % 2 ? 1 : -1)} ${y + 7 + (i % 2) * 3} L${x + 3 + o} ${y}Z" fill="${ring}" opacity=".3"/>`; }).join('')}
      <path d="M${-32 + o} -50 l4 -5 M${26 + o} -54 l4 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".5"/></g>`;
}

// ---------------------------------------------------------------- head
function faceShape(t, p) {
  const j = t * 6, L = p.cheek - (t > 0 ? t * 4 : 0), R = p.cheek - (t < 0 ? -t * 4 : 0);
  const { jawW: jw, jawY: jy, chinW: cw, chinY: cy } = p;
  return `M${-L} -14 C${-L - 1} 6 ${-jw - 5 + j} ${jy - 12} ${-jw + j} ${jy} C${-jw + 5 + j} ${jy + 14} ${-cw - 7 + j} ${cy - 1} ${j} ${cy} C${cw + 7 + j} ${cy - 1} ${jw - 5 + j} ${jy + 14} ${jw + j} ${jy} C${jw + 5 + j} ${jy - 12} ${R + 1} 6 ${R} -14 C${R - 1} -48 24 -62 0 -62 C-24 -62 ${-L + 1} -48 ${-L} -14Z`;
}

export function head(c, { mood = 'neutral', turn = 0, light, cutBack = false } = {}) {
  const m = MOODS[mood] || MOODS.neutral;
  const t = Math.max(-1, Math.min(1, turn));
  const p = profile(c);
  const skin = c.skin, sh = shade(skin, 0.13, 330), sh2 = shade(skin, 0.24, 320);
  const H = hairShapes(c.hair, t);
  const hc = c.hairColor;
  const faceD = faceShape(t, p);
  const fx = t * 14, eyeY = p.eyeY, sp = p.sp, j = t * 6;
  const male = c.gender === 'm', old = (c.age || 0) >= 2, mid = c.age === 1;
  const parts = [];
  // back hair, tails, buns
  if (cutBack) { const cb = nid('cb'); parts.push(`<defs><clipPath id="${cb}"><rect x="-120" y="-200" width="240" height="252"/></clipPath></defs><g clip-path="url(#${cb})">${hairLayer(H.back, shade(hc, 0.08))}</g>`); }
  else parts.push(hairLayer(H.back, shade(hc, 0.08)));
  if (H.tail) parts.push(hairLayer(H.tail, hc), hairDetail(H, hc, t, H.tail));
  if (H.bun) parts.push(hairLayer(H.bun, hc), hairDetail(H, hc, t, H.bun));
  // ears
  const ex = p.cheek - 2;
  const ear = (s) => `<path d="M${s * ex} -2 C${s * (ex + 11)} -8 ${s * (ex + 13)} 9 ${s * (ex + 7)} 20 C${s * (ex + 5)} 24 ${s * (ex + 1)} 22 ${s * (ex - 1)} 18Z" fill="${skin}" stroke="${INK}" stroke-width="1.8"/><path d="M${s * (ex + 2)} 4 Q${s * (ex + 7)} 7 ${s * (ex + 4)} 15" stroke="${sh2}" stroke-width="1.5" fill="none"/>`;
  if (!/long|silver|bob|perm/.test(c.hair) || male) parts.push(ear(t > 0.3 ? -1 : 1), t > 0.3 ? '' : ear(-1));
  if (c.earrings) parts.push(`<path d="M${-ex - 3} 22 v10 M${ex + 3} 22 v10" stroke="${c.accent}" stroke-width="1.6"/><path d="M${-ex - 6} 34 a3.5 3.5 0 1 0 6 0 a2.6 2.6 0 1 1 -6 0Z M${ex} 34 a3.5 3.5 0 1 0 6 0 a2.6 2.6 0 1 1 -6 0Z" fill="${c.accent}"/>`);
  // face
  parts.push(`<path d="${faceD}" fill="${skin}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
  const fc = nid('fc');
  const shSide = t >= 0 ? -1 : 1;
  parts.push(`<defs><clipPath id="${fc}"><path d="${faceD}"/></clipPath></defs><g clip-path="url(#${fc})">
    <path d="M${shSide * 60} -20 C${shSide * 50} 10 ${shSide * (p.jawW + 2) + j} ${p.jawY - 4} ${j + shSide * 10} ${p.chinY + 4} L${shSide * 70} ${p.chinY + 10}Z" fill="${sh}" opacity=".55"/>
    <path d="${H.front}" fill="${sh}" opacity=".7" transform="translate(${t >= 0 ? -3 : 3} 7)"/>${H.side ? `<path d="${H.side}" fill="${sh}" opacity=".6" transform="translate(${t >= 0 ? 4 : -4} 3)"/>` : ''}
    <ellipse cx="${-sp + fx}" cy="${eyeY - 12}" rx="14" ry="5" fill="${tint(skin, 0.05)}" opacity=".0"/></g>`);
  // cheeks
  const blush = m.blush ?? 0.15;
  if (blush > 0) parts.push(`<ellipse cx="${-26 + fx}" cy="${eyeY + 20}" rx="10" ry="5" fill="#f08f8f" opacity="${0.18 + blush * 0.4}"/><ellipse cx="${26 + fx}" cy="${eyeY + 20}" rx="10" ry="5" fill="#f08f8f" opacity="${0.18 + blush * 0.4}"/>`);
  if (blush >= 0.9) parts.push(`<path d="M${-32 + fx} ${eyeY + 17} l4 -4 m2 4 l4 -4 m2 4 l4 -4 M${18 + fx} ${eyeY + 17} l4 -4 m2 4 l4 -4 m2 4 l4 -4" stroke="#d76d74" stroke-width="1.4" stroke-linecap="round"/>`);
  if (c.freckles) parts.push([[-30, 22], [-24, 25], [-34, 26], [30, 22], [24, 25], [34, 26]].map(([x, y]) => `<circle cx="${x + fx}" cy="${eyeY + y - 6}" r=".9" fill="${shade(skin, 0.3)}"/>`).join(''));
  // age: smile lines (nose wing → mouth corner), jowl hint
  if (old) parts.push(`<path d="M${-12 + fx} ${eyeY + 23} q-6 6 -5 13 M${12 + fx} ${eyeY + 23} q6 6 5 13" stroke="${sh2}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M${-p.jawW + 6 + j} ${p.jawY + 2} q4 8 10 10 M${p.jawW - 6 + j} ${p.jawY + 2} q-4 8 -10 10" stroke="${sh2}" stroke-width="1.1" fill="none" opacity=".7" stroke-linecap="round"/>`);
  else if (mid) parts.push(`<path d="M${-12 + fx} ${eyeY + 24} q-5 5 -5 11 M${12 + fx} ${eyeY + 24} q5 5 5 11" stroke="${sh2}" stroke-width="1.1" fill="none" opacity=".6" stroke-linecap="round"/>`);
  // eyes + brows
  parts.push(eye(-1, -sp + fx, eyeY, m, c, t, p), eye(1, sp + fx, eyeY, m, c, t, p));
  parts.push(brow(-1, -sp + fx, eyeY, m, c, t, p), brow(1, sp + fx, eyeY, m, c, t, p));
  // nose: a small hook for women and children; a longer side plane + nostril for men and the old
  const nx = 2 + fx * 1.15;
  if (male || old) parts.push(`<path d="M${nx - 1} ${eyeY + 8} Q${nx + 3 + t * 2} ${eyeY + 17} ${nx + 2} ${eyeY + 22} Q${nx - 1} ${eyeY + 25} ${nx - 5} ${eyeY + 23}" stroke="${sh2}" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M${nx - 6} ${eyeY + 22.5} q-2 -1 -1 -3" stroke="${sh2}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`);
  else parts.push(`<path d="M${nx} ${eyeY + 18} q${2 + t * 2} 4 ${-1} 6" stroke="${sh2}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
  const my = eyeY + (male ? 35 : 33) + (p.chinY - 62) * 0.3;
  if (c.mustache) parts.push(`<path d="M${-15 + fx} ${my} Q${-8 + fx} ${my - 8} ${fx} ${my - 5} Q${8 + fx} ${my - 8} ${15 + fx} ${my} Q${8 + fx} ${my - 3} ${fx} ${my - 2} Q${-8 + fx} ${my - 3} ${-15 + fx} ${my}Z" fill="${shade(c.hairColor, 0.05)}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`);
  if (c.beard) {
    const bc = c.hairColor, bs = shade(bc, 0.14);
    const bd = `M${-p.jawW - 2 + j} ${eyeY + 16} C${-p.jawW + j} ${eyeY + 46} ${-20 + j} ${p.chinY + 10} ${-8 + j} ${p.chinY + 16} L${-3 + j} ${p.chinY + 11} L${j} ${p.chinY + 18} L${3 + j} ${p.chinY + 11} L${8 + j} ${p.chinY + 16} C${20 + j} ${p.chinY + 10} ${p.jawW + j} ${eyeY + 46} ${p.jawW + 2 + j} ${eyeY + 16} C${p.jawW - 6 + j} ${eyeY + 30} ${22 + fx} ${my - 4} ${12 + fx} ${my - 6} Q${fx} ${my - 10} ${-12 + fx} ${my - 6} C${-22 + fx} ${my - 4} ${-p.jawW + 6 + j} ${eyeY + 30} ${-p.jawW - 2 + j} ${eyeY + 16}Z`;
    parts.push(`<path d="${bd}" fill="${bc}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${-p.jawW + 6 + j} ${eyeY + 34} q4 10 10 16 M${p.jawW - 6 + j} ${eyeY + 34} q-4 10 -10 16 M${-10 + j} ${p.chinY + 2} q2 6 0 10 M${10 + j} ${p.chinY + 2} q-2 6 0 10" stroke="${bs}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M${-9 + fx} ${my + 1} Q${fx} ${my + 4} ${9 + fx} ${my + 1} Q${fx} ${my + 8} ${-9 + fx} ${my + 1}Z" fill="${shade(skin, 0.35, 15)}"/>`);
  }
  parts.push(mouth(fx * 1.05, my, m, c, p));
  // marks: tears
  if (m.tears) parts.push(`<path d="M${-sp + fx + 4} ${eyeY + 7} q-3 10 0 16 q3 -6 0 -16Z M${sp + fx - 4} ${eyeY + 7} q-3 10 0 16 q3 -6 0 -16Z" fill="#bfe3f6" stroke="#7fb4d6" stroke-width="1"/>`);
  // front hair (+ shine and flow lines)
  parts.push(hairLayer(H.side, hc), hairLayer(H.front, hc), hairDetail(H, hc, t, H.front));
  if (H.tie) parts.push(c.hair === 'pigtails'
    ? `<circle cx="-54" cy="-16" r="5" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.4"/><circle cx="54" cy="-16" r="5" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.4"/>`
    : c.hair === 'braid' ? `<path d="M26 148 l-8 10 l14 -2 l12 6 l-4 -12Z" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.3"/>`
      : `<path d="M42 -52 l-10 -8 l2 14 Z M42 -52 l12 -10 l-2 14 Z" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.3"/>`);
  if (c.glasses) {
    const r = c.glasses === 'round' ? 15 : 13, gy = eyeY + 1;
    const frame = c.glasses === 'round' ? '#8a6b4a' : c.glasses === 'square' ? '#3e3640' : '#55505e';
    const lens = (x) => c.glasses === 'square' ? `<rect x="${x - 15}" y="${gy - 11}" width="30" height="21" rx="5"/>` : `<circle cx="${x}" cy="${gy}" r="${r}"/>`;
    parts.push(`<g fill="${c.glasses === 'thin' ? 'none' : 'rgba(255,255,255,.12)'}" stroke="${frame}" stroke-width="${c.glasses === 'square' ? 2.6 : 2}">${lens(-sp + fx)}${lens(sp + fx)}<path d="M${-sp + fx + (c.glasses === 'square' ? 15 : r)} ${gy - 1} q${sp - (c.glasses === 'square' ? 15 : r)} -5 ${2 * (sp - (c.glasses === 'square' ? 15 : r))} 0" fill="none"/></g><path d="M${-sp + fx - 8} ${gy - 6} l5 -3 M${sp + fx - 8} ${gy - 6} l5 -3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`);
  }
  if (m.sweat) parts.push(`<path d="M46 -26 q6 9 0 14 q-6 -5 0 -14Z" fill="#cde9f7" stroke="#6aa6cc" stroke-width="1.2"/>`);
  if (m.lines) parts.push(`<path d="M-66 -40 l-10 -8 M-70 -24 l-12 -2 M66 -40 l10 -8 M70 -24 l12 -2" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`);
  if (c.cap) parts.push(`<path d="M-52 -30 C-54 -68 54 -68 52 -30 Z" fill="${c.cap}" stroke="${INK}" stroke-width="2.3"/><path d="M-52 -32 Q${10 + t * 20} -40 ${64 + t * 10} -24 L${56 + t * 10} -18 Q0 -26 -52 -26Z" fill="${shade(c.cap, 0.08)}" stroke="${INK}" stroke-width="2.3"/><path d="M-32 -60 Q0 -68 32 -60" stroke="${tint(c.cap, 0.15)}" stroke-width="3" fill="none"/><path d="M-50 -30 Q0 -36 50 -30" stroke="${shade(c.cap, 0.2)}" stroke-width="2" fill="none"/>`);
  return parts.join('');
}

// ---------------------------------------------------------------- outfits (bust)
// Build: neck base, trapezius slope to the shoulder point, round deltoid, arm down to the frame. No more dome torsos.
function frame(c) {
  return c.kid ? { nb: 11, sx: 46, sy: 92, dx: 58, dy: 110, bx: 62, by: 150 }
    : c.gender === 'm' ? { nb: 16.5, sx: 68, sy: 95, dx: 88, dy: 118, bx: 94, by: 160 }
      : { nb: 13, sx: 57, sy: 97, dx: 74, dy: 120, bx: 80, by: 160 };
}
function torso(c, { t = 0 } = {}) {
  const col = c.cloth, sh = shade(col, 0.16), acc = c.accent, B = frame(c), p = profile(c);
  const nw = p.neck;
  const neckD = `M${-nw} 36 C${-nw} 58 ${-nw - 1} 70 ${-nw - 3} 84 L${nw + 3} 84 C${nw + 1} 70 ${nw} 58 ${nw} 36Z`;
  const nc = nid('nk');
  const neck = `<defs><clipPath id="${nc}"><path d="${neckD}"/></clipPath></defs><path d="${neckD}" fill="${c.skin}" stroke="${INK}" stroke-width="2"/>
    <g clip-path="url(#${nc})"><ellipse cx="${t * 6}" cy="${p.chinY - 6}" rx="${nw + 8}" ry="16" fill="${shade(c.skin, 0.2, 320)}" opacity=".85"/></g>
    ${c.gender === 'm' && !c.beard ? `<path d="M${1 + t * 4} 66 q2 3 0 6" stroke="${shade(c.skin, 0.25, 320)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` : ''}`;
  const S = (s) => `${s * B.sx} ${B.sy}`;
  const d = `M${-B.nb - 2} 78 C${-B.nb - 14} 83 ${-B.sx + 20} ${B.sy - 9} ${S(-1)} C${-B.dx + 5} ${B.sy + 3} ${-B.dx} ${B.dy - 9} ${-B.dx} ${B.dy} C${-B.bx} ${B.dy + 14} ${-B.bx} ${B.by - 20} ${-B.bx - 1} ${B.by} L${B.bx + 1} ${B.by} C${B.bx} ${B.by - 20} ${B.bx} ${B.dy + 14} ${B.dx} ${B.dy} C${B.dx} ${B.dy - 9} ${B.dx - 5} ${B.sy + 3} ${S(1)} C${B.sx - 20} ${B.sy - 9} ${B.nb + 14} 83 ${B.nb + 2} 78Z`;
  const bc = nid('bd'), sg = t >= 0 ? -1 : 1;
  const arm = (s) => `M${s * (B.dx - 12)} ${B.dy + 2} C${s * (B.dx - 9)} ${B.dy + 18} ${s * (B.dx - 7)} ${B.by - 22} ${s * (B.dx - 8)} ${B.by}`;
  const body = `<defs><clipPath id="${bc}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${col}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <g clip-path="url(#${bc})"><path d="M${sg * (B.bx + 4)} ${B.by} L${sg * (B.bx + 4)} ${B.sy - 10} C${sg * (B.sx - 10)} ${B.sy} ${sg * (B.dx - 22)} ${B.dy + 4} ${sg * (B.dx - 30)} ${B.by}Z" fill="${sh}" opacity=".85"/>
      <ellipse cx="${t * 5}" cy="84" rx="${B.nb + 16}" ry="7" fill="${sh}" opacity=".7"/></g>
    <path d="${arm(-1)} ${arm(1)}" stroke="${shade(col, 0.32)}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  let detail = '';
  switch (c.outfit) {
    case 'witch': detail = `<path d="M-16 77 Q-30 90 -42 101 Q-16 109 0 94 Q16 109 42 101 Q30 90 16 77 Q0 87 -16 77Z" fill="${acc}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M-40 100 Q-18 106 -2 94" stroke="${shade(acc, 0.15)}" stroke-width="1.2" fill="none"/><path d="M0 93 l-6 10 h12Z" fill="${c.ribbon}" stroke="${INK}" stroke-width="1.4"/><path d="M-6 97 q-14 -8 -14 4 q0 8 14 0 M6 97 q14 -8 14 4 q0 8 -14 0" fill="${c.ribbon}" stroke="${INK}" stroke-width="1.4"/><circle cx="0" cy="97.5" r="3" fill="${shade(c.ribbon, 0.12)}" stroke="${INK}" stroke-width="1.2"/>`; break;
    case 'apron': detail = `<path d="M-15 78 Q0 92 15 78" stroke="${INK}" stroke-width="1.6" fill="${shade(col, 0.06)}"/><path d="M-32 112 Q0 105 32 112 L35 ${B.by} L-35 ${B.by}Z" fill="${acc}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M-30 112 L${-B.nb - 6} 82 M30 112 L${B.nb + 6} 82" stroke="${acc}" stroke-width="6.5"/><path d="M-27 112 L${-B.nb - 3} 82 M-33 112 L${-B.nb - 9} 82 M27 112 L${B.nb + 3} 82 M33 112 L${B.nb + 9} 82" stroke="${INK}" stroke-width="1" opacity=".6"/><path d="M-14 130 h28 v16 h-28Z" fill="none" stroke="${shade(acc, 0.18)}" stroke-width="1.3"/>`; break;
    case 'cardigan': detail = `<path d="M-15 78 L0 122 L15 78" fill="${acc}" stroke="${INK}" stroke-width="1.6"/><path d="M-12 79 Q-6 86 0 86 Q6 86 12 79" stroke="${shade(acc, 0.15)}" stroke-width="1.2" fill="none"/><path d="M0 122 L0 ${B.by}" stroke="${INK}" stroke-width="1.6"/><path d="M-2 122 L-17 78 M2 122 L17 78" stroke="${shade(col, 0.2)}" stroke-width="3" opacity=".6"/><circle cx="-6" cy="132" r="2.4" fill="${shade(col, 0.32)}"/><circle cx="-6" cy="148" r="2.4" fill="${shade(col, 0.32)}"/>`; break;
    case 'robe': detail = `<path d="M-17 78 Q0 88 17 78 L10 ${B.by} L-10 ${B.by}Z" fill="${shade(col, 0.14)}" stroke="${INK}" stroke-width="1.6"/><path d="M-26 82 L-8 ${B.by} M26 82 L8 ${B.by}" stroke="${acc}" stroke-width="2.4"/><path d="M0 104 a5 5 0 1 0 0 9 a3.8 3.8 0 1 1 0 -9Z" fill="${acc}"/><path d="M${-B.sx + 6} ${B.sy + 2} Q${-B.dx + 6} ${B.dy + 6} ${-B.dx + 4} ${B.by} M${B.sx - 6} ${B.sy + 2} Q${B.dx - 6} ${B.dy + 6} ${B.dx - 4} ${B.by}" stroke="${tint(col, 0.08)}" stroke-width="1.4" fill="none" opacity=".7"/>`; break;
    case 'uniform': detail = `<path d="M-17 77 L0 102 L17 77" fill="${acc}" stroke="${INK}" stroke-width="1.6"/><path d="M-17 77 L-28 96 L-8 98Z M17 77 L28 96 L8 98Z" fill="${shade(col, 0.08)}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M-4 98 L0 140 L4 98Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.2"/><rect x="28" y="112" width="18" height="6" rx="1" fill="${c.accent}" stroke="${INK}" stroke-width="1"/><path d="M${-B.sx + 4} ${B.sy - 2} l14 -2 l0 6 l-14 2Z M${B.sx - 4} ${B.sy - 2} l-14 -2 l0 6 l14 2Z" fill="${shade(col, 0.14)}" stroke="${INK}" stroke-width="1.2"/>`; break;
    case 'whitecoat': detail = `<path d="M-16 78 L0 108 L16 78Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.4"/><path d="M-16 78 L-4 118 L-30 ${B.by} M16 78 L4 118 L30 ${B.by}" stroke="${INK}" stroke-width="1.6" fill="none"/><path d="M-16 78 L-26 96 L-6 112Z M16 78 L26 96 L6 112Z" fill="${shade(col, 0.06)}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><rect x="-48" y="122" width="18" height="16" rx="2" fill="none" stroke="${shade(col, 0.2)}" stroke-width="1.3"/><path d="M-44 118 v10" stroke="#5d7f96" stroke-width="2.4" stroke-linecap="round"/>`; break;
    case 'coat': detail = `<path d="M-18 78 L-6 112 L-26 122 L-36 90Z M18 78 L6 112 L26 122 L36 90Z" fill="${shade(col, 0.06)}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-6 112 L-2 ${B.by} M6 112 L2 ${B.by}" stroke="${INK}" stroke-width="1.2"/><path d="M-14 78 L0 96 L14 78" fill="${shade(col, 0.3)}"/>${[132, 150].map((y) => `<circle cx="-12" cy="${y}" r="2.8" fill="${acc}" stroke="${shade(acc, 0.3)}" stroke-width=".8"/><circle cx="12" cy="${y}" r="2.8" fill="${acc}" stroke="${shade(acc, 0.3)}" stroke-width=".8"/>`).join('')}`; break;
    default: detail = `<path d="M-16 78 L-8 99 L0 86 L8 99 L16 78" fill="${acc}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M0 86 L0 ${B.by}" stroke="${shade(col, 0.3)}" stroke-width="1.3"/><circle cx="0" cy="108" r="1.8" fill="${tint(col, 0.2)}"/><circle cx="0" cy="126" r="1.8" fill="${tint(col, 0.2)}"/><circle cx="0" cy="144" r="1.8" fill="${tint(col, 0.2)}"/>`;
  }
  return neck + body + detail;
}

// hands for gestures in bust shots: 'wave' 'chin' 'chest' 'cup' 'letter' 'cheek' 'point' 'bread'
function hand(c, kind) {
  const sk = c.skin, sl = c.cloth;
  const mitt = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-11 6 C-13 -6 -10 -14 -2 -15 C6 -16 12 -10 12 -2 C12 8 6 13 -2 13 C-8 13 -11 10 -11 6Z" fill="${sk}" stroke="${INK}" stroke-width="2"/><path d="M-4 -14 L-4 -6 M2 -15 L2 -7 M7 -12 L7 -5" stroke="${shade(sk, 0.22)}" stroke-width="1.3" stroke-linecap="round"/><path d="M-11 4 C-17 2 -18 -5 -13 -7" stroke="${INK}" stroke-width="1.6" fill="${sk}"/></g>`;
  const sleeve = (d) => `<path d="${d}" fill="${sl}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
  switch (kind) {
    case 'wave': return sleeve('M56 160 C62 130 70 110 76 92 L96 98 C92 118 84 140 84 160Z') + mitt(88, 80, 15);
    case 'chin': return sleeve('M-40 160 C-34 130 -20 104 -8 92 L8 100 C-4 116 -16 136 -18 160Z') + mitt(2, 82, -10);
    case 'cheek': return sleeve('M40 160 C40 130 46 104 52 90 L68 96 C62 116 60 138 62 160Z') + mitt(52, 62, 20);
    case 'chest': return sleeve('M-60 160 C-50 140 -36 128 -20 122 L-10 136 C-26 142 -38 150 -42 160Z') + mitt(-6, 124, -60);
    case 'cup': return sleeve('M-40 160 C-30 140 -16 130 -4 128 L4 144 C-10 146 -20 152 -24 160Z') + `<path d="M-6 112 h28 l-3 26 h-22Z" fill="#f4efe6" stroke="${INK}" stroke-width="2"/><path d="M22 118 q10 2 0 12" stroke="${INK}" stroke-width="2" fill="none"/><path d="M2 106 q-4 -8 2 -14 M12 106 q-4 -8 2 -14" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>` + mitt(4, 132, -80);
    case 'letter': return sleeve('M-60 160 C-48 138 -30 126 -12 120 L-4 136 C-22 142 -36 150 -40 160Z') + `<g transform="rotate(-8 10 110)"><rect x="-10" y="92" width="44" height="30" rx="2" fill="#f6efdf" stroke="${INK}" stroke-width="2"/><path d="M-10 92 L12 110 L34 92" stroke="${INK}" stroke-width="1.6" fill="none"/><circle cx="12" cy="110" r="4.5" fill="#b8524c"/></g>` + mitt(-6, 128, -50);
    case 'bread': return sleeve('M-60 160 C-48 138 -30 126 -12 120 L-4 136 C-22 142 -36 150 -40 160Z') + `<path d="M-14 106 C-16 92 40 88 42 104 C44 116 -12 120 -14 106Z" fill="#d79a52" stroke="${INK}" stroke-width="2"/><path d="M-2 100 l6 8 M10 98 l6 8 M22 98 l6 8" stroke="#f2c98a" stroke-width="2.2" stroke-linecap="round"/>` + mitt(-6, 126, -50);
    case 'point': return sleeve('M50 160 C56 136 64 118 72 106 L88 114 C82 130 76 146 74 160Z') + `<g transform="translate(86 100) rotate(-35)"><path d="M-8 6 C-10 -2 -6 -8 2 -8 L22 -8 C26 -8 26 -3 22 -3 L8 -3 C12 0 12 8 4 10 C-2 12 -7 10 -8 6Z" fill="${sk}" stroke="${INK}" stroke-width="2"/></g>`;
    default: return '';
  }
}

// light: { rim: colour, side: -1|1, glow } — rim light on the lit side of hair and shoulders.
function rim(light, c) {
  if (!light?.rim) return '';
  const B = frame(c), s = light.side || 1;
  return `<path d="M${s * (B.nb + 2)} 78 C${s * (B.nb + 14)} 83 ${s * (B.sx - 20)} ${B.sy - 9} ${s * B.sx} ${B.sy} C${s * (B.dx - 5)} ${B.sy + 3} ${s * B.dx} ${B.dy - 9} ${s * B.dx} ${B.dy}" fill="none" stroke="${light.rim}" stroke-width="3" opacity=".6" stroke-linecap="round" transform="translate(${-s * 2} 2)"/>`;
}

export function bust(c, { mood = 'neutral', turn = 0, hand: hk, light, hat = false } = {}) {
  const t = turn;
  const H = hairShapes(c.hair, t);
  const longBack = /long|silver/.test(c.hair) ? `<path d="${H.back}" fill="${shade(c.hairColor, 0.12)}" stroke="${INK}" stroke-width="2.2"/>` : '';
  return `<g class="bust">${longBack}${torso(c, { t })}${rim(light, c)}
    <g class="head">${head(c, { mood, turn: t, light, cutBack: !!longBack })}${hat ? witchHat(c, t) : ''}</g>${hand(c, hk)}</g>`;
}

export function witchHat(c, t = 0) {
  const col = '#2a2542', hi = '#3d3563', lo = '#1e1a33', band = c.ribbon || '#b8524c';
  // brim seen from a little below (front edge dips), cone bends back at the tip, light from the left
  return `<g transform="translate(${t * 6} 0)"><path d="M-84 -50 C-70 -66 70 -66 84 -50 C70 -36 -70 -34 -84 -50Z" fill="${col}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>
    <path d="M-80 -48 C-60 -38 60 -38 80 -48" stroke="${hi}" stroke-width="2.4" fill="none" opacity=".9"/>
    <path d="M-42 -56 C-38 -98 -14 -146 22 -172 C30 -178 42 -176 46 -168 C36 -168 30 -160 28 -150 C24 -120 32 -86 44 -56 Q0 -48 -42 -56Z" fill="${hi}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>
    <path d="M12 -62 C12 -98 18 -130 28 -150 C24 -120 32 -86 44 -56 Q28 -53 12 -54Z" fill="${lo}" opacity=".55"/>
    <path d="M-42 -57 Q0 -47 44 -57 L42 -70 Q0 -61 -41 -71Z" fill="${band}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M-38 -60 Q0 -51 40 -60" stroke="${shade(band, 0.18)}" stroke-width="1.4" fill="none"/>
    <path d="M-26 -90 C-18 -118 -2 -142 18 -160" stroke="#5a5288" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M-12 -112 q6 -8 14 -12" stroke="${lo}" stroke-width="1.6" fill="none" opacity=".7"/></g>`;
}

// ---------------------------------------------------------------- full figure (rig)
// A small 2D rig instead of hand-placed shapes: each pose names WHERE the hands and feet go (targets on the body:
// chin, waist, knee, a held box), and two-bone IK finds the elbows and knees. Limbs are tapered tubes (round joints,
// no seams) drawn in three passes — ink outline, shadow tone, lit core shifted toward the light — so arms read as
// round. Light comes from the right like the busts (shadow side = left). Feet at y=0; adult ≈ 4.8 heads tall.
// Poses: stand, walk, wave, hold, sit, bow, run, point, think.
const R = (n) => Math.round(n * 10) / 10;
function tube(pts, rs) {
  const out = [];
  pts.forEach(([x, y], i) => { const r = rs[i]; out.push(`M${R(x - r)} ${R(y)}a${R(r)} ${R(r)} 0 1 1 ${R(2 * r)} 0a${R(r)} ${R(r)} 0 1 1 ${R(-2 * r)} 0Z`); });
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], r1 = rs[i], r2 = rs[i + 1];
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    let q = [[x1 + nx * r1, y1 + ny * r1], [x2 + nx * r2, y2 + ny * r2], [x2 - nx * r2, y2 - ny * r2], [x1 - nx * r1, y1 - ny * r1]];
    const area = q.reduce((a, [x, y], k) => { const [u, v] = q[(k + 1) % 4]; return a + x * v - u * y; }, 0);
    if (area < 0) q = q.reverse(); // same winding as the circles, so the union has no holes
    out.push(`M${q.map(([x, y]) => `${R(x)} ${R(y)}`).join('L')}Z`);
  }
  return out.join('');
}
// Outline, base (shadow tone), lit core: one call = one round limb.
function limb(pts, rs, base, lit, ow = 1.4) {
  const core = rs.map((r) => r * 0.6), dx = rs[0] * 0.34;
  return `<path d="${tube(pts, rs)}" fill="${INK}" stroke="${INK}" stroke-width="${ow * 2}" stroke-linejoin="round"/>` +
    `<path d="${tube(pts, rs)}" fill="${base}"/><path d="${tube(pts, core)}" fill="${lit}" transform="translate(${R(dx)} ${R(-dx * 0.3)})"/>`;
}
// Two-bone IK: root S, target T, bone lengths a, b. Of the two possible middle joints, take the one that is more
// "outward" (side s: -1 left, 1 right) and, weighted by `down`, lower — elbows point out and down, knees out.
function ik(S, T, a, b, s, down = 0.6) {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  const d = Math.max(Math.abs(a - b) + 1, Math.min(a + b - 0.5, Math.hypot(dx, dy)));
  const ang = Math.atan2(dy, dx), A = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const cand = [1, -1].map((g) => [S[0] + a * Math.cos(ang + g * A), S[1] + a * Math.sin(ang + g * A)]);
  const score = (P) => s * P[0] + down * P[1];
  const E = score(cand[0]) >= score(cand[1]) ? cand[0] : cand[1];
  const ex = T[0] - E[0], ey = T[1] - E[1], el = Math.hypot(ex, ey) || 1;
  return [E, [E[0] + (ex / el) * b, E[1] + (ey / el) * b]];
}
// Hands in a local frame: wrist at 0,0, fingers toward +y; thumb toward +x (mirrored for the other side).
const HANDS = {
  mitt: (sk) => `<path d="M-8 -1 C-10 8 -9 19 -2 23 C4 26 10 21 10 12 C10 5 9 0 7 -2Z" fill="${sk}" stroke="${INK}" stroke-width="2.2"/><path d="M8 4 C15 5 16 12 11 15" fill="${sk}" stroke="${INK}" stroke-width="2"/><path d="M-3 13 v6 M2 14 v6" stroke="${shade(sk, 0.22)}" stroke-width="1.2" stroke-linecap="round"/>`,
  open: (sk) => `<path d="M-8 -1 C-10 6 -9 12 -6 14 L-7 26 C-7 29 -3 29 -3 26 L-2 16 L-1 29 C-1 32 3 32 3 29 L3 16 L6 27 C7 30 10 29 10 26 L8 13 C10 8 9 2 7 -2Z" fill="${sk}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M8 3 C16 4 19 10 14 14" fill="${sk}" stroke="${INK}" stroke-width="2"/>`,
  point: (sk) => `<path d="M-8 -1 C-10 8 -9 16 -3 19 C3 21 9 18 9 11 C9 5 8 0 7 -2Z" fill="${sk}" stroke="${INK}" stroke-width="2.2"/><path d="M4 12 L5 34 C5 37 9 37 9 34 L9 12Z" fill="${sk}" stroke="${INK}" stroke-width="2"/>`,
};
function handAt(kind, W, E, s, sk, k) {
  const ang = (Math.atan2(W[1] - E[1], W[0] - E[0]) * 180) / Math.PI - 90;
  return `<g transform="translate(${R(W[0])} ${R(W[1])}) rotate(${R(ang)}) scale(${R(-s * k)} ${R(k)})">${HANDS[kind](sk)}</g>`;
}
function shoe(A, s, col, lift = 0) {
  return `<g transform="translate(${R(A[0])} ${R(A[1])}) rotate(${R(lift * s)}) scale(${s} 1)"><path d="M-7 -6 C-9 0 -14 4 -15 8 C-15 11 -12 12 -8 12 L9 12 C12 12 12 8 10 3 C9 -1 8 -4 7 -6Z" fill="${col}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-12 7 Q-4 5 4 7" stroke="${tint(col, 0.18)}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
}

const BUILD = {
  f: { LEG: 250, TORSO: 186, sw: 62, nb: 12.5, waist: 34, hip: 46, hw: 20, ua: 98, fa: 90, th: 128, sh: 118, ar: [12.5, 10, 8], lr: [16, 11.5, 8], hk: 1.1 },
  m: { LEG: 255, TORSO: 196, sw: 70, nb: 15.5, waist: 46, hip: 48, hw: 23, ua: 104, fa: 96, th: 130, sh: 121, ar: [15, 12.5, 10], lr: [18, 15, 12], hk: 1.25 },
  kid: { LEG: 172, TORSO: 138, sw: 46, nb: 10.5, waist: 34, hip: 36, hw: 17, ua: 70, fa: 64, th: 88, sh: 80, ar: [10.5, 8.8, 7], lr: [12.5, 9.5, 7.4], hk: 1 },
};
// What each outfit looks like on a whole body: top colour + where it ends, skirt / coat / pants.
function dress(c) {
  const f = c.gender !== 'm', col = c.cloth, dark = '#3b3a4a';
  const skirt = (hem, colr = col) => ({ hem, col: colr });
  switch (c.outfit) {
    case 'witch': return { skirt: skirt(-104), legs: '#2a2638', shoe: '#3a2e2e', collar: 'witch' };
    case 'apron': return f ? { skirt: skirt(c.name?.includes('젊을') ? -64 : -100), legs: c.skin, shoe: '#5a4036', apron: -120 }
      : { topHem: 18, pants: shade(col, 0.42), shoe: '#3a2e2e', apron: -128 };
    case 'cardigan': return { topHem: 12, skirt: skirt((c.age || 0) >= 2 ? -52 : -78, mix(col, '#3f3a4a', 0.55)), legs: c.skin, shoe: '#4a3a36', open: true };
    case 'robe': return { skirt: skirt(-14), legs: c.skin, shoe: '#2a2236', trim: c.accent };
    case 'whitecoat': return { coat: -112, pants: '#4a4658', shoe: '#3a2e2e', open: true };
    case 'uniform': return { topHem: 22, pants: shade(col, 0.2), shoe: '#2a2228', tie: '#7a3b3f' };
    case 'coat': return { coat: -196, pants: mix(shade(col, 0.2), '#55525e', 0.4), shoe: '#2a2228', buttons: c.accent };
    default: return c.kid ? { skirt: skirt(-82), legs: c.skin, shoe: '#c46a6a' } : f ? { skirt: skirt(-90), legs: c.skin, shoe: '#4a3a36' } : { topHem: 16, pants: '#3b3a48', shoe: '#2a2228' };
  }
}

export function figure(c, { mood = 'neutral', pose = 'stand', turn = 0, prop, light, hat = false, flip = false } = {}) {
  const B = c.kid ? BUILD.kid : c.gender === 'm' ? BUILD.m : BUILD.f;
  const D = dress(c), sk = c.skin, col = c.cloth, csh = shade(col, 0.16), skSh = shade(sk, 0.12, 330);
  const hs = 0.95;
  const sit = pose === 'sit', seat = c.kid ? 120 : 165;
  const bob = sit ? B.LEG - seat : pose === 'bow' ? 22 : 0;
  const lean = { walk: 4, run: 12, bow: 0 }[pose] || 0;
  const hipY = -B.LEG + bob, neckY = hipY - B.TORSO, waistY = hipY - B.TORSO * 0.34;
  const N = [lean, neckY], SL = [lean - B.sw + B.ar[0] * 0.7, neckY + 12 + B.ar[0]], SR = [lean + B.sw - B.ar[0] * 0.7, neckY + 12 + B.ar[0]];
  const HL = [-B.hw, hipY], HR = [B.hw, hipY];
  const chin = [lean + turn * 6, neckY - (84 - 62) * hs];
  const armLen = B.ua + B.fa;
  // pose = hand and foot targets (+ hand shapes)
  const T = {
    stand: { h: [[SL[0] - 7, SL[1] + armLen - 2], [SR[0] + 7, SR[1] + armLen - 2]], f: [[-21, -4], [22, -4]] },
    walk: { h: [[SL[0] + 24, SL[1] + armLen - 8], [SR[0] + 14, SR[1] + armLen - 6]], f: [[-19, -4], [12, -16]], lift: [0, 1] },
    run: { h: [[SL[0] + 30, SL[1] + 74], [SR[0] + 40, SR[1] + 128]], f: [[-28, -10], [30, -96]], lift: [0, 1] },
    wave: { h: [[SL[0] - 7, SL[1] + armLen - 2], [SR[0] + 52, SR[1] - 112]], f: [[-21, -4], [22, -4]], hand: ['mitt', 'open'] },
    hold: { h: [[-24, waistY + 34], [24, waistY + 34]], f: [[-21, -4], [22, -4]] },
    sit: { h: [[-30, hipY + 6], [30, hipY + 6]], f: [[-24, -8], [24, -8]], knees: true },
    bow: { h: [[-10, hipY - 6], [10, hipY - 6]], f: [[-21, -4], [22, -4]] },
    point: { h: [[SL[0] - 7, SL[1] + armLen - 2], [SR[0] + armLen - 14, SR[1] - 26]], f: [[-21, -4], [22, -4]], hand: ['mitt', 'point'] },
    think: { h: [[18, waistY + 10], [chin[0] + 8, chin[1] + 8]], f: [[-21, -4], [22, -4]], hand: ['mitt', 'mitt'] },
  }[pose] || null;
  const Q = T || { h: [[SL[0] - 7, SL[1] + armLen - 2], [SR[0] + 7, SR[1] + armLen - 2]], f: [[-21, -4], [22, -4]] };
  if (prop === 'umbrella') Q.h[1] = [SR[0] + 22, SR[1] + 40];
  if (prop === 'letter') Q.h[1] = [lean + 28, neckY + 70];
  if (prop === 'box') Q.h = [[lean - 40, neckY + 96], [lean + 40, neckY + 96]];
  if (prop === 'basket' && pose !== 'sit') Q.h = [[-26, waistY + 30], [26, waistY + 30]];
  const parts = [];
  // long hair hangs behind the body
  if (/long|silver/.test(c.hair)) parts.push(`<g transform="translate(${R(lean + turn * 4)} ${R(neckY - 84 * hs)}) scale(${hs})"><path d="${hairShapes(c.hair, turn).back}" fill="${shade(c.hairColor, 0.12)}" stroke="${INK}" stroke-width="2.4"/></g>`);
  // legs
  const legCol = D.pants || D.legs || sk;
  const lr = D.pants ? [B.lr[0] + 2, B.lr[1] + 2.5, B.lr[2] + 3] : B.lr;
  const legs = [HL, HR].map((H, i) => {
    const s = i ? 1 : -1, F = Q.f[i];
    let K, A;
    if (sit) { K = [H[0] + s * 8, hipY + 30]; A = [F[0], F[1] - 4]; }
    else [K, A] = ik(H, F, B.th, B.sh, s, 0);
    return { s, H, K, A, lift: (Q.lift || [0, 0])[i] };
  });
  for (const L of legs) parts.push(limb([L.H, L.K, L.A], lr, shade(legCol, 0.14), legCol));
  for (const L of legs) parts.push(shoe([L.A[0], L.A[1] - 2], L.s, D.shoe, L.lift ? 22 : 0));
  // torso (+ skirt)
  const top = neckY, ww = B.waist, hip = B.hip;
  const sx = (x, y) => R(x + lean * Math.max(0, Math.min(1, (hipY - y) / B.TORSO)));
  const side = (s) => {
    const pts = [[s * (B.nb + 1), top + 1], [s * (B.sw - 10), top + 8], [s * B.sw, top + 18], [s * (B.sw - 2), top + 52], [s * ww, waistY]];
    return pts.map(([x, y]) => [sx(x, y), y]);
  };
  const [l0, l1, l2, l3, l4] = side(-1), [r0, r1, r2, r3, r4] = side(1);
  const topHem = D.topHem != null ? hipY + D.topHem : null;
  const lower = D.coat
    ? (() => { const hem = sit ? hipY + 30 : D.coat, hw2 = hip + 10;
      return { d: `C${l4[0] - 2} ${waistY + 20} ${-hip - 2} ${hipY - 12} ${-hip} ${hipY} L${-hw2} ${hem} Q0 ${hem + 6} ${hw2} ${hem} L${hip} ${hipY} C${hip + 2} ${hipY - 12} ${r4[0] + 2} ${waistY + 20} ${r4[0]} ${waistY}`, hem, hw2 }; })()
    : D.skirt
    ? (() => { const hem = sit ? hipY + 34 : D.skirt.hem, hw2 = sit ? hip + 24 : hip + 16 + Math.max(0, hem - hipY) * 0.06;
      return { d: `C${l4[0] - 3} ${waistY + 26} ${-hip - 2} ${hipY - 12} ${-hip} ${hipY} C${-hw2 + 4} ${hipY + 30} ${-hw2} ${hem - 20} ${-hw2} ${hem} Q0 ${hem + 10} ${hw2} ${hem} C${hw2} ${hem - 20} ${hw2 - 4} ${hipY + 30} ${hip} ${hipY} C${hip + 2} ${hipY - 12} ${r4[0] + 3} ${waistY + 26} ${r4[0]} ${waistY}`, hem, hw2 }; })()
    : { d: `C${l4[0] - 3} ${waistY + 24} ${-hip - 2} ${hipY - 14} ${-hip} ${(topHem ?? hipY + 10) - 4} Q0 ${(topHem ?? hipY + 10) + 6} ${hip} ${(topHem ?? hipY + 10) - 4} C${hip + 2} ${hipY - 14} ${r4[0] + 3} ${waistY + 24} ${r4[0]} ${waistY}`, hem: topHem ?? hipY + 10, hw2: hip };
  const bodyD = `M${l0[0]} ${l0[1]} C${l0[0] - 8} ${l0[1] + 3} ${l1[0] + 2} ${l1[1] - 2} ${l1[0]} ${l1[1]} C${l2[0] + 2} ${l2[1] - 6} ${l2[0] - 2} ${l2[1] + 6} ${l3[0]} ${l3[1]} C${l3[0] + 1} ${l3[1] + 16} ${l4[0] - 2} ${waistY - 14} ${l4[0]} ${l4[1]} ${lower.d} C${r4[0] + 2} ${waistY - 14} ${r3[0] - 1} ${r3[1] + 16} ${r3[0]} ${r3[1]} C${r2[0] + 2} ${r2[1] + 6} ${r2[0] - 2} ${r2[1] - 6} ${r1[0]} ${r1[1]} C${r1[0] - 2} ${r1[1] - 2} ${r0[0] + 8} ${r0[1] + 3} ${r0[0]} ${r0[1]}Z`;
  const bc = nid('fb');
  parts.push(`<defs><clipPath id="${bc}"><path d="${bodyD}"/></clipPath></defs><path d="${bodyD}" fill="${col}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`);
  const det = [];
  // cel shadow on the left third + skirt folds + waist
  det.push(`<path d="M${-hip - 40} ${top - 10} L${sx(-B.sw * 0.42, top + 30)} ${top - 10} C${sx(-B.sw * 0.5, waistY)} ${top + 60} ${-ww * 0.5} ${waistY} ${-lower.hw2 * 0.45} ${lower.hem + 20} L${-hip - 40} ${lower.hem + 20}Z" fill="${csh}" opacity=".85"/>`);
  if (D.skirt) det.push(`<path d="M${-hip * 0.5} ${hipY} Q${-lower.hw2 * 0.55} ${(hipY + lower.hem) / 2} ${-lower.hw2 * 0.6} ${lower.hem + 2} M${hip * 0.35} ${hipY + 4} Q${lower.hw2 * 0.4} ${(hipY + lower.hem) / 2} ${lower.hw2 * 0.45} ${lower.hem + 3}" stroke="${shade(D.skirt.col, 0.25)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  if (D.skirt && D.skirt.col !== col) det.push(`<path d="M${-hip - 30} ${hipY + 10} L${hip + 30} ${hipY + 10} L${hip + 30} ${lower.hem + 20} L${-hip - 30} ${lower.hem + 20}Z" fill="${D.skirt.col}"/><path d="M${-hip - 30} ${hipY + 10} L${-lower.hw2 * 0.5} ${hipY + 10} L${-lower.hw2 * 0.55} ${lower.hem + 20} L${-hip - 30} ${lower.hem + 20}Z" fill="${shade(D.skirt.col, 0.16)}"/><path d="M${-hip - 4} ${hipY + 10} Q0 ${hipY + 16} ${hip + 4} ${hipY + 10}" stroke="${INK}" stroke-width="1.8" fill="none"/>`);
  if (D.apron) { const ah = sit ? hipY + 34 : D.apron; det.push(`<path d="M${sx(-B.sw * 0.55, top + 40)} ${top + 40} Q${sx(0, top + 36)} ${top + 34} ${sx(B.sw * 0.55, top + 40)} ${top + 40} L${ww * 0.85} ${waistY} L${hip + 2} ${ah} Q0 ${ah + 8} ${-hip - 2} ${ah} L${-ww * 0.85} ${waistY}Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${-ww - 2} ${waistY} Q0 ${waistY + 6} ${ww + 2} ${waistY}" stroke="${shade(c.accent, 0.2)}" stroke-width="3" fill="none"/>`); }
  if (D.collar === 'witch') det.push(`<path d="M${sx(-B.nb - 2, top)} ${top} Q${sx(-B.sw * 0.8, top + 18)} ${top + 26} ${sx(-B.sw * 0.6, top + 30)} ${top + 30} Q${sx(-6, top + 30)} ${top + 34} ${sx(0, top + 20)} ${top + 18} Q${sx(6, top + 30)} ${top + 34} ${sx(B.sw * 0.6, top + 30)} ${top + 30} Q${sx(B.sw * 0.8, top + 18)} ${top + 26} ${sx(B.nb + 2, top)} ${top}Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${sx(0, top + 20)} ${top + 18} l-9 -6 l0 14Z M${sx(0, top + 20)} ${top + 18} l9 -6 l0 14Z" fill="${c.ribbon}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M${sx(0, top + 50)} ${top + 40} V${waistY + 10}" stroke="${shade(col, 0.3)}" stroke-width="1.4"/><path d="M${-ww - 1} ${waistY} Q0 ${waistY + 5} ${ww + 1} ${waistY}" stroke="${shade(col, 0.32)}" stroke-width="2.4" fill="none"/>`);
  if (D.open) det.push(`<path d="M${sx(-B.nb, top)} ${top + 2} L${sx(0, top + 60)} ${top + 62} L${sx(B.nb, top)} ${top + 2}Z" fill="${c.outfit === 'whitecoat' ? c.accent : c.accent}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${sx(0, top + 62)} ${top + 62} L0 ${D.coat ? lower.hem : lower.hem}" stroke="${INK}" stroke-width="1.6"/>`);
  if (D.trim) det.push(`<path d="M${sx(-B.nb - 4, top)} ${top + 4} L${-lower.hw2 * 0.25} ${lower.hem} M${sx(B.nb + 4, top)} ${top + 4} L${lower.hw2 * 0.25} ${lower.hem}" stroke="${D.trim}" stroke-width="3"/>`);
  if (D.tie) det.push(`<path d="M${sx(-B.nb, top)} ${top + 1} L${sx(0, top + 22)} ${top + 24} L${sx(B.nb, top)} ${top + 1}Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.4"/><path d="M${sx(-4, top + 24)} ${top + 24} L${sx(0, top + 80)} ${top + 82} L${sx(4, top + 24)} ${top + 24}Z" fill="${D.tie}" stroke="${INK}" stroke-width="1.2"/><path d="M${-ww - 1} ${hipY + D.topHem - 30} H${ww + 1}" stroke="${shade(col, 0.35)}" stroke-width="5"/>`);
  if (D.buttons) det.push(`<path d="M${sx(-B.nb - 2, top)} ${top + 2} L${sx(-10, top + 40)} ${top + 44} L${sx(-24, top + 30)} ${top + 30}Z M${sx(B.nb + 2, top)} ${top + 2} L${sx(10, top + 40)} ${top + 44} L${sx(24, top + 30)} ${top + 30}Z" fill="${shade(col, 0.08)}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>${[top + 60, top + 100, top + 140].map((y) => `<circle cx="${sx(-12, y)}" cy="${y}" r="3.4" fill="${D.buttons}"/><circle cx="${sx(12, y)}" cy="${y}" r="3.4" fill="${D.buttons}"/>`).join('')}`);
  if (!D.skirt && !D.collar && !D.tie && !D.buttons && !D.open) det.push(`<path d="M${sx(-B.nb, top)} ${top + 1} L${sx(-5, top + 22)} ${top + 22} L${sx(0, top + 10)} ${top + 10} L${sx(5, top + 22)} ${top + 22} L${sx(B.nb, top)} ${top + 1}Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M${sx(0, top + 12)} ${top + 12} L0 ${lower.hem}" stroke="${shade(col, 0.3)}" stroke-width="1.4"/>`);
  if (c.kid && D.skirt) det.push(`<path d="M${sx(-B.nb, top)} ${top + 1} Q${sx(0, top + 16)} ${top + 18} ${sx(B.nb, top)} ${top + 1}" stroke="${c.accent}" stroke-width="5" fill="none"/>`);
  parts.push(`<g clip-path="url(#${bc})">${det.join('')}</g>`);
  // arms (sleeves), props, hands
  const handK = B.hk, kinds = Q.hand || ['mitt', 'mitt'];
  const arms = [SL, SR].map((S, i) => { const s = i ? 1 : -1; const [E, W] = ik(S, Q.h[i], B.ua, B.fa, s, 0.6); return { s, S, E, W }; });
  const sleeveCol = c.outfit === 'whitecoat' ? col : col;
  for (const a of arms) {
    parts.push(limb([a.S, a.E, a.W], B.ar, csh, sleeveCol));
    const cuff = [a.W[0] + (a.E[0] - a.W[0]) * 0.08, a.W[1] + (a.E[1] - a.W[1]) * 0.08];
    if (c.outfit === 'witch' || c.outfit === 'robe' || c.outfit === 'coat') parts.push(`<path d="${tube([cuff, a.W], [B.ar[2] + 1.2, B.ar[2] + 1.2])}" fill="${c.outfit === 'witch' ? c.accent : shade(col, 0.2)}" stroke="${INK}" stroke-width="1.4"/>`);
  }
  if (prop === 'basket' || (pose === 'hold' && !prop)) { const by = (arms[0].W[1] + arms[1].W[1]) / 2 + 22; parts.push(`<g transform="translate(0 ${R(by)})"><path d="M-34 -42 Q0 -84 34 -42" stroke="#8a6238" stroke-width="5" fill="none"/><path d="M-44 -8 L44 -8 L36 34 L-36 34Z" fill="#b98a55" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-40 6 H40 M-38 20 H38" stroke="#8a6238" stroke-width="2"/><path d="M-44 -8 L44 -8 L44 -2 L-44 -2Z" fill="#a5784a" stroke="${INK}" stroke-width="1.6"/><ellipse cx="-14" cy="-13" rx="20" ry="11" fill="#d79a52" stroke="${INK}" stroke-width="1.8"/><ellipse cx="16" cy="-15" rx="16" ry="10" fill="#e2b06a" stroke="${INK}" stroke-width="1.8"/><path d="M-24 -16 l5 5 M-14 -18 l5 5 M10 -19 l5 5" stroke="#f2c98a" stroke-width="2" stroke-linecap="round"/></g>`); }
  if (prop === 'box') parts.push(`<g transform="translate(${R(lean)} ${R(neckY + 104)})"><rect x="-44" y="-34" width="88" height="66" rx="3" fill="#d9b98a" stroke="${INK}" stroke-width="2.2"/><rect x="-44" y="-34" width="88" height="10" fill="#c9a774"/><path d="M-44 -6 H44 M0 -34 V32" stroke="#b8524c" stroke-width="5"/></g>`);
  if (prop === 'umbrella') { const W = arms[1].W; parts.push(`<g transform="translate(${R(W[0])} ${R(W[1])})"><path d="M0 26 V-190" stroke="${INK}" stroke-width="4"/><path d="M0 26 q0 10 -8 10" stroke="${INK}" stroke-width="4" fill="none"/><path d="M-110 -180 Q0 -270 110 -180 Q82 -194 55 -180 Q28 -194 0 -180 Q-28 -194 -55 -180 Q-82 -194 -110 -180Z" fill="#6f8fa8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-55 -180 Q-40 -240 0 -258 M55 -180 Q40 -240 0 -258" stroke="${shade('#6f8fa8', 0.2)}" stroke-width="2" fill="none"/></g>`); }
  if (prop === 'letter') { const W = arms[1].W; parts.push(`<g transform="translate(${R(W[0] - 6)} ${R(W[1] + 16)}) rotate(-10)"><rect x="-22" y="-15" width="44" height="30" rx="2" fill="#f6efdf" stroke="${INK}" stroke-width="2"/><path d="M-22 -15 L0 2 L22 -15" stroke="${INK}" stroke-width="1.6" fill="none"/><circle cx="0" cy="2" r="4" fill="#b8524c"/></g>`); }
  for (const [i, a] of arms.entries()) parts.push(handAt(kinds[i], a.W, a.E, a.s, sk, handK));
  // neck + head
  const nw = profile(c).neck;
  parts.push(`<g transform="translate(${R(lean + turn * 4)} ${R(neckY - 84 * hs)}) scale(${hs})"><path d="M${-nw} 36 C${-nw} 58 ${-nw - 1} 70 ${-nw - 3} 86 L${nw + 3} 86 C${nw + 1} 70 ${nw} 58 ${nw} 36Z" fill="${sk}" stroke="${INK}" stroke-width="2.2"/><ellipse cx="${turn * 6}" cy="${profile(c).chinY - 4}" rx="${nw + 6}" ry="14" fill="${skSh}" opacity=".8"/>${head(c, { mood, turn, light, cutBack: /long|silver/.test(c.hair) })}${hat ? witchHat(c, turn) : ''}</g>`);
  const sc = c.kid ? 0.95 : 1;
  return `<g class="figure" transform="${flip ? 'scale(-1 1) ' : ''}scale(${sc})"><ellipse cx="0" cy="2" rx="${sit ? 60 : 52}" ry="8" fill="#000" opacity=".16"/>${parts.join('')}</g>`;
}

// Witch on a broom, side view silhouette-friendly (for flight shots). Faces right; origin = broom centre.
export function flyer(c, { light, cape = '#2f2b4a' } = {}) {
  const col = c.cloth;
  return `<g class="flyer">
    <path d="M-150 6 L120 -6" stroke="#6b4a32" stroke-width="9" stroke-linecap="round"/>
    <path d="M-150 6 C-190 -16 -230 -4 -250 -26 C-236 0 -244 14 -262 22 C-238 20 -226 34 -248 46 C-214 36 -186 30 -150 12Z" fill="#c9a457" stroke="${INK}" stroke-width="2.2"/>
    <path d="M-20 -6 C-60 -40 -110 -30 -140 -60 C-120 -20 -80 0 -30 6Z" fill="${shade(col, 0.1)}" stroke="${INK}" stroke-width="2"/>
    <path d="M-40 0 C-40 -60 -10 -96 20 -96 C40 -96 46 -60 40 0 Q0 14 -40 0Z" fill="${col}" stroke="${INK}" stroke-width="2.3"/>
    <path d="M10 2 C30 20 54 30 70 44 L78 34 C62 22 44 8 30 -4Z" fill="${c.skin}" stroke="${INK}" stroke-width="2"/>
    <path d="M70 44 l14 2 l-2 -12Z" fill="#3a2e2e" stroke="${INK}" stroke-width="1.8"/>
    <path d="M24 -70 C44 -54 60 -36 76 -16" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M24 -70 C44 -54 60 -36 76 -16" stroke="${col}" stroke-width="17" stroke-linecap="round"/><circle cx="78" cy="-12" r="9" fill="${c.skin}" stroke="${INK}" stroke-width="2"/>
    <g transform="translate(18 -132) scale(.58)">${head(c, { mood: 'smile', turn: 0.8, light })}${witchHat(c, 0.8)}</g>
  </g>`;
}
