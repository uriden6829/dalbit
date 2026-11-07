// Painted backgrounds for the webtoon: layered gradients, atmospheric depth, warm/cool light, soft glows.
// Each scene: (W, H, o) => { bg, fg?, ground } where o = { time, weather, lit, view, seed }. ground = y of the floor line.
// Korean signage is real text (reading practice); the same words are listed as tappable chips by the reader.
import { shade, tint, mix } from '../color.js';

let uid = 0;
const id = (p) => `${p}${(++uid).toString(36)}`;
const rng = (seed) => { let s = seed || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const r1 = (n) => Math.round(n * 10) / 10;

export const SKIES = {
  night: ['#11132e', '#262a58', '#4a4a80'], late: ['#0c0e24', '#1b1f45', '#2e3266'],
  dusk: ['#2a2b5e', '#7d5a86', '#f0a070'], day: ['#7fb7e2', '#bfe0f2', '#f4efe0'],
  morning: ['#8ebfe4', '#f1d7c4', '#fbe8cc'], storm: ['#151a26', '#262f3e', '#3a4554'], sepia: ['#6b553e', '#a88b67', '#e2cba2'],
};
const isNight = (t) => t === 'night' || t === 'late' || t === 'storm';

function grad(gid, stops, vertical = true) {
  return `<linearGradient id="${gid}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
}
function glow(cx, cy, r, color, a = 0.55) {
  const g = id('gl');
  return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${color}" stop-opacity="${a}"/><stop offset=".45" stop-color="${color}" stop-opacity="${a * 0.35}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>`;
}

export function sky(W, H, time = 'night', { moon = null, stars = 60, clouds = 3, seed = 3, horizon = 1 } = {}) {
  const [a, b, c] = SKIES[time] || SKIES.night;
  const g = id('sk');
  let out = `<defs>${grad(g, [[0, a], [0.55 * horizon, b], [1 * horizon, c]])}</defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`;
  const R = rng(seed);
  if (isNight(time) && stars) for (let i = 0; i < stars; i++) out += `<circle cx="${r1(R() * W)}" cy="${r1(R() * H * 0.6)}" r="${r1(0.4 + R() * 1.1)}" fill="#fff" opacity="${r1(0.25 + R() * 0.6)}"/>`;
  for (let i = 0; i < clouds; i++) {
    const cx = R() * W, cy = H * (0.12 + R() * 0.35), w = 60 + R() * 110;
    const col = time === 'day' || time === 'morning' ? '#ffffff' : time === 'dusk' ? '#c98a8e' : time === 'sepia' ? '#e9d6b4' : '#3a3d70';
    out += `<g opacity="${time === 'day' ? 0.85 : 0.4}"><ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(w / 2)}" ry="${r1(w / 7)}" fill="${col}"/><ellipse cx="${r1(cx - w * 0.15)}" cy="${r1(cy - w / 12)}" rx="${r1(w / 4)}" ry="${r1(w / 8)}" fill="${col}"/><ellipse cx="${r1(cx + w * 0.18)}" cy="${r1(cy - w / 16)}" rx="${r1(w / 5)}" ry="${r1(w / 9)}" fill="${col}"/></g>`;
  }
  if (moon) {
    const [mx, my, mr = 26] = moon;
    out += glow(mx, my, mr * 5, '#f6e7b0', isNight(time) ? 0.32 : 0.15);
    out += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="#f8efcf"/><circle cx="${mx - mr * 0.3}" cy="${my - mr * 0.2}" r="${mr * 0.22}" fill="#efe1b4" opacity=".7"/><circle cx="${mx + mr * 0.35}" cy="${my + mr * 0.3}" r="${mr * 0.14}" fill="#efe1b4" opacity=".6"/>`;
  }
  return out;
}

// A row of hillside houses with lit windows. depth 0 (near) .. 1 (far, hazier)
export function town(W, y, { seed = 5, depth = 0.5, time = 'night', h = 40, lit = true } = {}) {
  const R = rng(seed);
  const night = isNight(time);
  const base = night ? mix('#2a2d55', '#5a5e8e', depth * 0.7) : time === 'dusk' ? mix('#6b4f6e', '#b48a8e', depth) : mix('#8a7a72', '#c9c4c8', depth);
  let out = '', x = -10;
  while (x < W + 10) {
    const w = 18 + R() * 26, hh = h * (0.6 + R() * 0.6), roof = R() < 0.6;
    const col = mix(base, night ? '#1d1f3e' : '#6e5e58', R() * 0.3);
    out += `<rect x="${r1(x)}" y="${r1(y - hh)}" width="${r1(w)}" height="${r1(hh + 40)}" fill="${col}"/>`;
    if (roof) out += `<path d="M${r1(x - 3)} ${r1(y - hh)} L${r1(x + w / 2)} ${r1(y - hh - w * 0.38)} L${r1(x + w + 3)} ${r1(y - hh)}Z" fill="${shade(col, 0.06)}"/>`;
    if (lit) for (let k = 0; k < 2; k++) if (R() < (night ? 0.7 : 0.25)) {
      const wx = x + 4 + R() * (w - 10), wy = y - hh + 6 + R() * (hh - 14);
      out += `<rect x="${r1(wx)}" y="${r1(wy)}" width="4.5" height="5.5" fill="${night ? '#ffd88a' : '#d9e3ea'}" opacity="${night ? 0.9 - depth * 0.3 : 0.7}"/>`;
      if (night && depth < 0.6) out += glow(wx + 2, wy + 3, 10, '#ffcf7a', 0.25);
    }
    x += w + R() * 3;
  }
  return out;
}

export function lighthouse(x, y, s = 1, { lit = 0.3, time = 'night' } = {}) {
  const body = isNight(time) ? '#cfc8d8' : '#f2ede4', stripe = '#b8524c';
  let out = '';
  if (lit > 0) {
    out += glow(x, y - 92 * s, 120 * s * (0.5 + lit), '#ffe6a0', 0.2 + lit * 0.5);
    out += `<path d="M${x} ${y - 92 * s} L${x + 260 * s} ${y - 140 * s} L${x + 260 * s} ${y - 60 * s}Z" fill="#fff3c4" opacity="${0.06 + lit * 0.18}"/><path d="M${x} ${y - 92 * s} L${x - 220 * s} ${y - 130 * s} L${x - 220 * s} ${y - 66 * s}Z" fill="#fff3c4" opacity="${0.04 + lit * 0.12}"/>`;
  }
  out += `<path d="M${x - 16 * s} ${y} L${x - 10 * s} ${y - 80 * s} L${x + 10 * s} ${y - 80 * s} L${x + 16 * s} ${y}Z" fill="${body}"/>`;
  out += `<path d="M${x - 14.6 * s} ${y - 18 * s} L${x + 14.6 * s} ${y - 18 * s} L${x + 13.4 * s} ${y - 32 * s} L${x - 13.4 * s} ${y - 32 * s}Z M${x - 12.2 * s} ${y - 48 * s} L${x + 12.2 * s} ${y - 48 * s} L${x + 11 * s} ${y - 62 * s} L${x - 11 * s} ${y - 62 * s}Z" fill="${stripe}"/>`;
  out += `<path d="M${x} ${y} L${x + 16 * s} ${y} L${x + 10 * s} ${y - 80 * s} L${x} ${y - 80 * s}Z" fill="#000" opacity=".12"/>`;
  out += `<rect x="${x - 14 * s}" y="${y - 84 * s}" width="${28 * s}" height="${5 * s}" fill="#4a4560"/><rect x="${x - 8 * s}" y="${y - 100 * s}" width="${16 * s}" height="${16 * s}" fill="${lit > 0 ? mix('#5a5470', '#fff1b8', Math.min(1, lit)) : '#5a5470'}"/><path d="M${x - 11 * s} ${y - 100 * s} L${x} ${y - 112 * s} L${x + 11 * s} ${y - 100 * s}Z" fill="#4a4560"/>`;
  return out;
}

function hillShape(W, y, amp, seed, col) {
  const R = rng(seed);
  let d = `M0 ${y}`;
  for (let x = 0; x <= W; x += W / 6) d += ` Q${r1(x + W / 12)} ${r1(y - amp * R())} ${r1(x + W / 6)} ${r1(y - amp * 0.3 * R())}`;
  return `<path d="${d} L${W} ${y + 400} L0 ${y + 400}Z" fill="${col}"/>`;
}
function sea(W, y, H, time, moonX) {
  const g = id('sea');
  const top = time === 'day' ? '#6aa3c8' : time === 'dusk' ? '#6b5a80' : time === 'sepia' ? '#9b8462' : '#1b2148';
  const bot = time === 'day' ? '#3d6f94' : time === 'dusk' ? '#3a3560' : time === 'sepia' ? '#6e5a40' : '#0e1230';
  let out = `<defs>${grad(g, [[0, top], [1, bot]])}</defs><rect x="0" y="${y}" width="${W}" height="${H - y}" fill="url(#${g})"/>`;
  const R = rng(9);
  for (let i = 0; i < 26; i++) {
    const yy = y + 4 + (R() ** 1.4) * (H - y), w = 8 + R() * 30, x = (moonX ?? W / 2) + (R() - 0.5) * (40 + (yy - y) * 0.8);
    out += `<rect x="${r1(x)}" y="${r1(yy)}" width="${r1(w)}" height="1.6" rx=".8" fill="${time === 'day' ? '#e8f4fb' : '#f6e7b0'}" opacity="${r1(0.25 + R() * 0.45)}"/>`;
  }
  return out;
}
export function rain(W, H, { amt = 70, seed = 4, angle = 0.22 } = {}) {
  const R = rng(seed);
  let out = `<g stroke="#cfe0ff" stroke-linecap="round">`;
  for (let i = 0; i < amt; i++) { const x = R() * (W + 60) - 30, y = R() * H, l = 12 + R() * 18; out += `<path d="M${r1(x)} ${r1(y)} l${r1(-l * angle)} ${r1(l)}" stroke-width="${r1(0.6 + R() * 0.8)}" opacity="${r1(0.25 + R() * 0.4)}"/>`; }
  return out + '</g>';
}
export function bokeh(W, H, colors, { n = 14, seed = 6, y0 = 0, y1 = 1 } = {}) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += `<circle cx="${r1(R() * W)}" cy="${r1(H * (y0 + R() * (y1 - y0)))}" r="${r1(6 + R() * 18)}" fill="${colors[i % colors.length]}" opacity="${r1(0.12 + R() * 0.25)}"/>`;
  return out;
}
const lamp = (x, y, s = 1, on = true) => `${on ? glow(x, y + 10 * s, 60 * s, '#ffcf7a', 0.5) : ''}<path d="M${x} ${y - 30 * s} V${y}" stroke="#3d3546" stroke-width="${1.5 * s}"/><path d="M${x - 9 * s} ${y + 8 * s} Q${x} ${y - 6 * s} ${x + 9 * s} ${y + 8 * s}Z" fill="#4a3f52"/><ellipse cx="${x}" cy="${y + 9 * s}" rx="${5 * s}" ry="${3 * s}" fill="${on ? '#ffe2a0' : '#8a8090'}"/>`;
function bread(x, y, s, kind = 0) {
  const k = kind % 4;
  if (k === 0) return `<ellipse cx="${x}" cy="${y}" rx="${12 * s}" ry="${7 * s}" fill="#d08f4c"/><path d="M${x - 6 * s} ${y - 3 * s} l3 4 M${x} ${y - 4 * s} l3 4 M${x + 6 * s} ${y - 3 * s} l3 4" stroke="#f2c98a" stroke-width="${1.2 * s}" stroke-linecap="round"/>`;
  if (k === 1) return `<path d="M${x - 13 * s} ${y + 4 * s} Q${x} ${y - 14 * s} ${x + 13 * s} ${y + 4 * s}Z" fill="#c9843f"/><path d="M${x - 9 * s} ${y} Q${x} ${y - 8 * s} ${x + 9 * s} ${y}" stroke="#e8b46e" stroke-width="${1.1 * s}" fill="none"/>`;
  if (k === 2) return `<circle cx="${x}" cy="${y}" r="${8 * s}" fill="#e2b06a"/><circle cx="${x}" cy="${y}" r="${3 * s}" fill="#b8524c"/>`;
  return `<rect x="${x - 14 * s}" y="${y - 6 * s}" width="${28 * s}" height="${11 * s}" rx="${5 * s}" fill="#b97a3c"/><path d="M${x - 8 * s} ${y - 5 * s} v9 M${x} ${y - 5 * s} v9 M${x + 8 * s} ${y - 5 * s} v9" stroke="#e0a865" stroke-width="${1.1 * s}"/>`;
}
function signBoard(x, y, w, h, text, { bg = '#2f3d5a', fg = '#f6e7c4', size = 14, font = 'Gowun Batang, serif' } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${bg}" stroke="${shade(bg, 0.15)}" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + h / 2 + size * 0.36}" text-anchor="middle" font-family="${font}" font-weight="700" font-size="${size}" fill="${fg}">${text}</text>`;
}
const floor = (W, y, H, c1, c2) => { const g = id('fl'); return `<defs>${grad(g, [[0, c1], [1, c2]])}</defs><rect x="0" y="${y}" width="${W}" height="${H - y}" fill="url(#${g})"/>`; };
function windowFrame(x, y, w, h, inner, { round = false, frame = '#5b4636' } = {}) {
  const c = id('wc');
  const shape = round ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w / 2}"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>`;
  return `<defs><clipPath id="${c}">${shape}</clipPath></defs><g clip-path="url(#${c})">${inner}</g>` +
    (round ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w / 2}" fill="none" stroke="${frame}" stroke-width="6"/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="${frame}" stroke-width="3"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="${frame}" stroke-width="6"/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}" stroke="${frame}" stroke-width="3"/>`);
}
// The view out of a window: sky + town + lighthouse.
function outside(x, y, w, h, time, lit = 0.3) {
  return `<g transform="translate(${x} ${y})">${sky(w, h, time, { moon: isNight(time) ? [w * 0.75, h * 0.25, 9] : null, stars: 14, clouds: 1, seed: 11 })}${town(w, h * 0.92, { seed: 7, depth: 0.8, time, h: 16 })}${lighthouse(w * 0.22, h * 0.8, 0.42, { lit, time })}</g>`;
}

// ---------------------------------------------------------------- scenes
export const VISTAS = {
  // Establishing: the hill town of 달무리 by the sea, lighthouse on the cape.
  town(W, H, o) {
    const t = o.time || 'night', lit = o.lit ?? 0.25;
    const sl = H * 0.62;
    let bg = sky(W, H, t, { moon: o.noMoon ? null : [W * 0.78, H * 0.18, Math.min(W, H) * 0.07], stars: 90, clouds: 3, seed: o.seed || 2 });
    bg += hillShape(W, H * 0.5, 30, 3, isNight(t) ? '#232650' : t === 'dusk' ? '#5d4a70' : '#9fb3a0');
    bg += sea(W, sl, H, t, W * 0.78);
    bg += `<path d="M${W * 0.55} ${sl} C${W * 0.68} ${sl - 50} ${W * 0.84} ${sl - 70} ${W * 1.02} ${sl - 72} L${W} ${sl + 6}Z" fill="${isNight(t) ? '#1b1d3e' : '#6d7f6a'}"/>`;
    bg += lighthouse(W * 0.86, sl - 66, 0.62 * (W / 360), { lit, time: t });
    bg += `<path d="M-10 ${H * 0.98} C${W * 0.1} ${H * 0.62} ${W * 0.3} ${H * 0.5} ${W * 0.58} ${H * 0.6} L${W * 0.62} ${H}Z" fill="${isNight(t) ? '#2a2d58' : '#8c9a86'}"/>`;
    bg += town(W * 0.6, H * 0.66, { seed: 4, depth: 0.55, time: t, h: 22 });
    bg += `<g transform="translate(0 ${H * 0.14})">${town(W * 0.5, H * 0.72, { seed: 8, depth: 0.25, time: t, h: 30 })}</g>`;
    bg += `<g transform="translate(0 ${H * 0.26})">${town(W * 0.42, H * 0.74, { seed: 13, depth: 0, time: t, h: 38 })}</g>`;
    if (o.weather === 'rain') bg += rain(W, H, { amt: 90 });
    return { bg, ground: H * 0.98 };
  },
  station(W, H, o) {
    const t = o.time || 'night';
    let bg = sky(W, H, t, { moon: [W * 0.85, H * 0.15, 16], stars: 40, clouds: 1, seed: 21 });
    bg += hillShape(W, H * 0.55, 20, 4, '#22244a') + town(W, H * 0.6, { seed: 31, depth: 0.7, time: t, h: 20 });
    bg += `<rect x="0" y="${H * 0.25}" width="${W}" height="10" fill="#2b2a3c"/>`;
    for (let i = 0; i < 5; i++) bg += `<rect x="${W * 0.08 + i * W * 0.22}" y="${H * 0.25}" width="5" height="${H * 0.5}" fill="#2b2a3c"/>`;
    // train
    bg += `<rect x="${-W * 0.1}" y="${H * 0.42}" width="${W * 0.62}" height="${H * 0.3}" rx="10" fill="#3f5f7a"/><rect x="${-W * 0.1}" y="${H * 0.62}" width="${W * 0.62}" height="${H * 0.04}" fill="#d4b26a"/>`;
    for (let i = 0; i < 4; i++) bg += `<rect x="${W * (-0.06 + i * 0.14)}" y="${H * 0.46}" width="${W * 0.1}" height="${H * 0.12}" rx="3" fill="#ffd88a" opacity=".9"/>` + glow(W * (-0.01 + i * 0.14), H * 0.52, 34, '#ffcf7a', 0.25);
    bg += floor(W, H * 0.74, H, '#3a3650', '#2a2840') + `<rect x="0" y="${H * 0.74}" width="${W}" height="4" fill="#e8d28a" opacity=".8"/>`;
    bg += signBoard(W * 0.6, H * 0.3, W * 0.3, H * 0.09, '달무리', { size: Math.min(W, H) * 0.05 });
    bg += lamp(W * 0.55, H * 0.28, 0.9) + lamp(W * 0.95, H * 0.28, 0.9);
    return { bg, ground: H * 0.95 };
  },
  bakeryOut(W, H, o) {
    const t = o.time || 'night', night = isNight(t);
    let bg = sky(W, H, t, { moon: night ? [W * 0.15, H * 0.12, 12] : null, stars: 30, seed: 41 });
    bg += `<rect x="${W * 0.08}" y="${H * 0.12}" width="${W * 0.84}" height="${H * 0.8}" fill="${night ? '#5a4a5a' : '#c9a98a'}"/><path d="M${W * 0.04} ${H * 0.14} L${W * 0.5} ${H * 0.02} L${W * 0.96} ${H * 0.14}Z" fill="${night ? '#3d3448' : '#8a5a4a'}"/>`;
    bg += `<path d="M${W * 0.1} ${H * 0.36} h${W * 0.8} l-${W * 0.04} ${H * 0.1} h-${W * 0.72}Z" fill="#b8524c"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${W * (0.14 + i * 0.11)} ${H * 0.46} q${W * 0.055} ${H * 0.05} ${W * 0.11} 0" fill="#f3e6c4"/>`).join('');
    bg += signBoard(W * 0.26, H * 0.2, W * 0.48, H * 0.11, '달빛 빵집', { bg: '#2f2b4a', fg: '#e7c66f', size: Math.min(W, H) * 0.06 });
    const win = `<rect width="${W * 0.32}" height="${H * 0.3}" fill="${night ? '#ffcf86' : '#f6e6c8'}"/>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => bread(W * (0.04 + c * 0.075), H * (0.08 + r * 0.09), W / 420, r + c)).join('')).join('')}`;
    bg += windowFrame(W * 0.12, H * 0.5, W * 0.32, H * 0.3, win, { frame: '#5b4636' }) + (night ? glow(W * 0.28, H * 0.65, W * 0.3, '#ffcf7a', 0.35) : '');
    bg += `<rect x="${W * 0.56}" y="${H * 0.5}" width="${W * 0.2}" height="${H * 0.42}" rx="2" fill="#6b4a32"/><rect x="${W * 0.59}" y="${H * 0.54}" width="${W * 0.14}" height="${H * 0.16}" fill="${night ? '#ffd88a' : '#e6d6bc'}"/>`;
    bg += floor(W, H * 0.92, H, '#5a5068', '#3d3650') + lamp(W * 0.88, H * 0.42, 1);
    if (o.weather === 'rain') bg += rain(W, H);
    return { bg, ground: H * 0.97 };
  },
  bakery(W, H, o) {
    const t = o.time || 'day', night = isNight(t);
    let bg = floor(W, 0, H * 0.7, night ? '#6b5246' : '#d8bf9c', night ? '#5a4238' : '#cdb08a');
    bg += windowFrame(W * 0.05, H * 0.08, W * 0.3, H * 0.34, outside(0, 0, W * 0.3, H * 0.34, t, o.lit ?? 0.3).replace(/translate\(0 0\)/, `translate(${W * 0.05} ${H * 0.08})`), {});
    for (let r = 0; r < 3; r++) {
      const y = H * (0.16 + r * 0.14);
      bg += `<rect x="${W * 0.45}" y="${y}" width="${W * 0.52}" height="5" fill="#6b4a32"/>`;
      for (let i = 0; i < 6; i++) bg += bread(W * (0.5 + i * 0.08), y - 5, W / 420, i + r);
    }
    bg += lamp(W * 0.3, H * 0.02, 1.1, true) + lamp(W * 0.72, H * 0.02, 1.1, true);
    bg += glow(W * 0.5, H * 0.35, W * 0.7, night ? '#ffbf6a' : '#fff1d0', night ? 0.35 : 0.25);
    bg += floor(W, H * 0.7, H, night ? '#4a3a40' : '#a8876a', night ? '#3a2d34' : '#8e6f56');
    const fg = o.counter === false ? '' : `<rect x="${-4}" y="${H * 0.72}" width="${W + 8}" height="${H * 0.3}" fill="#8a5d3e"/><rect x="-4" y="${H * 0.72}" width="${W + 8}" height="8" fill="#a8774f"/><rect x="${W * 0.1}" y="${H * 0.66}" width="${W * 0.22}" height="${H * 0.07}" rx="3" fill="#f2ead8" opacity=".85"/>${bread(W * 0.16, H * 0.68, W / 340, 1)}${bread(W * 0.26, H * 0.685, W / 340, 2)}`;
    return { bg, fg, ground: H * 0.98, behind: 0.74 };
  },
  attic(W, H, o) {
    const t = o.time || 'night', night = isNight(t);
    let bg = floor(W, 0, H, night ? '#3e3550' : '#c9b49a', night ? '#2e2840' : '#b39c80');
    bg += `<path d="M0 0 L${W * 0.42} ${H * 0.0} L0 ${H * 0.42}Z M${W} 0 L${W * 0.58} 0 L${W} ${H * 0.42}Z" fill="${night ? '#2a2338' : '#9c8468'}"/>`;
    bg += `<path d="M${W * 0.05} ${H * 0.3} L${W * 0.3} 0 M${W * 0.95} ${H * 0.3} L${W * 0.7} 0" stroke="${night ? '#4a3d56' : '#7d6650'}" stroke-width="8"/>`;
    const ow = Math.min(W * 0.34, H * 0.42);
    bg += (night ? glow(W * 0.5, H * 0.28, ow * 1.3, '#9aa6ff', 0.2) : '') + windowFrame(W * 0.5 - ow / 2, H * 0.08, ow, ow, outside(W * 0.5 - ow / 2, H * 0.08, ow, ow, t, o.lit ?? 0.3), { round: true, frame: '#5b4636' });
    bg += floor(W, H * 0.72, H, night ? '#3a2e3a' : '#a48268', night ? '#2a222c' : '#8a6c56');
    bg += `<rect x="${W * 0.02}" y="${H * 0.6}" width="${W * 0.34}" height="${H * 0.16}" rx="6" fill="${night ? '#5c5a8a' : '#d9d0e6'}"/><rect x="${W * 0.02}" y="${H * 0.57}" width="${W * 0.1}" height="${H * 0.07}" rx="4" fill="#efe6f2"/><rect x="${W * 0.02}" y="${H * 0.68}" width="${W * 0.34}" height="${H * 0.1}" fill="${night ? '#46447a' : '#bdb2d6'}"/>`;
    bg += `<rect x="${W * 0.72}" y="${H * 0.58}" width="${W * 0.24}" height="6" fill="#6b4a32"/><rect x="${W * 0.74}" y="${H * 0.6}" width="5" height="${H * 0.14}" fill="#6b4a32"/><rect x="${W * 0.92}" y="${H * 0.6}" width="5" height="${H * 0.14}" fill="#6b4a32"/>`;
    bg += `<rect x="${W * 0.8}" y="${H * 0.52}" width="6" height="${H * 0.06}" fill="#f4ecd6"/>` + (night ? glow(W * 0.81, H * 0.5, 40, '#ffcf7a', 0.55) + `<path d="M${W * 0.81} ${H * 0.5} q-3 -6 0 -10 q3 4 0 10Z" fill="#ffd88a"/>` : '');
    return { bg, ground: H * 0.96 };
  },
  lighthouse(W, H, o) {
    const t = o.time || 'night', lit = o.lit ?? 0.2;
    let bg = sky(W, H, t, { moon: [W * 0.2, H * 0.15, 18], stars: 70, seed: 51 });
    bg += sea(W, H * 0.7, H, t, W * 0.2);
    bg += `<path d="M${W * 0.3} ${H} C${W * 0.4} ${H * 0.78} ${W * 0.6} ${H * 0.74} ${W * 1.05} ${H * 0.72} L${W} ${H}Z" fill="${isNight(t) ? '#1d1f3c' : '#6d7f6a'}"/>`;
    bg += lighthouse(W * 0.66, H * 0.76, (H / 140) * 0.95, { lit, time: t });
    return { bg, ground: H * 0.94 };
  },
  lantern(W, H, o) {
    const lit = o.lit ?? 0.2, t = o.time || 'night';
    let bg = sky(W, H, t, { moon: [W * 0.85, H * 0.2, 12], stars: 50, seed: 61 });
    bg += sea(W, H * 0.55, H, t, W * 0.85);
    for (let i = 0; i < 4; i++) bg += `<rect x="${W * (i * 0.33) - 4}" y="0" width="10" height="${H}" fill="#3a3448"/>`;
    bg += `<rect x="0" y="${H * 0.62}" width="${W}" height="${H * 0.4}" fill="#4a4258"/><rect x="0" y="${H * 0.62}" width="${W}" height="6" fill="#6b6280"/>`;
    bg += glow(W * 0.5, H * 0.4, W * 0.6 * (0.4 + lit), '#ffe6a0', 0.25 + lit * 0.5);
    bg += `<ellipse cx="${W * 0.5}" cy="${H * 0.42}" rx="${W * 0.13}" ry="${H * 0.2}" fill="${mix('#6c6a86', '#fff4c8', lit)}" stroke="#c9a457" stroke-width="4"/>`;
    for (let i = 1; i < 5; i++) bg += `<path d="M${W * 0.37} ${H * (0.24 + i * 0.07)} H${W * 0.63}" stroke="#c9a457" stroke-width="1.5" opacity=".6"/>`;
    bg += `<rect x="${W * 0.45}" y="${H * 0.62}" width="${W * 0.1}" height="${H * 0.2}" fill="#3a3448"/>`;
    bg += `<rect x="${W * 0.04}" y="${H * 0.5}" width="${W * 0.18}" height="5" fill="#6b4a32"/><rect x="${W * 0.07}" y="${H * 0.44}" width="${W * 0.08}" height="${H * 0.06}" fill="#f2e6cc" transform="rotate(-6 ${W * 0.1} ${H * 0.47})"/>`;
    return { bg, ground: H * 0.97 };
  },
  harbour(W, H, o) {
    const t = o.time || 'day';
    let bg = sky(W, H, t, { moon: isNight(t) && t !== 'storm' ? [W * 0.8, H * 0.15, 14] : null, clouds: 4, seed: 71 });
    bg += sea(W, H * 0.45, H, t, W * 0.6);
    bg += town(W, H * 0.45, { seed: 72, depth: 0.7, time: t, h: 18 });
    for (let i = 0; i < 3; i++) { const x = W * (0.15 + i * 0.32), y = H * 0.58; bg += `<path d="M${x - 30} ${y} L${x + 30} ${y} L${x + 22} ${y + 12} L${x - 24} ${y + 12}Z" fill="${['#b8524c', '#4f6d8c', '#e3d6b8'][i]}"/><path d="M${x} ${y} V${y - 42}" stroke="#4a3f3a" stroke-width="2"/><path d="M${x} ${y - 40} L${x + 20} ${y - 8} L${x} ${y - 8}Z" fill="#f2ede4" opacity=".9"/>`; }
    bg += floor(W, H * 0.7, H, '#8a7a6a', '#6e6052');
    for (let i = 0; i < 8; i++) bg += `<rect x="${W * i / 8}" y="${H * 0.7}" width="2" height="${H * 0.3}" fill="#5a4e44" opacity=".5"/>`;
    bg += `<path d="M${W * 0.2} ${H * 0.2} q6 -5 12 0 q6 -5 12 0 M${W * 0.62} ${H * 0.26} q5 -4 10 0 q5 -4 10 0" stroke="#3a3a48" stroke-width="1.6" fill="none"/>`;
    return { bg, ground: H * 0.97 };
  },
  market(W, H, o) {
    const t = o.time || 'day';
    let bg = floor(W, 0, H * 0.6, '#5a4a52', '#7a6a6a');
    for (let i = 0; i < 9; i++) bg += `<path d="M${W * i / 8} 0 L${W * (i / 8 + 0.0625)} ${H * 0.12} L${W * (i + 1) / 8} 0Z" fill="${i % 2 ? '#e8d9b8' : '#b8524c'}"/>`;
    for (let i = 0; i < 7; i++) bg += lamp(W * (0.07 + i * 0.145), H * 0.14, 0.7, true);
    const stall = (x, w, fruit) => {
      let s = `<rect x="${x}" y="${H * 0.52}" width="${w}" height="${H * 0.2}" fill="#8a6142"/><rect x="${x}" y="${H * 0.5}" width="${w}" height="${H * 0.04}" fill="#a8774f"/>`;
      for (let k = 0; k < 12; k++) s += `<circle cx="${x + 10 + (k % 6) * (w - 20) / 5}" cy="${H * 0.47 - Math.floor(k / 6) * 9}" r="7" fill="${fruit[k % fruit.length]}"/>`;
      return s;
    };
    bg += stall(W * 0.02, W * 0.44, ['#c8423b', '#d8573a', '#b8352f']) + stall(W * 0.54, W * 0.44, ['#e8c45a', '#d9b44a', '#e3cf70']);
    bg += signBoard(W * 0.1, H * 0.3, W * 0.26, H * 0.08, '사과 5,000원', { bg: '#f3ead6', fg: '#3a2a30', size: Math.min(W, H) * 0.04, font: 'Noto Sans KR, sans-serif' });
    bg += signBoard(W * 0.62, H * 0.3, W * 0.26, H * 0.08, '배 3개 만원', { bg: '#f3ead6', fg: '#3a2a30', size: Math.min(W, H) * 0.04, font: 'Noto Sans KR, sans-serif' });
    bg += floor(W, H * 0.72, H, '#6e6058', '#54483f');
    return { bg, ground: H * 0.98 };
  },
  bus(W, H, o) {
    const t = o.time || 'dusk';
    let bg = floor(W, 0, H, '#d9d2c4', '#bfb6a6');
    for (let i = 0; i < 3; i++) bg += windowFrame(W * (0.04 + i * 0.33), H * 0.14, W * 0.28, H * 0.34, `<g transform="translate(${W * (0.04 + i * 0.33)} ${H * 0.14})">${sky(W * 0.28, H * 0.34, t, { stars: 6, clouds: 1, seed: 80 + i })}${town(W * 0.28, H * 0.34, { seed: 90 + i, depth: 0.3, time: t, h: 20 })}</g>`, { frame: '#8a8a8a' });
    bg += `<rect x="0" y="${H * 0.06}" width="${W}" height="5" fill="#9a9a9a"/>` + [0.15, 0.4, 0.65, 0.9].map((x) => `<path d="M${W * x} ${H * 0.08} v${H * 0.08}" stroke="#7a7a7a" stroke-width="2"/><circle cx="${W * x}" cy="${H * 0.18}" r="6" fill="none" stroke="#e3c35a" stroke-width="3"/>`).join('');
    bg += `<rect x="0" y="${H * 0.56}" width="${W}" height="${H * 0.18}" fill="#4f6d8c"/><rect x="0" y="${H * 0.74}" width="${W}" height="${H * 0.3}" fill="#5c5650"/>`;
    bg += signBoard(W * 0.64, H * 0.005, W * 0.32, H * 0.05, '다음 정류장: 등대', { bg: '#1d2a3a', fg: '#ffcf5a', size: Math.min(W, H) * 0.032, font: 'Noto Sans KR, sans-serif' });
    return { bg, ground: H * 0.98 };
  },
  busstop(W, H, o) {
    const t = o.time || 'dusk';
    let bg = sky(W, H, t, { clouds: 3, seed: 101 }) + town(W, H * 0.6, { seed: 102, depth: 0.5, time: t, h: 40 });
    bg += floor(W, H * 0.62, H, '#6a6470', '#4e4856') + `<rect x="0" y="${H * 0.62}" width="${W}" height="5" fill="#9a94a0"/>`;
    bg += `<rect x="${W * 0.7}" y="${H * 0.18}" width="4" height="${H * 0.5}" fill="#3a3a48"/>` + signBoard(W * 0.62, H * 0.12, W * 0.2, H * 0.1, '정류장', { bg: '#2f6d5a', fg: '#fff', size: Math.min(W, H) * 0.04, font: 'Noto Sans KR, sans-serif' });
    bg += `<rect x="${W * 0.6}" y="${H * 0.26}" width="${W * 0.22}" height="${H * 0.14}" rx="2" fill="#f2ede4"/><text x="${W * 0.71}" y="${H * 0.31}" text-anchor="middle" font-family="Noto Sans KR" font-size="${Math.min(W, H) * 0.03}" fill="#2a2840">7번 → 등대</text><text x="${W * 0.71}" y="${H * 0.37}" text-anchor="middle" font-family="Noto Sans KR" font-size="${Math.min(W, H) * 0.03}" fill="#2a2840">3번 → 시장</text>`;
    return { bg, ground: H * 0.96 };
  },
  kitchen(W, H, o) {
    const t = o.time || 'night', night = isNight(t);
    let bg = floor(W, 0, H * 0.66, night ? '#6e5a4a' : '#e3d2b4', night ? '#5a4a3e' : '#d6c2a0');
    bg += windowFrame(W * 0.62, H * 0.08, W * 0.3, H * 0.28, outside(W * 0.62, H * 0.08, W * 0.3, H * 0.28, t, o.lit ?? 0.3));
    bg += `<rect x="0" y="${H * 0.42}" width="${W * 0.55}" height="${H * 0.26}" fill="#8a6a50"/><rect x="0" y="${H * 0.4}" width="${W * 0.55}" height="${H * 0.03}" fill="#c9b8a0"/>`;
    bg += `<rect x="${W * 0.06}" y="${H * 0.08}" width="${W * 0.4}" height="5" fill="#6b4a32"/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="${W * (0.08 + i * 0.075)}" y="${H * 0.08 - 22}" width="14" height="22" rx="3" fill="${['#c8423b', '#e8c45a', '#7b8f6a', '#f2ede4', '#b98a55'][i]}"/>`).join('');
    bg += glow(W * 0.45, H * 0.2, W * 0.6, '#ffcf86', night ? 0.4 : 0.2) + lamp(W * 0.45, H * 0.0, 1.2);
    bg += floor(W, H * 0.66, H, night ? '#4a3a32' : '#a88e70', night ? '#3a2d26' : '#8e7458');
    return { bg, ground: H * 0.98 };
  },
  table(W, H, o) { // dinner table, seen from close: stew pot steaming, side dishes
    const t = o.time || 'night', night = isNight(t);
    let bg = floor(W, 0, H * 0.55, night ? '#5a4638' : '#d9c4a4', night ? '#4a3a30' : '#c9b08c') + glow(W * 0.5, H * 0.1, W * 0.7, '#ffcf86', 0.45);
    bg += `<ellipse cx="${W * 0.5}" cy="${H * 0.8}" rx="${W * 0.7}" ry="${H * 0.32}" fill="#9a6a44"/><ellipse cx="${W * 0.5}" cy="${H * 0.78}" rx="${W * 0.66}" ry="${H * 0.28}" fill="#b07a4e"/>`;
    bg += `<ellipse cx="${W * 0.5}" cy="${H * 0.72}" rx="${W * 0.16}" ry="${H * 0.06}" fill="#3a3030"/><path d="M${W * 0.34} ${H * 0.72} q0 ${H * 0.12} ${W * 0.16} ${H * 0.12} q${W * 0.16} 0 ${W * 0.16} -${H * 0.12}" fill="#4a3a38"/><ellipse cx="${W * 0.5}" cy="${H * 0.715}" rx="${W * 0.14}" ry="${H * 0.045}" fill="#c8423b"/><circle cx="${W * 0.46}" cy="${H * 0.71}" r="4" fill="#f2ede4"/><circle cx="${W * 0.53}" cy="${H * 0.72}" r="3" fill="#7b8f6a"/>`;
    bg += [0, 1, 2].map((i) => `<path d="M${W * (0.44 + i * 0.06)} ${H * 0.64} q-8 -14 0 -26 q8 -12 0 -24" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>`).join('');
    [[0.2, '#c8423b'], [0.8, '#7b8f6a'], [0.28, '#e8c45a'], [0.72, '#d9a07a']].forEach(([x, c], i) => { bg += `<ellipse cx="${W * x}" cy="${H * (0.84 + (i > 1 ? 0.08 : 0))}" rx="${W * 0.07}" ry="${H * 0.03}" fill="#f2ede4"/><ellipse cx="${W * x}" cy="${H * (0.835 + (i > 1 ? 0.08 : 0))}" rx="${W * 0.05}" ry="${H * 0.018}" fill="${c}"/>`; });
    return { bg, ground: H * 1.02 };
  },
  living(W, H, o) {
    const t = o.time || 'night', night = isNight(t);
    let bg = floor(W, 0, H * 0.7, night ? '#6a5a5a' : '#e6d6c0', night ? '#584a4a' : '#d8c6ac') + glow(W * 0.3, H * 0.2, W * 0.6, '#ffcf86', night ? 0.35 : 0.15);
    [[0.08, 0.12, 0.16, 0.2], [0.3, 0.1, 0.12, 0.14], [0.46, 0.16, 0.14, 0.17], [0.7, 0.1, 0.2, 0.24]].forEach(([x, y, w, h], i) => {
      bg += `<rect x="${W * x}" y="${H * y}" width="${W * w}" height="${H * h}" fill="#6b4a32"/><rect x="${W * x + 4}" y="${H * y + 4}" width="${W * w - 8}" height="${H * h - 8}" fill="${['#d9c9a8', '#c9d4d8', '#e3d0b8', '#cfc4a4'][i]}"/><circle cx="${W * (x + w / 2)}" cy="${H * (y + h * 0.42)}" r="${W * w * 0.14}" fill="#8a7462" opacity=".6"/>`;
    });
    bg += floor(W, H * 0.7, H, night ? '#5a443a' : '#c49e74', night ? '#463630' : '#ae8a62');
    bg += `<rect x="${W * 0.1}" y="${H * 0.76}" width="${W * 0.8}" height="${H * 0.06}" rx="4" fill="#7a5638"/>`;
    return { bg, ground: H * 0.99 };
  },
  street(W, H, o) { // hillside alley with stairs and lamps
    const t = o.time || 'night', night = isNight(t);
    let bg = sky(W, H, t, { moon: o.weather === 'rain' || o.weather === 'storm' ? null : [W * 0.8, H * 0.12, 14], stars: 30, clouds: o.weather ? 5 : 2, seed: 111 });
    bg += town(W, H * 0.5, { seed: 112, depth: 0.6, time: t, h: 30 });
    bg += `<path d="M0 ${H * 0.3} L${W * 0.22} ${H * 0.36} L${W * 0.22} ${H} L0 ${H}Z" fill="${night ? '#3a3552' : '#b9a28a'}"/><path d="M${W} ${H * 0.25} L${W * 0.8} ${H * 0.34} L${W * 0.8} ${H} L${W} ${H}Z" fill="${night ? '#332f4a' : '#a8917a'}"/>`;
    bg += `<rect x="${W * 0.04}" y="${H * 0.46}" width="${W * 0.1}" height="${H * 0.12}" fill="${night ? '#ffd88a' : '#d9e3ea'}" opacity=".85"/><rect x="${W * 0.84}" y="${H * 0.42}" width="${W * 0.1}" height="${H * 0.12}" fill="${night ? '#ffd88a' : '#d9e3ea'}" opacity=".85"/>`;
    for (let i = 0; i < 7; i++) { const y = H * (0.62 + i * 0.055); bg += `<rect x="${W * (0.22 - i * 0.012)}" y="${y}" width="${W * (0.58 + i * 0.024)}" height="${H * 0.056}" fill="${mix(night ? '#5a5068' : '#a8988a', night ? '#3a3448' : '#8a7a6c', i / 7)}"/><rect x="${W * (0.22 - i * 0.012)}" y="${y}" width="${W * (0.58 + i * 0.024)}" height="2" fill="#fff" opacity=".12"/>`; }
    bg += lamp(W * 0.18, H * 0.34, 1, night) + lamp(W * 0.84, H * 0.3, 1, night);
    if (o.weather === 'rain' || o.weather === 'storm') bg += `<rect width="${W}" height="${H}" fill="#203048" opacity=".25"/>` + rain(W, H, { amt: o.weather === 'storm' ? 150 : 90, angle: o.weather === 'storm' ? 0.5 : 0.2 });
    return { bg, ground: H * 0.98 };
  },
  skyride(W, H, o) { // flying over the town
    const t = o.time || 'night';
    let bg = sky(W, H, t, { moon: o.weather ? null : [W * 0.62, H * 0.38, Math.min(W, H) * 0.24], stars: 80, clouds: 3, seed: o.seed || 121 });
    bg += `<g opacity=".9">${town(W, H * 1.02, { seed: 122, depth: 0.4, time: t, h: 24 })}</g>`;
    if (o.weather === 'storm') bg += `<rect width="${W}" height="${H}" fill="#18202e" opacity=".55"/><path d="M${W * 0.8} 0 L${W * 0.74} ${H * 0.2} L${W * 0.78} ${H * 0.2} L${W * 0.7} ${H * 0.42}" stroke="#e8f0ff" stroke-width="3" fill="none"/>` + rain(W, H, { amt: 160, angle: 0.55 });
    return { bg, ground: H };
  },
  pharmacy(W, H, o) {
    let bg = floor(W, 0, H * 0.7, '#e8efe9', '#d6e2da');
    for (let r = 0; r < 3; r++) { const y = H * (0.14 + r * 0.14); bg += `<rect x="${W * 0.42}" y="${y}" width="${W * 0.56}" height="4" fill="#b8c4bc"/>`; for (let i = 0; i < 8; i++) bg += `<rect x="${W * (0.44 + i * 0.068)}" y="${y - 18}" width="${W * 0.05}" height="18" rx="2" fill="${['#9fc0d4', '#f2ede4', '#e8c45a', '#a8cfae'][(i + r) % 4]}"/>`; }
    bg += signBoard(W * 0.06, H * 0.08, W * 0.2, H * 0.1, '약국', { bg: '#3f8a5e', fg: '#fff', size: Math.min(W, H) * 0.06, font: 'Noto Sans KR, sans-serif' }) + `<rect x="${W * 0.29}" y="${H * 0.09}" width="${H * 0.08}" height="${H * 0.08}" rx="3" fill="#3f8a5e"/><path d="M${W * 0.29 + H * 0.04} ${H * 0.105} v${H * 0.05} M${W * 0.29 + H * 0.015} ${H * 0.13} h${H * 0.05}" stroke="#fff" stroke-width="${H * 0.016}"/>`;
    bg += floor(W, H * 0.7, H, '#c9d4cc', '#b4c0b8');
    const fg = `<rect x="${W * 0.5}" y="${H * 0.72}" width="${W * 0.52}" height="${H * 0.3}" fill="#f2f0ea"/><rect x="${W * 0.5}" y="${H * 0.72}" width="${W * 0.52}" height="6" fill="#d8d4ca"/>`;
    return { bg, fg, ground: H * 0.98 };
  },
  sickroom(W, H, o) {
    const r = VISTAS.attic(W, H, { ...o, time: o.time || 'day' });
    return { ...r, bg: r.bg + `<rect x="${W * 0.0}" y="${H * 0.66}" width="${W * 0.5}" height="${H * 0.3}" fill="#e9e2ef"/>` };
  },
  hill(W, H, o) { // Chuseok night: grassy hill above the town, huge full moon
    const t = o.time || 'night';
    let bg = sky(W, H, t, { moon: [W * 0.5, H * 0.3, Math.min(W, H) * 0.2], stars: 100, clouds: 2, seed: 131 });
    bg += sea(W, H * 0.62, H, t, W * 0.5) + town(W, H * 0.66, { seed: 132, depth: 0.5, time: t, h: 18 });
    bg += lighthouse(W * 0.88, H * 0.64, H / 300, { lit: o.lit ?? 0.2, time: t });
    bg += `<path d="M-10 ${H} C${W * 0.2} ${H * 0.72} ${W * 0.6} ${H * 0.7} ${W + 10} ${H * 0.8} L${W} ${H}Z" fill="#1f2a3a"/>` + [...Array(30)].map((_, i) => `<path d="M${W * i / 30} ${H * (0.8 + (i % 5) * 0.02)} l3 -9 l2 9" stroke="#2f3d50" stroke-width="1.5" fill="none"/>`).join('');
    return { bg, ground: H * 0.97 };
  },
  plain(W, H, o) { const t = o.time || 'night'; return { bg: sky(W, H, t, { stars: 40, clouds: 0 }), ground: H }; },
};

// Soft, out-of-focus version of a scene for close-ups (depth of field).
export function blurred(scene, W, H, o, amount = 2.6) {
  const f = id('bl');
  const r = (VISTAS[scene] || VISTAS.plain)(W, H, o);
  return `<defs><filter id="${f}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${amount}"/></filter></defs><g filter="url(#${f})" transform="translate(${-W * 0.15} ${-H * 0.1}) scale(1.3)">${r.bg}${r.fg || ''}</g>`;
}
