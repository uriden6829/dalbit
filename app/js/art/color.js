// Ported from the pixel-art app (task 26 src/color.js). Used by the webtoon art engine for hue-shifted shading ramps.
// Additions for Dalbit at the bottom: shade(), tint(), mix().
// Color math for palettes: OKLab/OKLCH conversion, perceptual distance, and
// palette generation from color-harmony schemes with hue-shifted shading ramps.
// Pure JavaScript, shared with the browser editor.

const toLinear = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b]) {
  r = toLinear(r); g = toLinear(g); b = toLinear(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

// Linear sRGB for an OKLab color; values outside 0..1 mean out of gamut.
function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklabToRgb(lab) {
  return oklabToLinear(lab).map((v) => Math.round(Math.max(0, Math.min(1, fromLinear(Math.max(0, v)))) * 255));
}

export function rgbToOklch(rgb) {
  const [L, a, b] = rgbToOklab(rgb);
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

// OKLCH to sRGB, lowering chroma until the color fits in sRGB so hue and lightness survive.
export function oklchToRgb([L, C, h]) {
  const rad = (h * Math.PI) / 180;
  const lab = (c) => [L, c * Math.cos(rad), c * Math.sin(rad)];
  const fits = (c) => oklabToLinear(lab(c)).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  if (!fits(C)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    C = lo;
  }
  return oklabToRgb(lab(C));
}

export const hex = (rgb) => '#' + rgb.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');

// Perceptual distance (OKLab Euclidean).
export function colorDistance(a, b) {
  const p = rgbToOklab(a), q = rgbToOklab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

// Index of the closest candidate. Transparent pixels only match transparent entries.
export function nearestColor(rgba, candidates) {
  let best = -1, bestD = Infinity;
  const clear = rgba[3] === 0;
  candidates.forEach((c, i) => {
    if ((c[3] === 0) !== clear) return;
    const d = clear ? 0 : colorDistance(rgba, c) + Math.abs(rgba[3] - c[3]) / 255;
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

// ---------------------------------------------------------------- palette generation

// Hue offsets (degrees) from the base color for each harmony scheme.
export const SCHEMES = {
  monochromatic: [0],
  analogous: [0, -30, 30],
  complementary: [0, 180],
  'split-complementary': [0, 150, 210],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
};

// OKLCH hues that shadows and highlights drift toward (blue-violet and warm yellow),
// the classic pixel-art "hue shifting" so ramps don't look like plain black/white mixes.
const SHADOW_HUE = 285, LIGHT_HUE = 95, MAX_SHIFT = 22;

function hueToward(h, target, amount) {
  const diff = ((target - h + 540) % 360) - 180;
  return (h + Math.sign(diff) * Math.min(Math.abs(diff), amount) + 360) % 360;
}

function pickScheme(count) {
  if (count <= 4) return 'monochromatic';
  if (count <= 8) return 'complementary';
  if (count <= 16) return 'split-complementary';
  return 'triadic';
}

// Generate `count` colors: an optional dark outline color, then one shading ramp
// (dark to light) per hue group. The first group gets the longest ramp.
// base: one color (groups come from the harmony scheme) or a list of colors you
// choose, e.g. ["#8f563b", "#d9a521"] for wood and gold (each becomes its own ramp; scheme is ignored).
// saturation scales chroma (0.4 = muted, 1.4 = vivid); brightness shifts every ramp darker (-) or lighter (+).
export function generatePalette({ base = '#3b5dc9', scheme = 'auto', count = 8, outline = true, saturation = 1, brightness = 0 } = {}) {
  saturation = Math.max(0, Number(saturation) || 0);
  brightness = Math.max(-0.3, Math.min(0.3, Number(brightness) || 0));
  count = Math.round(Number(count));
  if (!(count >= 2 && count <= 64)) throw new Error('color count must be 2..64');
  const bases = (Array.isArray(base) ? base : String(base).split(',')).map((b) => parseHex(b ?? '#3b5dc9'));
  if (!bases.length) throw new Error('give at least one base color');
  if (bases.length > 1) scheme = 'custom';
  else if (scheme === 'auto') scheme = pickScheme(count);
  const offsets = bases.length > 1 ? null : SCHEMES[scheme];
  if (bases.length === 1 && !offsets) throw new Error(`Unknown scheme "${scheme}". Schemes: auto, ${Object.keys(SCHEMES).join(', ')}`);
  const [L0, C0, h0] = rgbToOklch(bases[0]);
  const colors = [];

  let n = count;
  // Ramps stay clearly lighter than the outline so the two never read as the same color.
  const outlineL = Math.max(0.12, 0.2 + brightness * 0.4);
  const rampMin = Math.max(0.26 + Math.min(0, brightness), outlineL + 0.1);
  if (outline && count >= 3) {
    const rgb = oklchToRgb([outlineL, Math.min(0.05, C0 * 0.5) * Math.min(1, saturation), hueToward(h0, SHADOW_HUE, 40)]);
    colors.push({ hex: hex(rgb), role: 'outline' });
    n--;
  }

  const names = { 0: 'base', 180: 'complement' };
  const allGroups = offsets
    ? offsets.map((off, g) => ({
        h: (h0 + off + 360) % 360,
        C: Math.max(C0, 0.02) * (g === 0 ? 1 : 0.85),
        L: g === 0 ? L0 : 0.6,
        name: names[((off % 360) + 360) % 360] || `hue ${off > 0 ? '+' : ''}${off}°`,
      }))
    : bases.map((rgb, g) => {
        const [L, C, h] = rgbToOklch(rgb);
        return { h, C: Math.max(C, 0.02), L, name: `color ${g + 1} ${hex(rgb)}` };
      });
  const groups = allGroups.slice(0, Math.max(1, Math.min(allGroups.length, n)));
  const sizes = groups.map((_, i) => Math.floor(n / groups.length) + (i < n % groups.length ? 1 : 0));
  groups.forEach(({ h, C: chroma, L: Lg, name: group }, g) => {
    const s = sizes[g];
    const center = Math.min(0.72, Math.max(0.45, Lg)) + brightness;
    const span = s === 1 ? 0 : Math.min(0.62, 0.14 * (s - 1) + 0.1);
    for (let i = 0; i < s; i++) {
      const t = s === 1 ? 0.5 : i / (s - 1);
      const L = Math.min(0.95, Math.max(rampMin, center + (t - 0.5) * span));
      const C = chroma * saturation * (0.65 + 0.35 * Math.sin(Math.PI * t));
      const hh = t < 0.5 ? hueToward(h, SHADOW_HUE, MAX_SHIFT * (0.5 - t) * 2) : hueToward(h, LIGHT_HUE, MAX_SHIFT * (t - 0.5) * 2);
      const role = s === 1 ? group : `${group} ${i + 1}/${s} (${i === 0 ? 'shadow' : i === s - 1 ? 'highlight' : 'mid'})`;
      // Nudge the lightness when it lands too close to a color already chosen (dark ramps of
      // different hues tend to converge); keep the original if no nudge gets clear of the others.
      const minDist = (rgb) => Math.min(Infinity, ...colors.map((c) => colorDistance(parseHex(c.hex), rgb)));
      let rgb = oklchToRgb([L, C, hh]);
      if (minDist(rgb) < 0.04) {
        for (const dL of [0.03, 0.06, 0.09, -0.03, 0.12, -0.06]) {
          const alt = oklchToRgb([Math.min(0.97, Math.max(0.1, L + dL)), C, hh]);
          if (minDist(alt) >= 0.04) { rgb = alt; break; }
        }
      }
      colors.push({ hex: hex(rgb), role });
    }
  });
  return { scheme, colors };
}

// For each palette color, the index of a darker palette color of a similar hue: the
// "selective outline" (selout) pixel artists use instead of pure black. Falls back to
// the darkest color. Transparent (alpha 0) entries map to themselves.
export function darkerShades(palette) {
  const labs = palette.map((c) => rgbToOklab(c));
  const darkest = labs.reduce((best, lab, i) => (palette[i][3] > 0 && (best < 0 || lab[0] < labs[best][0]) ? i : best), -1);
  return palette.map((c, i) => {
    if (c[3] === 0) return i;
    const [L, a, b] = labs[i];
    const target = [L * 0.5, a * 0.8, b * 0.8 - 0.01];
    let best = -1, bestD = Infinity;
    labs.forEach((lab, j) => {
      if (j === i || palette[j][3] === 0 || lab[0] > L - 0.08) return;
      const d = Math.hypot(lab[0] - target[0], (lab[1] - target[1]) * 1.5, (lab[2] - target[2]) * 1.5);
      if (d < bestD) { bestD = d; best = j; }
    });
    return best >= 0 ? best : darkest;
  });
}

// Perceived lightness 0..1 of an RGB color.
export const lightness = (rgb) => rgbToOklab(rgb)[0];

export function parseHex(s) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(s).trim());
  if (!m) throw new Error(`base color must be #rgb or #rrggbb, got "${s}"`);
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// ---- Dalbit additions: painter-style shading in OKLCH ----
// Shadows go darker, slightly more saturated and hue-shift toward cool violet; lights go lighter and toward warm gold.
const toHex = (rgb) => hex(rgb.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
export function shade(color, amt = 0.15, cool = 285) {
  const [L, C, h] = rgbToOklch(parseHex(color));
  const dh = ((((cool - h) % 360) + 540) % 360) - 180;
  return toHex(oklchToRgb([Math.max(0, L - amt), Math.min(0.37, C * (1 + amt * 0.8) + 0.004), h + dh * Math.min(1, amt * 1.6)]));
}
export function tint(color, amt = 0.1, warm = 85) {
  const [L, C, h] = rgbToOklch(parseHex(color));
  const dh = ((((warm - h) % 360) + 540) % 360) - 180;
  return toHex(oklchToRgb([Math.min(1, L + amt), C * (1 - amt * 0.6), h + dh * Math.min(1, amt * 1.2)]));
}
export function mix(a, b, t = 0.5) {
  const A = rgbToOklab(parseHex(a)), B = rgbToOklab(parseHex(b));
  return toHex(oklabToRgb(A.map((v, i) => v + (B[i] - v) * t)));
}
