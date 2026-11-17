// Doodle diary (그림일기) finish — the one house art style for Dalbit's pictures.
//
// How the look is made: every picture is still drawn by the engines in art/ (clean shapes with dark ink lines), then
// ONE SVG filter turns that drawing into a page from a picture diary:
//   1. wobble  — the whole drawing is displaced by low-frequency noise, so lines wander a little like a hand-held pen;
//   2. split   — dark pixels (the ink lines, black fur, hair) are separated from the colour areas;
//   3. crayon  — the colour areas are shifted ~1px off the lines (so the crayon "doesn't quite meet the line") and
//                eaten by fine grain, so the paper shows through like waxy crayon;
//   4. lines on top, unshifted.
// On the night screens the pen turns into chalk: stronger wobble, grain eats the lines too, paper becomes slate blue.
//
// Usage: doodle(svgInnerMarkup, { w, h, night, seed }) -> a <g> + <defs> string to drop inside any <svg>.
// Colours are never read from the page, so the filter is safe in light and dark themes alike.

let n = 0;
const uid = () => `dd${(++n).toString(36)}`;

export const PAPER = { day: '#fbf6ea', night: '#262a58' };

// look: 'pen' (daylight) | 'chalk' (night). o: wobble amplitude, freq: wobble frequency, grain: crayon grain frequency
const LOOKS = {
  pen: { wob: 3.2, freq: 0.03, grain: 0.42, hole: 2.4, holeOff: 2.25, lineHole: 0, shift: [1.4, 1.1] },
  chalk: { wob: 3.2, freq: 0.04, grain: 0.6, hole: 2.2, holeOff: 2.1, lineHole: 1.2, shift: [1.8, 1.4] },
};

export function doodleFilter(id, { night = false, seed = 5, scale = 1 } = {}) {
  const L = LOOKS[night ? 'chalk' : 'pen'];
  const wob = (L.wob * scale).toFixed(2), freq = (L.freq / scale).toFixed(4);
  const sx = (L.shift[0] * scale).toFixed(2), sy = (L.shift[1] * scale).toFixed(2);
  // lines: alpha rises as luminance falls (ink ≈ .17 → opaque, mid-tones → transparent); colour passes through.
  const lineMask = night
    ? `<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -${L.lineHole} ${(L.lineHole + 0.3).toFixed(2)}" result="lgm"/><feComposite in="lines0" in2="lgm" operator="in" result="lines"/>`
    : `<feComposite in="lines0" in2="lines0" operator="over" result="lines"/>`;
  return `<filter id="${id}" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="${wob}" xChannelSelector="R" yChannelSelector="G" result="wob"/>
    <feColorMatrix in="wob" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1.3 -2.6 -.43 0 1.73" result="la"/>
    <feComposite in="la" in2="wob" operator="in" result="lines0"/>
    <feTurbulence type="fractalNoise" baseFrequency="${L.grain}" numOctaves="2" seed="${seed + 3}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -${L.hole} ${L.holeOff}" result="gm"/>
    ${lineMask}
    <feComposite in="wob" in2="lines0" operator="out" result="fills0"/>
    <feOffset in="fills0" dx="${sx}" dy="${sy}" result="fills1"/>
    <feComposite in="fills1" in2="gm" operator="in" result="fills"/>
    <feMerge><feMergeNode in="fills"/><feMergeNode in="lines"/></feMerge>
  </filter>`;
}

// Wrap drawing markup in the doodle filter, over a paper rectangle (the crayon grain shows paper through).
export function doodle(inner, { w, h, night = false, seed, scale = 1, paper = true } = {}) {
  const id = uid();
  const s = seed ?? 3 + (n % 37);
  const bg = paper ? `<rect width="${w}" height="${h}" fill="${night ? PAPER.night : PAPER.day}"/>` : '';
  return `<defs>${doodleFilter(id, { night, seed: s, scale })}</defs>${bg}<g filter="url(#${id})">${inner}</g>`;
}
