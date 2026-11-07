// Webtoon characters: soft anime style with clean line art, one cel-shadow tone (hue-shifted with color.js),
// glossy eyes, hair with a highlight band, and a full set of expressions.
//   bust(spec, { mood, turn, look, hand, light })   head + shoulders, head width = 100 units, origin = head centre
//   figure(spec, { mood, pose, turn, prop, light })  whole body, feet at y=0, ~700 units tall
// spec: an entry of FOLK (or the learner's look). Every function returns SVG markup (our own, trusted).
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
  head: { name: '서 선생님', hair: 'silver', hairColor: '#cfd0e4', skin: '#f4e1d6', eyes: 'calm', eyeColor: '#7f74a8', outfit: 'robe', cloth: '#2b2547', accent: '#d4b26a', gender: 'f', face: 'long', earrings: true },
  driver: { name: '기사님', hair: 'short', hairColor: '#5e5a60', skin: '#e2b896', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'uniform', cloth: '#3d4f66', accent: '#e8e1d0', gender: 'm', age: 1, cap: '#2e3b4f', mustache: true },
  baker: { name: '민지 아버지', hair: 'short', hairColor: '#2e2724', skin: '#e8bf9c', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'apron', cloth: '#6b7a86', accent: '#f6efe2', gender: 'm', age: 1 },
  mom: { name: '민지 어머니', hair: 'perm', hairColor: '#3a2c26', skin: '#f0caa9', eyes: 'soft', eyeColor: '#4e3a2e', outfit: 'cardigan', cloth: '#9a7aa8', accent: '#f4ecdf', gender: 'f', age: 1 },
  pharm: { name: '약사', hair: 'long', hairColor: '#2a1f1b', skin: '#f3d5bf', eyes: 'soft', eyeColor: '#4a3428', outfit: 'whitecoat', cloth: '#f4f1ea', accent: '#9fb8c8', gender: 'f', glasses: 'thin' },
  clerk: { name: '점원', hair: 'short', hairColor: '#1f1a18', skin: '#e9c3a5', eyes: 'round', eyeColor: '#3d2e26', outfit: 'shirt', cloth: '#6f8fa8', accent: '#f2efe8', gender: 'm' },
  staff: { name: '직원', hair: 'perm', hairColor: '#2e2420', skin: '#e8c0a0', eyes: 'soft', eyeColor: '#4a3428', outfit: 'apron', cloth: '#a35d5d', accent: '#f3eee6', gender: 'f', age: 1 },
  captain: { name: '선장님', hair: 'short', hairColor: '#e7e3dd', skin: '#d9a98a', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'coat', cloth: '#2f3d52', accent: '#c9a457', gender: 'm', age: 2, beard: true, cap: '#27324a' },
  grandpa: { name: '할아버지 (젊을 때)', hair: 'short', hairColor: '#231b18', skin: '#e6bb98', eyes: 'round', eyeColor: '#3d2e26', outfit: 'coat', cloth: '#3f5168', accent: '#e8e1d0', gender: 'm', cap: '#33415a' },
  younggrandma: { name: '할머니 (젊을 때)', hair: 'braid', hairColor: '#2b201c', skin: '#f3d3be', eyes: 'bright', eyeColor: '#5a3b2c', outfit: 'apron', cloth: '#c98b6b', accent: '#fbf3e6', gender: 'f', ribbon: '#c9a457' },
  man: { name: '아저씨', hair: 'short', hairColor: '#2a2421', skin: '#e8c0a0', eyes: 'narrow', eyeColor: '#3d2e26', outfit: 'shirt', cloth: '#5a6b8a', accent: '#f2efe8', gender: 'm', age: 1 },
  woman: { name: '아주머니', hair: 'bob', hairColor: '#3b2a22', skin: '#f2d3bd', eyes: 'soft', eyeColor: '#4a3428', outfit: 'cardigan', cloth: '#b68e6a', accent: '#f4ecdf', gender: 'f', age: 1 },
  girl: { name: '아이', hair: 'pigtails', hairColor: '#2b1f1c', skin: '#f6dccb', eyes: 'bright', eyeColor: '#5a3b2c', outfit: 'shirt', cloth: '#e3a0a8', accent: '#fff7ee', gender: 'f', kid: true, ribbon: '#e6b44c' },
};
// Her own look from Settings (hair style + colours) on top of the default learner.
export function learner(look = {}) {
  const hairMap = { bob: 'bob', long: 'long', ponytail: 'ponytail', bun: 'bun', short: 'pixie' };
  return { ...FOLK.me, hair: hairMap[look.hair] || 'bob', hairColor: look.hairColor || FOLK.me.hairColor, skin: look.skin || FOLK.me.skin, accent: look.coat || FOLK.me.accent };
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

function eye(side, cx, cy, sp, m, c, ids, turn) {
  const S = EYE_SHAPES[c.eyes] || EYE_SHAPES.round;
  const far = side * turn < 0 ? 1 - Math.abs(turn) * 0.28 : 1;
  const w = S.w * far, tilt = S.tilt * side;
  const lw = 2.6;
  if (m.eye === 'arc') {
    const d = `M${cx - w} ${cy + 2} Q${cx} ${cy - 9} ${cx + w} ${cy + 2}`;
    return `<path d="${d}" stroke="${INK}" stroke-width="${lw + 0.4}" fill="none" stroke-linecap="round"/>`;
  }
  if (m.eye === 'line') {
    return `<path d="M${cx - w} ${cy + 1} Q${cx} ${cy + 5} ${cx + w} ${cy + 1}" stroke="${INK}" stroke-width="${lw}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${cx + side * w} ${cy + 1} l${side * 3} -2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  const open = m.eye === 'wide' ? 1.2 : m.eye;
  const h = S.h * open;
  const top = cy - h * 0.66, bot = cy + h * 0.42;
  // almond outline: upper lid arches, lower lid flatter; outer corner lifted by tilt
  const xo = cx + side * w, xi = cx - side * w;
  const lid = `M${xi} ${cy + 1} C${xi + side * w * 0.2} ${top - 1} ${xo - side * w * 0.35} ${top - 2 + tilt} ${xo} ${cy - 2 + tilt}`;
  const lower = `C${xo - side * w * 0.2} ${bot} ${xi + side * w * 0.3} ${bot + 1} ${xi} ${cy + 1}`;
  const clip = nid('ec');
  const [lx, ly] = m.look || [0, 0];
  const pr = (m.pupil || 1);
  const ir = w * 0.74, irh = S.h * 0.66 * Math.max(0.8, Math.min(1.1, open));
  const ix = cx + lx * 0.9 + turn * 3, iy = cy + ly * 0.7 - 0.5;
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
      <ellipse cx="${ix + 3.2}" cy="${iy - irh * 0.42}" rx="2.9" ry="3.4" fill="#fff"/>
      <circle cx="${ix - 3}" cy="${iy + irh * 0.35}" r="1.3" fill="#fff" opacity=".85"/>
      ${m.sparkle ? `<circle cx="${ix - 2.5}" cy="${iy - 2}" r="1.4" fill="#fff"/><circle cx="${ix + 2}" cy="${iy + 4}" r=".9" fill="#fff"/>` : ''}`}
    </g>
    <path d="${lid}" stroke="${INK}" stroke-width="${lw + 0.6}" fill="none" stroke-linecap="round"/>
    <path d="M${xo - side * 1} ${cy - 2 + tilt} l${side * 4} ${-2.5}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M${xo - side * w * 0.15} ${bot - 0.5} Q${cx} ${bot + 1.6} ${xi + side * w * 0.45} ${bot - 0.5}" stroke="${INK}" stroke-width="1" fill="none" opacity=".55"/>
    <path d="M${xi + side * w * 0.2} ${top - 4.5} Q${cx} ${top - 8} ${xo - side * w * 0.1} ${top - 4.5 + tilt}" stroke="${INK}" stroke-width=".9" fill="none" opacity=".35"/>`;
}

function brow(side, cx, cy, m, c, turn) {
  const [inner, outer] = m.brow || [0, 0];
  const far = side * turn < 0 ? 0.8 : 1;
  const xi = cx - side * 11 * far, xo = cx + side * 12 * far;
  const yi = cy - 19 - inner, yo = cy - 18 - outer;
  const col = c.age >= 2 ? shade(c.hairColor, 0.25) : shade(c.hairColor, 0.05);
  return `<path d="M${xi} ${yi + 1} Q${cx} ${Math.min(yi, yo) - 3.5} ${xo} ${yo + 1.5}" stroke="${col}" stroke-width="${c.gender === 'm' ? 3.4 : 2.4}" fill="none" stroke-linecap="round"/>`;
}

function mouth(cx, cy, m, c) {
  const lip = shade(c.skin, 0.32, 15);
  switch (m.mouth) {
    case 'smile': return `<path d="M${cx - 8} ${cy - 1} Q${cx} ${cy + 6} ${cx + 8} ${cy - 1}" stroke="${INK}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
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
    default: return `<path d="M${cx - 5} ${cy + 1} Q${cx} ${cy + 2.4} ${cx + 5} ${cy + 1}" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  }
}

// ---------------------------------------------------------------- hair
// Each style: back (behind head), front (bangs, over face), plus optional extras. Coordinates in head units.
function hairShapes(style, t) {
  const sx = (x) => x + t * 6; // bangs follow the turn a little
  switch (style) {
    case 'bob': return {
      back: 'M-56 -12 C-60 -58 -26 -74 0 -73 C28 -74 61 -56 57 -10 C56 18 60 40 52 56 C40 62 26 54 22 44 L-22 44 C-26 54 -42 62 -54 55 C-60 40 -56 18 -56 -12Z',
      front: `M-53 -4 C-58 -46 -30 -68 ${sx(2)} -68 C30 -68 58 -48 53 -4 C50 -16 46 -26 40 -30 C38 -18 32 -12 26 -10 C28 -22 26 -30 22 -36 C16 -22 6 -16 ${sx(-4)} -14 C${sx(0)} -24 ${sx(-2)} -32 ${sx(-6)} -38 C-14 -24 -26 -16 -38 -12 C-34 -22 -34 -28 -36 -32 C-44 -26 -48 -16 -53 -4Z`,
      side: 'M-53 -4 C-56 14 -54 30 -46 44 C-44 30 -44 14 -42 0Z M53 -4 C56 14 54 30 46 44 C44 30 44 14 42 0Z',
    };
    case 'pixie': return {
      back: 'M-54 -8 C-58 -56 -26 -72 0 -72 C28 -72 59 -55 55 -8 C54 4 52 14 48 18 L-48 18 C-52 12 -54 4 -54 -8Z',
      front: `M-52 -2 C-56 -44 -28 -68 ${sx(2)} -68 C32 -68 58 -46 52 -6 C48 -20 40 -30 30 -34 C30 -24 24 -18 18 -16 C${sx(10)} -26 ${sx(4)} -32 ${sx(-4)} -36 C-12 -24 -26 -18 -40 -16 C-44 -14 -48 -8 -52 -2Z`,
      side: 'M-52 -2 C-54 8 -52 16 -48 22 L-44 4Z M52 -6 C54 6 52 14 48 20 L44 2Z',
    };
    case 'long': return {
      back: 'M-56 -12 C-60 -58 -26 -74 0 -73 C28 -74 61 -56 57 -10 C60 40 64 110 70 170 L-70 170 C-64 110 -60 40 -56 -12Z',
      front: `M-53 -2 C-58 -46 -30 -68 ${sx(2)} -68 C30 -68 58 -48 53 -2 C50 -14 46 -24 38 -30 C36 -20 30 -14 24 -12 C26 -24 22 -32 18 -38 C12 -24 4 -18 ${sx(-6)} -16 C${sx(-4)} -26 ${sx(-8)} -34 ${sx(-12)} -40 C-20 -26 -30 -18 -42 -12 C-40 -22 -42 -30 -44 -34 C-50 -26 -52 -14 -53 -2Z`,
      side: 'M-53 -2 C-58 30 -56 70 -50 100 C-46 70 -44 30 -42 4Z M53 -2 C58 30 56 70 50 100 C46 70 44 30 42 4Z',
    };
    case 'silver': return {
      back: 'M-55 -14 C-59 -60 -25 -75 0 -74 C28 -75 60 -58 56 -12 C58 50 60 130 64 200 L-64 200 C-60 130 -58 50 -55 -14Z',
      front: `M-52 0 C-57 -46 -30 -70 0 -70 C30 -70 57 -46 52 0 C50 -14 46 -24 40 -30 C38 -20 34 -14 28 -12 C30 -24 26 -34 20 -40 C${sx(10)} -28 ${sx(-4)} -22 ${sx(-20)} -20 C-30 -22 -40 -16 -48 -6 C-50 -4 -51 -2 -52 0Z`,
      side: 'M-52 0 C-56 40 -54 90 -48 130 C-44 90 -44 40 -44 4Z M52 0 C56 40 54 90 48 130 C44 90 44 40 44 4Z',
    };
    case 'ponytail': return {
      back: 'M-54 -12 C-58 -58 -26 -73 0 -72 C28 -73 59 -56 55 -10 C55 6 52 18 46 26 L-46 26 C-52 16 -54 4 -54 -12Z',
      tail: 'M40 -52 C66 -60 86 -40 80 -6 C76 24 82 52 92 78 C70 70 60 40 58 12 C56 -12 52 -30 40 -40Z',
      front: `M-52 -4 C-57 -46 -30 -68 ${sx(2)} -68 C30 -68 57 -48 52 -4 C48 -18 42 -28 34 -32 C34 -22 28 -16 22 -14 C24 -24 22 -32 18 -38 C10 -26 2 -20 ${sx(-8)} -18 C${sx(-6)} -28 ${sx(-8)} -34 ${sx(-12)} -40 C-22 -28 -32 -20 -44 -16 C-48 -12 -50 -8 -52 -4Z`,
      side: 'M-52 -4 C-55 10 -54 22 -48 32 C-46 18 -46 8 -44 0Z M52 -4 C55 10 54 22 48 32 C46 18 46 8 44 0Z',
      tie: '#e6b44c',
    };
    case 'pigtails': return {
      back: 'M-54 -12 C-58 -58 -26 -73 0 -72 C28 -73 59 -56 55 -10 C55 6 52 18 46 26 L-46 26 C-52 16 -54 4 -54 -12Z',
      tail: 'M-50 -20 C-74 -24 -84 0 -80 26 C-76 44 -70 54 -64 60 C-66 40 -62 20 -54 0Z M50 -20 C74 -24 84 0 80 26 C76 44 70 54 64 60 C66 40 62 20 54 0Z',
      front: `M-52 -4 C-57 -46 -30 -68 ${sx(2)} -68 C30 -68 57 -48 52 -4 C46 -14 38 -22 28 -24 C${sx(14)} -20 ${sx(0)} -20 ${sx(-12)} -24 C-30 -22 -44 -14 -52 -4Z`,
      side: '',
      tie: '#e6b44c',
    };
    case 'braid': return {
      back: 'M-54 -12 C-58 -58 -26 -73 0 -72 C28 -73 59 -56 55 -10 C55 6 52 18 46 26 L-46 26 C-52 16 -54 4 -54 -12Z',
      tail: 'M30 30 C40 50 36 70 42 90 C46 110 40 130 46 150 L32 152 C28 132 32 112 28 92 C24 72 26 50 18 32Z',
      front: `M-52 -4 C-57 -46 -30 -68 ${sx(2)} -68 C30 -68 57 -48 52 -4 C46 -20 36 -34 ${sx(8)} -40 C${sx(-6)} -34 -30 -26 -44 -14 C-48 -10 -50 -8 -52 -4Z`,
      side: 'M-52 -4 C-55 10 -54 22 -48 32 C-46 18 -46 8 -44 0Z',
      tie: '#c9a457',
    };
    case 'bun': return {
      back: 'M-54 -12 C-58 -58 -26 -73 0 -72 C28 -73 59 -56 55 -10 C55 4 52 14 48 20 L-48 20 C-52 14 -54 4 -54 -12Z',
      bun: 'M-22 -70 C-24 -96 22 -98 22 -72 C16 -64 -16 -64 -22 -70Z',
      front: `M-52 -4 C-57 -46 -30 -68 ${sx(2)} -68 C30 -68 57 -48 52 -4 C48 -18 42 -28 34 -32 C${sx(18)} -26 ${sx(2)} -22 ${sx(-12)} -26 C-26 -28 -40 -20 -52 -4Z`,
      side: 'M-52 -4 C-55 10 -54 22 -48 30 C-46 18 -46 8 -44 0Z M52 -4 C55 10 54 22 48 30 C46 18 46 8 44 0Z',
    };
    case 'granny': return {
      back: 'M-52 -10 C-56 -56 -26 -70 0 -70 C26 -70 56 -56 52 -10 C52 0 50 8 46 12 L-46 12 C-50 8 -52 0 -52 -10Z',
      bun: 'M-26 -64 C-30 -96 30 -96 26 -64 C18 -58 -18 -58 -26 -64Z',
      front: `M-51 -6 C-55 -46 -28 -66 0 -66 C28 -66 55 -46 51 -6 C46 -26 30 -44 ${sx(2)} -46 C-26 -44 -46 -26 -51 -6Z`,
      side: 'M-51 -6 C-53 4 -52 12 -48 18 L-44 0Z M51 -6 C53 4 52 12 48 18 L44 0Z',
    };
    case 'perm': return {
      back: 'M-60 -10 C-66 -62 -28 -78 0 -77 C30 -78 66 -62 60 -10 C62 8 60 24 52 34 C46 40 38 36 34 30 L-34 30 C-38 36 -46 40 -52 34 C-60 24 -62 8 -60 -10Z',
      front: `M-55 -2 C-62 -50 -30 -72 ${sx(2)} -72 C34 -72 62 -50 55 -2 C52 -16 48 -22 40 -24 C36 -30 28 -32 22 -28 C16 -34 6 -34 ${sx(0)} -28 C-6 -34 -16 -34 -22 -28 C-28 -32 -38 -30 -42 -24 C-48 -22 -52 -16 -55 -2Z`,
      side: 'M-55 -2 C-60 12 -58 22 -52 30 C-50 18 -48 8 -46 2Z M55 -2 C60 12 58 22 52 30 C50 18 48 8 46 2Z',
    };
    default: // short (men)
      return {
        back: 'M-53 -6 C-57 -54 -26 -70 0 -70 C28 -70 57 -54 53 -6 C53 2 52 8 49 12 L-49 12 C-52 8 -53 2 -53 -6Z',
        front: `M-52 -4 C-56 -46 -28 -68 ${sx(2)} -68 C32 -68 57 -48 52 -6 C48 -18 42 -26 32 -30 L${sx(26)} -22 C${sx(20)} -30 ${sx(10)} -34 ${sx(0)} -34 L${sx(-4)} -26 C${sx(-12)} -32 -24 -32 -32 -28 C-40 -22 -48 -14 -52 -4Z`,
        side: 'M-52 -4 C-53 6 -52 12 -49 16 L-46 2Z M52 -6 C53 6 52 12 49 16 L46 2Z',
      };
  }
}

function hairLayer(d, col, hairId, { hi = true, line = true } = {}) {
  if (!d) return '';
  return `<path d="${d}" fill="${col}"${line ? ` stroke="${INK}" stroke-width="2.1" stroke-linejoin="round"` : ''}/>` +
    (hi ? `<path d="${d}" fill="url(#${hairId})" opacity=".9"/>` : '');
}

// ---------------------------------------------------------------- head
function faceShape(c, t) {
  const j = t * 7; // jaw shifts toward the turn
  const long = c.face === 'long' ? 6 : c.face === 'round' ? -4 : 0;
  const wide = c.face === 'round' ? 3 : c.kid ? 2 : 0;
  return `M${-47 - wide} -12 C${-48 - wide} ${16 + long / 2} ${-40 + j} ${38 + long} ${-20 + j} ${56 + long} Q${j} ${68 + long} ${20 + j} ${56 + long} C${40 + j} ${38 + long} ${48 + wide} ${16 + long / 2} ${47 + wide} -12 C${46} -48 ${24} -62 0 -62 C-24 -62 -46 -48 ${-47 - wide} -12Z`;
}

export function head(c, { mood = 'neutral', turn = 0, light, cutBack = false } = {}) {
  const m = MOODS[mood] || MOODS.neutral;
  const t = Math.max(-1, Math.min(1, turn));
  const skin = c.skin, sh = shade(skin, 0.13, 330), sh2 = shade(skin, 0.24, 320);
  const H = hairShapes(c.hair, t);
  const hc = c.hairColor, hairId = nid('hg');
  const faceD = faceShape(c, t);
  const fx = t * 14, eyeY = 10 + (c.face === 'long' ? 2 : 0), sp = 23;
  const kid = c.kid ? 3 : 0;
  const parts = [];
  parts.push(`<defs><linearGradient id="${hairId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${tint(hc, 0.08)}" stop-opacity=".35"/>
      <stop offset=".35" stop-color="${hc}" stop-opacity="0"/>
      <stop offset=".7" stop-color="${shade(hc, 0.12)}" stop-opacity=".0"/>
      <stop offset="1" stop-color="${shade(hc, 0.2)}" stop-opacity=".55"/></linearGradient></defs>`);
  // back hair, tails, buns
  if (cutBack) { const cb = nid('cb'); parts.push(`<defs><clipPath id="${cb}"><rect x="-120" y="-200" width="240" height="252"/></clipPath></defs><g clip-path="url(#${cb})">${hairLayer(H.back, shade(hc, 0.06), hairId, { hi: false })}</g>`); }
  else parts.push(hairLayer(H.back, shade(hc, 0.06), hairId, { hi: false }));
  if (H.tail) parts.push(hairLayer(H.tail, hc, hairId));
  if (H.bun) parts.push(hairLayer(H.bun, hc, hairId));
  // ears
  const ear = (s) => `<path d="M${s * 45} 0 C${s * 56} -6 ${s * 58} 10 ${s * 52} 20 C${s * 50} 24 ${s * 46} 22 ${s * 44} 18Z" fill="${skin}" stroke="${INK}" stroke-width="1.8"/><path d="M${s * 47} 6 Q${s * 52} 8 ${s * 49} 16" stroke="${sh2}" stroke-width="1.5" fill="none"/>`;
  if (!/long|silver|bob|perm/.test(c.hair) || c.gender === 'm') parts.push(ear(t > 0.3 ? -1 : 1), t > 0.3 ? '' : ear(-1));
  if (c.earrings) parts.push(`<path d="M-50 22 v10 M50 22 v10" stroke="${c.accent}" stroke-width="1.6"/><path d="M-53 34 a3.5 3.5 0 1 0 6 0 a2.6 2.6 0 1 1 -6 0Z M47 34 a3.5 3.5 0 1 0 6 0 a2.6 2.6 0 1 1 -6 0Z" fill="${c.accent}"/>`);
  // face
  parts.push(`<path d="${faceD}" fill="${skin}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>`);
  // cel shadow on the far side + under the bangs
  const shSide = t >= 0 ? -1 : 1;
  parts.push(`<path d="M${shSide * 47} -12 C${shSide * 48} 16 ${shSide * 40} 38 ${shSide * 18} 58 C${shSide * 38} 36 ${shSide * 43} 12 ${shSide * 42} -14Z" fill="${sh}" opacity=".7"/>`);
  const fc = nid('fc');
  parts.push(`<defs><clipPath id="${fc}"><path d="${faceD}"/></clipPath></defs><g clip-path="url(#${fc})"><path d="${H.front}" fill="${sh}" opacity=".7" transform="translate(${t >= 0 ? -3 : 3} 7)"/>${H.side ? `<path d="${H.side}" fill="${sh}" opacity=".6" transform="translate(${t >= 0 ? 4 : -4} 3)"/>` : ''}</g>`);
  // cheeks
  const blush = m.blush ?? 0.15;
  if (blush > 0) parts.push(`<ellipse cx="${-26 + fx}" cy="${eyeY + 20}" rx="10" ry="5" fill="#f08f8f" opacity="${0.18 + blush * 0.4}"/><ellipse cx="${26 + fx}" cy="${eyeY + 20}" rx="10" ry="5" fill="#f08f8f" opacity="${0.18 + blush * 0.4}"/>`);
  if (blush >= 0.9) parts.push(`<path d="M${-32 + fx} ${eyeY + 17} l4 -4 m2 4 l4 -4 m2 4 l4 -4 M${18 + fx} ${eyeY + 17} l4 -4 m2 4 l4 -4 m2 4 l4 -4" stroke="#d76d74" stroke-width="1.4" stroke-linecap="round"/>`);
  if (c.freckles) parts.push([[-30, 22], [-24, 25], [-34, 26], [30, 22], [24, 25], [34, 26]].map(([x, y]) => `<circle cx="${x + fx}" cy="${eyeY + y - 6}" r=".9" fill="${shade(skin, 0.3)}"/>`).join(''));
  // age lines
  if (c.age >= 2) parts.push(`<path d="M${-34 + fx} ${eyeY + 6} q-4 4 -2 9 M${34 + fx} ${eyeY + 6} q4 4 2 9 M${-12 + fx} ${eyeY + 34} q-5 2 -7 7 M${12 + fx} ${eyeY + 34} q5 2 7 7" stroke="${sh2}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`);
  else if (c.age === 1) parts.push(`<path d="M${-14 + fx} ${eyeY + 34} q-4 2 -6 6 M${14 + fx} ${eyeY + 34} q4 2 6 6" stroke="${sh2}" stroke-width="1.1" fill="none" opacity=".7" stroke-linecap="round"/>`);
  // eyes + brows
  parts.push(eye(-1, -sp + fx, eyeY + kid, sp, m, c, null, t), eye(1, sp + fx, eyeY + kid, sp, m, c, null, t));
  parts.push(brow(-1, -sp + fx, eyeY, m, c, t), brow(1, sp + fx, eyeY, m, c, t));
  // nose + mouth
  parts.push(`<path d="M${2 + fx * 1.15} ${eyeY + 18} q${2 + t * 2} 4 ${-1} 6" stroke="${sh2}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
  if (c.mustache) parts.push(`<path d="M${-14 + fx} ${eyeY + 33} Q${fx} ${eyeY + 26} ${14 + fx} ${eyeY + 33} Q${fx} ${eyeY + 30} ${-14 + fx} ${eyeY + 33}Z" fill="${shade(c.hairColor, 0.05)}" stroke="${INK}" stroke-width="1.3"/>`);
  if (c.beard) parts.push(`<path d="M${-36 + fx} ${eyeY + 22} C${-34 + fx} ${eyeY + 50} ${-16 + fx} ${eyeY + 62} ${fx} ${eyeY + 63} C${16 + fx} ${eyeY + 62} ${34 + fx} ${eyeY + 50} ${36 + fx} ${eyeY + 22} C${26 + fx} ${eyeY + 40} ${-26 + fx} ${eyeY + 40} ${-36 + fx} ${eyeY + 22}Z" fill="${c.hairColor}" stroke="${INK}" stroke-width="1.6"/>`);
  parts.push(mouth(fx * 1.05, eyeY + 33, m, c));
  // marks: tears, sweat, shock lines
  if (m.tears) parts.push(`<path d="M${-sp + fx + 4} ${eyeY + 7} q-3 10 0 16 q3 -6 0 -16Z M${sp + fx - 4} ${eyeY + 7} q-3 10 0 16 q3 -6 0 -16Z" fill="#bfe3f6" stroke="#7fb4d6" stroke-width="1"/>`);
  // front hair
  parts.push(hairLayer(H.side, hc, hairId));
  parts.push(hairLayer(H.front, hc, hairId));
  if (H.tie) parts.push(c.hair === 'pigtails'
    ? `<circle cx="-54" cy="-16" r="5" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.4"/><circle cx="54" cy="-16" r="5" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.4"/>`
    : c.hair === 'braid' ? `<path d="M26 148 l-8 10 l14 -2 l12 6 l-4 -12Z" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.3"/>`
      : `<path d="M42 -50 l-10 -8 l2 14 Z M42 -50 l12 -10 l-2 14 Z" fill="${c.ribbon || H.tie}" stroke="${INK}" stroke-width="1.3"/>`);
  // shine strokes on the bangs
  const shine = tint(hc, /^#[c-f]/i.test(hc) ? 0.12 : 0.28);
  parts.push(`<path d="M${-40 + t * 6} -40 C${-30 + t * 6} -54 ${-14 + t * 6} -58 ${-4 + t * 6} -59" stroke="${shine}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${8 + t * 6} -60 C${20 + t * 6} -59 ${32 + t * 6} -54 ${40 + t * 6} -44" stroke="${shine}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/><path d="M${-36 + t * 6} -42 l5 -6 M${30 + t * 6} -52 l5 5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`);
  if (c.glasses) {
    const r = c.glasses === 'round' ? 15 : 13;
    parts.push(`<g fill="${c.glasses === 'round' ? 'rgba(255,255,255,.12)' : 'none'}" stroke="${c.glasses === 'round' ? '#8a6b4a' : '#55505e'}" stroke-width="2"><circle cx="${-sp + fx}" cy="${eyeY + 1}" r="${r}"/><circle cx="${sp + fx}" cy="${eyeY + 1}" r="${r}"/><path d="M${-sp + fx + r} ${eyeY} q${sp - r} -5 ${2 * (sp - r)} 0" fill="none"/></g>`);
  }
  if (m.sweat) parts.push(`<path d="M${44} -26 q6 9 0 14 q-6 -5 0 -14Z" fill="#cde9f7" stroke="#6aa6cc" stroke-width="1.2"/>`);
  if (m.lines) parts.push(`<path d="M-64 -40 l-10 -8 M-68 -24 l-12 -2 M64 -40 l10 -8 M68 -24 l12 -2" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`);
  if (c.cap) parts.push(`<path d="M-50 -30 C-52 -66 52 -66 50 -30 Z" fill="${c.cap}" stroke="${INK}" stroke-width="2"/><path d="M-50 -32 Q${10 + t * 20} -40 ${62 + t * 10} -24 L${54 + t * 10} -18 Q0 -26 -50 -26Z" fill="${shade(c.cap, 0.08)}" stroke="${INK}" stroke-width="2"/><path d="M-30 -58 Q0 -66 30 -58" stroke="${tint(c.cap, 0.15)}" stroke-width="3" fill="none"/>`);
  return parts.join('');
}

// ---------------------------------------------------------------- outfits (bust)
function torso(c, { t = 0 } = {}) {
  const col = c.cloth, sh = shade(col, 0.14), acc = c.accent;
  const neck = `<path d="M-15 50 L-16 84 L16 84 L15 50Z" fill="${c.skin}" stroke="${INK}" stroke-width="2"/><path d="M-15 54 Q0 70 15 54 L15 66 Q0 76 -15 66Z" fill="${shade(c.skin, 0.2, 320)}" opacity=".8"/>`;
  const shoulders = c.kid
    ? 'M-60 140 C-60 104 -40 84 -16 80 L16 80 C40 84 60 104 60 140Z'
    : c.gender === 'm' ? 'M-92 160 C-90 112 -60 88 -18 80 L18 80 C60 88 90 112 92 160Z' : 'M-80 160 C-80 112 -52 88 -16 80 L16 80 C52 88 80 112 80 160Z';
  const body = `<path d="${shoulders}" fill="${col}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>` +
    `<path d="${shoulders}" fill="none"/><path d="M${t >= 0 ? -80 : 80} 160 C${t >= 0 ? -78 : 78} 120 ${t >= 0 ? -60 : 60} 98 ${t >= 0 ? -36 : 36} 88 C${t >= 0 ? -52 : 52} 110 ${t >= 0 ? -58 : 58} 134 ${t >= 0 ? -56 : 56} 160Z" fill="${sh}" opacity=".85"/>`;
  let detail = '';
  switch (c.outfit) {
    case 'witch': detail = `<path d="M-20 80 Q-30 96 -36 100 Q-14 106 0 92 Q14 106 36 100 Q30 96 20 80 Q0 90 -20 80Z" fill="${acc}" stroke="${INK}" stroke-width="1.8"/><path d="M0 92 l-6 10 h12Z" fill="${c.ribbon}" stroke="${INK}" stroke-width="1.4"/><path d="M-6 96 q-14 -8 -14 4 q0 8 14 0 M6 96 q14 -8 14 4 q0 8 -14 0" fill="${c.ribbon}" stroke="${INK}" stroke-width="1.4"/>`; break;
    case 'apron': detail = `<path d="M-34 108 Q0 100 34 108 L36 160 L-36 160Z" fill="${acc}" stroke="${INK}" stroke-width="1.8"/><path d="M-34 108 L-24 84 M34 108 L24 84" stroke="${acc}" stroke-width="6"/><path d="M-34 108 L-24 84 M34 108 L24 84" stroke="${INK}" stroke-width="1" fill="none" opacity=".5"/><path d="M-16 80 Q0 92 16 80" stroke="${INK}" stroke-width="1.6" fill="${shade(col, 0.05)}"/>`; break;
    case 'cardigan': detail = `<path d="M-16 80 L0 120 L16 80" fill="${acc}" stroke="${INK}" stroke-width="1.6"/><path d="M0 120 L0 160" stroke="${INK}" stroke-width="1.6"/><circle cx="-6" cy="132" r="2.2" fill="${shade(col, 0.3)}"/><circle cx="-6" cy="148" r="2.2" fill="${shade(col, 0.3)}"/>`; break;
    case 'robe': detail = `<path d="M-18 80 Q0 88 18 80 L10 160 L-10 160Z" fill="${shade(col, 0.12)}" stroke="${INK}" stroke-width="1.6"/><path d="M-26 82 L-8 160 M26 82 L8 160" stroke="${acc}" stroke-width="2.4"/><path d="M0 104 a5 5 0 1 0 0 9 a3.8 3.8 0 1 1 0 -9Z" fill="${acc}"/>`; break;
    case 'uniform': detail = `<path d="M-16 80 L0 104 L16 80" fill="${acc}" stroke="${INK}" stroke-width="1.6"/><path d="M-4 100 L0 140 L4 100Z" fill="#7a3b3f" stroke="${INK}" stroke-width="1.2"/><rect x="26" y="112" width="18" height="6" rx="1" fill="${c.accent}" stroke="${INK}" stroke-width="1"/>`; break;
    case 'whitecoat': detail = `<path d="M-16 80 L-2 120 L-30 160 M16 80 L2 120 L30 160" stroke="${INK}" stroke-width="1.6" fill="none"/><path d="M-16 80 L0 108 L16 80Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.4"/><rect x="-46" y="122" width="16" height="4" fill="#5d7f96"/>`; break;
    case 'coat': detail = `<path d="M-18 80 L-6 112 L-24 120 L-34 90Z M18 80 L6 112 L24 120 L34 90Z" fill="${shade(col, 0.06)}" stroke="${INK}" stroke-width="1.6"/><path d="M-6 112 L-2 160 M6 112 L2 160" stroke="${INK}" stroke-width="1.2"/><circle cx="-10" cy="132" r="2.6" fill="${acc}"/><circle cx="-10" cy="150" r="2.6" fill="${acc}"/>`; break;
    default: detail = `<path d="M-16 80 L-6 98 L0 86 L6 98 L16 80" fill="${acc}" stroke="${INK}" stroke-width="1.6"/>`;
  }
  return neck + body + detail;
}

// hands for gestures in bust shots: 'wave' 'chin' 'chest' 'cup' 'letter' 'cheek' 'point' 'bread'
function hand(c, kind) {
  const sk = c.skin, sl = c.cloth;
  const mitt = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-11 6 C-13 -6 -10 -14 -2 -15 C6 -16 12 -10 12 -2 C12 8 6 13 -2 13 C-8 13 -11 10 -11 6Z" fill="${sk}" stroke="${INK}" stroke-width="2"/><path d="M-4 -14 L-4 -4 M2 -15 L2 -5 M7 -12 L7 -4" stroke="${shade(sk, 0.2)}" stroke-width="1.4"/></g>`;
  const sleeve = (d) => `<path d="${d}" fill="${sl}" stroke="${INK}" stroke-width="2.1" stroke-linejoin="round"/>`;
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
function rim(light, d) {
  if (!light?.rim) return '';
  return `<path d="${d}" fill="none" stroke="${light.rim}" stroke-width="3" opacity=".55" transform="translate(${(light.side || 1) * 2.4} -1.5)"/>`;
}

export function bust(c, { mood = 'neutral', turn = 0, hand: hk, light, hat = false } = {}) {
  const t = turn;
  const H = hairShapes(c.hair, t);
  const longBack = /long|silver/.test(c.hair) ? `<path d="${H.back}" fill="${shade(c.hairColor, 0.1)}" stroke="${INK}" stroke-width="2"/>` : '';
  return `<g class="bust">${longBack}${torso(c, { t })}${rim(light, 'M-80 160 C-80 112 -52 88 -16 80 L16 80 C52 88 80 112 80 160')}${hk === 'cup' || hk === 'letter' || hk === 'bread' || hk === 'chest' ? '' : ''}
    <g class="head">${head(c, { mood, turn: t, light, cutBack: !!longBack })}${hat ? witchHat(c, t) : ''}</g>${hand(c, hk)}</g>`;
}

export function witchHat(c, t = 0) {
  const col = '#2a2542', hi = '#3c3560';
  return `<g transform="translate(${t * 6} 0)"><ellipse cx="0" cy="-52" rx="86" ry="17" fill="${col}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M-44 -56 C-38 -100 -10 -150 34 -176 C26 -150 30 -110 44 -56 Z" fill="${hi}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-44 -58 Q0 -46 44 -58 L42 -70 Q0 -60 -42 -72Z" fill="${c.ribbon || '#b8524c'}" stroke="${INK}" stroke-width="1.6"/>
    <path d="M-30 -90 C-20 -120 0 -146 26 -164" stroke="#57507e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
}

// ---------------------------------------------------------------- full figure
// Poses: stand, walk, wave, hold, sit, bow, run, point, think. Feet at y=0. Head scale 0.62 of bust units.
const LEG = 210, TORSO = 200;
export function figure(c, { mood = 'neutral', pose = 'stand', turn = 0, prop, light, hat = false, flip = false } = {}) {
  const sk = c.skin, col = c.cloth, sh = shade(col, 0.14);
  const kid = c.kid ? 0.82 : 1;
  const hs = 0.95;
  const neckY = -LEG - TORSO - 80 * hs;
  const parts = [];
  const legCol = c.outfit === 'witch' ? '#2a2638' : c.gender === 'm' ? shade(col, 0.35) : '#3d394c';
  const shoe = '#3a2e2e';
  const leg = (x, y1, x2, y2) => `<path d="M${x - 13} ${y1} L${x2 - 9} ${y2} L${x2 + 9} ${y2} L${x + 13} ${y1}Z" fill="${c.outfit === 'witch' || c.gender === 'f' ? sk : legCol}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M${x2 - 10} ${y2 - 2} q0 -12 12 -12 q12 0 14 12Z" fill="${shoe}" stroke="${INK}" stroke-width="2"/>`;
  // legs
  if (pose === 'sit') {
    parts.push(`<path d="M-30 -150 L-34 -150 L-40 -60 L-20 -60 L-14 -150Z M14 -150 L20 -60 L40 -60 L34 -150Z" fill="${c.gender === 'f' ? sk : legCol}" stroke="${INK}" stroke-width="2"/>`);
    parts.push(`<path d="M-42 -62 q0 -12 14 -12 q14 0 16 12Z M18 -62 q0 -12 14 -12 q14 0 16 12Z" fill="${shoe}" stroke="${INK}" stroke-width="2"/>`);
  } else if (pose === 'walk' || pose === 'run') {
    const k = pose === 'run' ? 1.6 : 1;
    parts.push(leg(-14, -LEG + 40, -14 - 34 * k, -2), leg(14, -LEG + 40, 14 + 30 * k, -8 * k));
  } else {
    parts.push(leg(-15, -LEG + 40, -17, 0), leg(15, -LEG + 40, 17, 0));
  }
  // body / dress
  const top = -LEG - TORSO;
  const skirtW = c.outfit === 'witch' ? 84 : c.gender === 'f' ? 74 : 54;
  const hem = c.gender === 'f' || c.outfit === 'robe' || c.outfit === 'witch' ? (c.outfit === 'robe' ? -30 : -LEG + 95) : -LEG + 30;
  const bodyD = pose === 'sit'
    ? `M-46 ${top} C-60 ${top + 60} -66 -190 -70 -150 L70 -150 C66 -190 60 ${top + 60} 46 ${top}Z`
    : `M-46 ${top} C-56 ${top + 70} ${-skirtW} ${hem - 30} ${-skirtW - 6} ${hem} Q0 ${hem + 14} ${skirtW + 6} ${hem} C${skirtW} ${hem - 30} 56 ${top + 70} 44 ${top}Z`;
  parts.push(`<path d="${bodyD}" fill="${col}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`);
  parts.push(`<path d="M-44 ${top} C-56 ${top + 70} ${-skirtW} ${hem - 30} ${-skirtW - 6} ${hem} Q${-skirtW + 20} ${hem + 8} ${-skirtW + 30} ${hem + 10} C-40 ${hem - 40} -30 ${top + 60} -22 ${top + 4}Z" fill="${sh}" opacity=".85"/>`);
  if (c.gender === 'm' && c.outfit !== 'robe') parts.push(`<path d="M-44 ${-LEG + 34} L-40 ${-LEG + 44} L40 ${-LEG + 44} L44 ${-LEG + 34}Z" fill="${legCol}" stroke="${INK}" stroke-width="2"/>`);
  // outfit details
  if (c.outfit === 'apron') parts.push(`<path d="M-30 ${top + 50} Q0 ${top + 42} 30 ${top + 50} L40 ${hem - 6} Q0 ${hem + 2} -40 ${hem - 6}Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.8"/>`);
  if (c.outfit === 'witch') parts.push(`<path d="M-22 ${top} Q-32 ${top + 18} -40 ${top + 22} Q-14 ${top + 30} 0 ${top + 14} Q14 ${top + 30} 40 ${top + 22} Q32 ${top + 18} 22 ${top}Z" fill="${c.accent}" stroke="${INK}" stroke-width="1.8"/><path d="M0 ${top + 14} l-7 12 h14Z" fill="${c.ribbon}" stroke="${INK}" stroke-width="1.4"/>`);
  if (c.outfit === 'cardigan' || c.outfit === 'coat' || c.outfit === 'whitecoat') parts.push(`<path d="M0 ${top + 10} L0 ${hem}" stroke="${INK}" stroke-width="1.6"/>`);
  if (c.outfit === 'robe') parts.push(`<path d="M-24 ${top + 4} L-10 ${hem} M24 ${top + 4} L10 ${hem}" stroke="${c.accent}" stroke-width="3"/>`);
  // arms
  const arm = (side, ang, len = 170, bend = 0) => {
    const sx = side * 46, sy = top + 22;
    const a = (ang * Math.PI) / 180, ex = sx + Math.sin(a) * len * 0.5 * side, ey = sy + Math.cos(a) * len * 0.5;
    const b = ((ang + bend) * Math.PI) / 180, hx = ex + Math.sin(b) * len * 0.5 * side, hy = ey + Math.cos(b) * len * 0.5;
    return `<path d="M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}" stroke="${INK}" stroke-width="36" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M${sx} ${sy} L${ex} ${ey} L${hx} ${hy}" stroke="${col}" stroke-width="31.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="${hx}" cy="${hy}" r="16" fill="${sk}" stroke="${INK}" stroke-width="2"/>`;
  };
  const ARMS = {
    stand: [arm(-1, 8), arm(1, 8)], walk: [arm(-1, 22), arm(1, -14)], run: [arm(-1, 40, 140, -70), arm(1, -30, 140, -60)],
    wave: [arm(-1, 8), arm(1, 150, 150, 10)], hold: [arm(-1, 20, 140, -80), arm(1, 20, 140, -80)], sit: [arm(-1, 14, 140, -40), arm(1, 14, 140, -40)],
    bow: [arm(-1, 4), arm(1, 4)], point: [arm(-1, 8), arm(1, 100, 160, 0)], think: [arm(-1, 20, 140, -100), arm(1, 8)],
  };
  parts.push(...(ARMS[pose] || ARMS.stand));
  // props held in front
  if (prop === 'basket' || (pose === 'hold' && !prop)) parts.push(`<g transform="translate(0 ${top + 112})"><path d="M-46 -6 L46 -6 L38 38 L-38 38Z" fill="#b98a55" stroke="${INK}" stroke-width="2"/><path d="M-40 6 H40 M-38 20 H38" stroke="#8a6238" stroke-width="2"/><path d="M-34 -6 Q0 -60 34 -6" stroke="#8a6238" stroke-width="5" fill="none"/><ellipse cx="-14" cy="-10" rx="20" ry="11" fill="#d79a52" stroke="${INK}" stroke-width="1.8"/><ellipse cx="16" cy="-12" rx="16" ry="10" fill="#e2b06a" stroke="${INK}" stroke-width="1.8"/></g>`);
  if (prop === 'box') parts.push(`<g transform="translate(0 ${top + 104})"><rect x="-44" y="-30" width="88" height="66" rx="3" fill="#d9b98a" stroke="${INK}" stroke-width="2"/><path d="M-44 -6 H44 M0 -30 V36" stroke="#b8524c" stroke-width="5"/></g>`);
  if (prop === 'umbrella') parts.push(`<g transform="translate(64 ${top - 10})"><path d="M0 -150 V40" stroke="${INK}" stroke-width="4"/><path d="M-110 -140 Q0 -230 110 -140 Q82 -154 55 -140 Q28 -154 0 -140 Q-28 -154 -55 -140 Q-82 -154 -110 -140Z" fill="#6f8fa8" stroke="${INK}" stroke-width="2.4"/></g>`);
  if (prop === 'letter') parts.push(`<g transform="translate(46 ${top + 92}) rotate(-10)"><rect x="-20" y="-14" width="40" height="28" rx="2" fill="#f6efdf" stroke="${INK}" stroke-width="2"/><path d="M-20 -14 L0 2 L20 -14" stroke="${INK}" stroke-width="1.6" fill="none"/></g>`);
  // head
  parts.push(`<g transform="translate(${turn * 4} ${neckY}) scale(${hs})">${torsoNeck(c)}${head(c, { mood, turn, light })}${hat ? witchHat(c, turn) : ''}</g>`);
  const sc = kid;
  return `<g class="figure" transform="${flip ? 'scale(-1 1) ' : ''}scale(${sc})"><ellipse cx="0" cy="0" rx="70" ry="9" fill="#000" opacity=".16"/>${parts.join('')}</g>`;
}
function torsoNeck(c) { return `<path d="M-15 50 L-16 84 L16 84 L15 50Z" fill="${c.skin}" stroke="${INK}" stroke-width="2"/>`; }

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
