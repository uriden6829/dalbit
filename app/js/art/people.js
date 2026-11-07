// Picture-book people: flat shapes, dot eyes, no outlines. Feet at (0,0), about 150 units tall.
// Deliberately simple and hand-drawn in spirit, so the stories never look machine-generated.

const EYE = '#2a2433';

function face(mood, dx) {
  const ex = [-7 + dx, 7 + dx], ey = -112;
  const dot = (x, y = ey, rx = 1.9, ry = 2.5) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${EYE}"/>`;
  const blush = `<ellipse cx="${-11 + dx * 0.6}" cy="-105.5" rx="3.6" ry="2" fill="#e5948a" opacity=".45"/><ellipse cx="${11 + dx * 0.6}" cy="-105.5" rx="3.6" ry="2" fill="#e5948a" opacity=".45"/>`;
  const m = dx * 0.7;
  switch (mood) {
    case 'happy':
      return ex.map((x) => `<path d="M${x - 2.6} -111 Q${x} -115 ${x + 2.6} -111" stroke="${EYE}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('')
        + `<path d="M${m - 4.5} -104.5 Q${m} -99 ${m + 4.5} -104.5 Z" fill="#9b4f4f"/>` + blush;
    case 'smile':
      return ex.map((x) => dot(x)).join('') + `<path d="M${m - 3.8} -104.2 Q${m} -101 ${m + 3.8} -104.2" stroke="${EYE}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` + blush;
    case 'talk':
      return ex.map((x) => dot(x)).join('') + `<ellipse cx="${m}" cy="-103.4" rx="2.8" ry="2.1" fill="#9b4f4f"/>`;
    case 'surprised':
      return ex.map((x) => dot(x, ey, 2.4, 2.8)).join('') + `<ellipse cx="${m}" cy="-102.8" rx="2.2" ry="2.8" fill="#9b4f4f"/>` + blush;
    case 'sad':
      return ex.map((x, i) => dot(x, ey + 0.5) + `<path d="M${x - 3} ${-117.5 + (i ? -1.2 : 1.2)} L${x + 3} ${-117.5 + (i ? 1.2 : -1.2)}" stroke="${EYE}" stroke-width="1.1" stroke-linecap="round"/>`).join('')
        + `<path d="M${m - 3.5} -102.5 Q${m} -105.5 ${m + 3.5} -102.5" stroke="${EYE}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    case 'think':
      return ex.map((x) => dot(x + 1.2, ey - 1.4)).join('') + `<path d="M${m - 1} -103.5 L${m + 3.5} -104" stroke="${EYE}" stroke-width="1.3" stroke-linecap="round"/>`;
    case 'sleepy':
      return ex.map((x) => `<path d="M${x - 2.6} -111.5 L${x + 2.6} -111.5" stroke="${EYE}" stroke-width="1.5" stroke-linecap="round"/>`).join('')
        + `<path d="M${m - 2.5} -103.5 L${m + 2.5} -103.5" stroke="${EYE}" stroke-width="1.2" stroke-linecap="round"/>`;
    case 'sick':
      return ex.map((x) => `<path d="M${x - 2.6} -111 Q${x} -109 ${x + 2.6} -111" stroke="${EYE}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join('')
        + `<path d="M${m - 3.5} -102.5 Q${m} -104.5 ${m + 3.5} -102.5" stroke="${EYE}" stroke-width="1.2" fill="none"/>` + `<ellipse cx="${-11 + dx * 0.6}" cy="-106" rx="4.5" ry="2.6" fill="#e07a70" opacity=".55"/><ellipse cx="${11 + dx * 0.6}" cy="-106" rx="4.5" ry="2.6" fill="#e07a70" opacity=".55"/>`;
    default: // neutral
      return ex.map((x) => dot(x)).join('') + `<path d="M${m - 3} -103.6 L${m + 3} -103.6" stroke="${EYE}" stroke-width="1.2" stroke-linecap="round"/>`;
  }
}

function hairBack(style, c) {
  switch (style) {
    case 'bob': return `<rect x="-22.5" y="-137" width="45" height="41" rx="16" fill="${c}"/>`;
    case 'long': return `<rect x="-22.5" y="-137" width="45" height="66" rx="16" fill="${c}"/>`;
    case 'ponytail': return `<path d="M14 -128 C30 -126 32 -104 24 -88 C22 -98 20 -110 12 -116 Z" fill="${c}"/>`;
    case 'bun': return `<circle cx="0" cy="-138" r="9.5" fill="${c}"/>`;
    case 'perm': return [[-15, -126], [-6, -134], [6, -134], [15, -126], [-19, -114], [19, -114]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.6" fill="${c}"/>`).join('');
    default: return '';
  }
}
function hairFront(style, c) {
  if (style === 'short') return `<path d="M-19.6 -111 C-20.5 -132 -8 -137 1 -137 C12 -137 20.5 -131 19.6 -111 C17 -120 10 -125 0 -125 C-9 -125 -16 -120 -19.6 -111 Z" fill="${c}"/>`;
  if (style === 'perm') return `<path d="M-19.6 -113 C-19 -128 -10 -133 0 -133 C10 -133 19 -128 19.6 -113 C14 -121 8 -123 0 -122 C-8 -123 -14 -121 -19.6 -113 Z" fill="${c}"/>`;
  return `<path d="M-19.6 -112 C-21 -131 -10 -137 0 -137 C12 -137 21 -130 19.6 -112 C14 -121 6 -124 -2 -122 C-9 -121 -15 -118 -19.6 -112 Z" fill="${c}"/>`;
}

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

export function person(o) {
  const p = { hair: 'bob', hairColor: '#3b2a22', skin: '#f2d3bd', top: '#e9dcc4', bottom: '#43405a', mood: 'neutral', face: 'front', arms: 'down', ...o };
  const dx = p.face === 'left' ? -3 : p.face === 'right' ? 3 : 0;
  const top = p.top, topD = shade(top, 0.86);
  const parts = [`<ellipse cx="0" cy="0" rx="26" ry="4" fill="#000" opacity=".1"/>`, hairBack(p.hair, p.hairColor)];
  if (!p.robe) {
    parts.push(`<rect x="-12" y="-46" width="9" height="44" rx="4" fill="${p.bottom}"/><rect x="3" y="-46" width="9" height="44" rx="4" fill="${p.bottom}"/>`,
      `<ellipse cx="-8" cy="-2" rx="7" ry="3.4" fill="#2b2730"/><ellipse cx="8" cy="-2" rx="7" ry="3.4" fill="#2b2730"/>`);
  }
  parts.push(p.robe
    ? `<path d="M-25 -3 C-27 -40 -22 -80 -15 -92 Q0 -99 15 -92 C22 -80 27 -40 25 -3 Q0 1 -25 -3 Z" fill="${top}"/>`
    : `<path d="M-22 -40 C-24 -62 -22 -82 -15 -92 Q0 -99 15 -92 C22 -82 24 -62 22 -40 Q0 -36 -22 -40 Z" fill="${top}"/>`);
  parts.push(`<path d="M0 -93 L0 ${p.robe ? -6 : -40}" stroke="${topD}" stroke-width="1.2"/>`);
  if (p.apron) parts.push(`<path d="M-13 -80 L13 -80 L16 -42 L-16 -42 Z" fill="${p.apron}"/><path d="M-11 -80 L-9 -94 M11 -80 L9 -94" stroke="${p.apron}" stroke-width="2"/>`);
  if (p.whiteCoat) parts.push(`<path d="M-4 -93 L-9 -70 L0 -60 Z M4 -93 L9 -70 L0 -60 Z" fill="${shade(top, 0.9)}"/>`);
  const arm = (d, hx, hy) => `<path d="${d}" stroke="${topD}" stroke-width="8.5" fill="none" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="4.6" fill="${p.skin}"/>`;
  parts.push(arm('M-18.5 -87 Q-27 -67 -24.5 -49', -24.5, -46));
  if (p.arms === 'wave') parts.push(arm('M18.5 -87 Q31 -97 30 -116', 30, -119));
  else if (p.arms === 'hold') parts.push(arm('M18.5 -87 Q25 -72 11 -67', 9, -67) + `<rect x="2" y="-80" width="12" height="13" rx="2.5" fill="${p.prop || '#f3eee4'}"/>`);
  else if (p.arms === 'point') parts.push(arm('M18.5 -87 Q31 -86 40 -91', 42.5, -92));
  else if (p.arms === 'phone') parts.push(arm('M18.5 -87 Q27 -96 15 -107', 14, -109) + `<rect x="13" y="-121" width="6" height="12" rx="1.5" fill="#2b2a38"/>`);
  else parts.push(arm('M18.5 -87 Q27 -67 24.5 -49', 24.5, -46));
  if (p.scarf) parts.push(`<path d="M-13 -96 Q0 -88 13 -96 L13 -90 Q0 -82 -13 -90 Z" fill="${p.scarf}"/><rect x="5" y="-91" width="6" height="16" rx="2" fill="${p.scarf}"/>`);
  parts.push(`<rect x="-4.5" y="-101" width="9" height="9" rx="2" fill="${shade(p.skin, 0.93)}"/>`);
  parts.push(`<circle cx="0" cy="-114" r="19.5" fill="${p.skin}"/>`);
  parts.push(hairFront(p.hair, p.hairColor));
  parts.push(face(p.mood, dx));
  if (p.glasses) parts.push(`<g stroke="#3a3446" stroke-width="1.1" fill="none"><circle cx="${-7 + dx}" cy="-112" r="4.8"/><circle cx="${7 + dx}" cy="-112" r="4.8"/><path d="M${-2.2 + dx} -112 L${2.2 + dx} -112"/></g>`);
  if (p.hat === 'witch') parts.push(`<ellipse cx="0" cy="-131" rx="27" ry="5.6" fill="#3d2f57"/><path d="M-13.5 -132 C-10 -147 -6 -161 4 -171 C8 -175 14 -176 17 -172 C11 -169 9 -161 9 -151 C9 -143 11 -137 13.5 -132 Z" fill="#4d3d6b"/><path d="M-13 -136 L12.3 -136 L13.5 -132 L-13.5 -132 Z" fill="#d4b26a"/>`);
  if (p.hat === 'cap') parts.push(`<path d="M-20 -121 C-19 -138 19 -138 20 -121 Z" fill="#2f3a4c"/><path d="M-2 -122 L27 -120 Q18 -115 -2 -118 Z" fill="#26303f"/>`);
  return `<g class="person">${parts.join('')}</g>`;
}

export const CAST = {
  head: { hair: 'bun', hairColor: '#cfc8d2', skin: '#efcfb6', top: '#43355d', robe: true, glasses: true, hat: 'witch' },
  minji: { hair: 'ponytail', hairColor: '#2b211d', skin: '#f2d2bb', top: '#c98b6b', bottom: '#3e3a4f' },
  clerk: { hair: 'short', hairColor: '#1f1a18', skin: '#e9c3a5', top: '#6f8fa8', bottom: '#34324a' },
  driver: { hair: 'short', hairColor: '#6b6770', skin: '#e2b896', top: '#3d4a5c', hat: 'cap', glasses: true },
  staff: { hair: 'perm', hairColor: '#2e2420', skin: '#e8c0a0', top: '#a35d5d', apron: '#f3eee6' },
  mom: { hair: 'perm', hairColor: '#3a2c26', skin: '#f0caa9', top: '#8a6f9e', bottom: '#4a4560' },
  dad: { hair: 'short', hairColor: '#4a4645', skin: '#e3b994', top: '#6b7a6b', glasses: true },
  grandma: { hair: 'bun', hairColor: '#ddd8da', skin: '#eac2a2', top: '#7b8f6a', bottom: '#5d5470' },
  pharm: { hair: 'long', hairColor: '#2a1f1b', skin: '#f3d5bf', top: '#f4f1ea', glasses: true, whiteCoat: true },
  man: { hair: 'short', hairColor: '#2a2421', skin: '#e8c0a0', top: '#5a6b8a' },
  woman: { hair: 'bob', hairColor: '#3b2a22', skin: '#f2d3bd', top: '#b68e6a' },
};

export const CAST_NAMES = { me: 'You', jiji: '지지', head: '서 선생님', minji: '민지', clerk: 'Clerk', driver: 'Taxi driver', staff: 'Server', mom: '어머니', dad: '아버지', grandma: '할머니', pharm: 'Pharmacist', man: 'Man', woman: 'Woman' };

const DEFAULT_LOOK = { hair: 'bob', hairColor: '#3b2a22', skin: '#f2d3bd', coat: '#e9dcc4' };
export function meLook(look, scene) {
  const l = { ...DEFAULT_LOOK, ...(look || {}) };
  return { hair: l.hair, hairColor: l.hairColor, skin: l.skin, top: l.coat, scarf: '#6a4d74', hat: scene === 'academy' ? 'witch' : null };
}
