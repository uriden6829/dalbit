// 지지 — the academy's black cat. Original design: gold eyes, plum hat, crescent-moon charm.
// jijiGroup() returns SVG markup in a 120x150 box (feet at y≈146) for reuse inside webtoon panels.
// Drawn for small sizes (64-120 px) on the night-blue UI: a sitting-cat silhouette (head, chest, haunches, front legs),
// a moonlight rim on the upper-left edges so black fur still reads on dark blue, and big almond eyes that carry the mood.

const FUR = '#1e1c27', FUR_HI = '#34304a', FUR_LO = '#121119', RIM = '#857ec0';
const HAT = '#40305c', HAT_HI = '#5a4881', HAT_LO = '#291f3e', BAND = '#d4b26a', IRIS = ['#fdf0b8', '#f0cf6a', '#c99a34'];
let uid = 0;
const EYE = { slant: 0.2, w: 1.05, h: 1.3, pupil: [4.2, 6.2] };

const HEAD = 'M60 52 C77 52 89 61 90 73 L95.5 81.5 L89.5 85 C86 95 75 101.5 60 101.5 C45 101.5 34 95 30.5 85 L24.5 81.5 L30 73 C31 61 43 52 60 52Z';
const BODY = 'M47 96 C42 104 39.5 114 38.5 123 C33.5 127.5 31.5 135 33 141.5 C34.5 146 40 147 46 147 L74 147 C80 147 85.5 146 87 141.5 C88.5 135 86.5 127.5 81.5 123 C80.5 114 78 104 73 96Z';
const EAR_L = 'M33 70 Q27.5 51 31 37.5 Q33.5 35.5 36.5 38 Q46 45.5 52.5 56Z', EAR_R = 'M87 70 Q92.5 51 89 37.5 Q86.5 35.5 83.5 38 Q74 45.5 67.5 56Z';
const IN_L = 'M35.5 63 Q32.5 51 34.3 43.5 Q42 49 47 56Z', IN_R = 'M84.5 63 Q87.5 51 85.7 43.5 Q78 49 73 56Z';

// Moonlit rim: the shape in rim colour, then the same shape shifted down-right on top, clipped to the shape.
function rimmed(d, fill, k, dx = 1.1, dy = 0.9) {
  return `<defs><clipPath id="jc${k}"><path d="${d}"/></clipPath></defs><g clip-path="url(#jc${k})"><path d="${d}" fill="url(#jr${k.split('-')[0]})"/><path d="${d}" fill="${fill}" transform="translate(${dx} ${dy})"/></g>`;
}

// One almond cat eye. side -1 = left, 1 = right. o: { open, look:[dx,dy], pupil:[rx,ry], lid: 0..1 (upper lid drop), slant }
function eye(cx, cy, side, k, o = {}) {
  const s = (o.size || 1) * 1.14, lk = o.look || [0, 0];
  const ew = s * EYE.w, eh = s * EYE.h, sl = s * EYE.slant;
  const xo = cx + side * 8.6 * ew, xi = cx - side * 7.6 * ew, yo = cy - 2.6 * sl, yi = cy + 1.6 * sl;
  const d = `M${xi} ${yi} C${xi + side * 1.5 * ew} ${cy - 6.8 * eh} ${xo - side * 3.6 * ew} ${cy - 8.8 * eh} ${xo} ${yo} C${xo - side * 1.4 * ew} ${cy + 5.6 * eh} ${xi + side * 3.4 * ew} ${cy + 7.8 * eh} ${xi} ${yi}Z`;
  const [prx, pry] = o.pupil || EYE.pupil;
  const px = cx + lk[0], py = cy + 0.6 + lk[1];
  const lid = o.lid ? `<path d="M${cx - 12} ${cy - 11} L${cx + 12} ${cy - 11} L${cx + 12} ${cy - 9 + o.lid * 13 + side * (o.slant || 0)} L${cx - 12} ${cy - 9 + o.lid * 13 - side * (o.slant || 0)}Z" fill="${FUR}"/><path d="M${cx - 12} ${cy - 9 + o.lid * 13 - side * (o.slant || 0)} L${cx + 12} ${cy - 9 + o.lid * 13 + side * (o.slant || 0)}" stroke="${FUR_LO}" stroke-width="1.6"/>` : '';
  return `<defs><clipPath id="je${k}"><path d="${d}"/></clipPath></defs>
    <g clip-path="url(#je${k})"><path d="${d}" fill="url(#ji${k})"/>
      <ellipse cx="${px}" cy="${py}" rx="${prx}" ry="${pry}" fill="#100f17"/>
      <circle cx="${px + 2.6}" cy="${py - 3.4}" r="${1.9 * s}" fill="#fff"/><circle cx="${px - 2.3}" cy="${py + 3.2}" r=".95" fill="#fff" opacity=".75"/>${o.wet ? `<path d="M${cx - 6} ${cy + 4.4} Q${cx} ${cy + 6.6} ${cx + 6} ${cy + 4.4}" stroke="#fff" stroke-width="1.1" fill="none" opacity=".7"/>` : ''}${lid}</g>
    <path d="M${xi} ${yi} C${xi + side * 1.5 * ew} ${cy - 6.8 * eh} ${xo - side * 3.6 * ew} ${cy - 8.8 * eh} ${xo} ${yo}" stroke="#0b0a10" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
}
const closed = (cx, cy, side, down) => {
  const xo = cx + side * 8, xi = cx - side * 7.5;
  return down
    ? `<path d="M${xi} ${cy} Q${cx} ${cy + 4} ${xo} ${cy - 1.5}" stroke="${IRIS[1]}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`
    : `<path d="M${xi} ${cy + 1.5} Q${cx} ${cy - 6.5} ${xo} ${cy}" stroke="${IRIS[1]}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
};

function face(mood, k) {
  const L = 47, R = 73, Y = 77.5;
  const both = (o) => eye(L, Y, -1, `${k}a`, o) + eye(R, Y, 1, `${k}b`, o);
  let eyes, mouth = 'w';
  switch (mood) {
    case 'happy': eyes = closed(L, Y, -1) + closed(R, Y, 1); mouth = 'open'; break;
    case 'sleepy': eyes = closed(L, Y + 1, -1, true) + closed(R, Y + 1, 1, true); break;
    case 'surprised': eyes = both({ size: 1.12, pupil: [3, 3.4] }); mouth = 'o'; break;
    case 'think': eyes = both({ look: [-2.2, -2.4], lid: 0.12 }); mouth = 'side'; break;
    case 'sad': eyes = both({ look: [0, 2.2], pupil: [3.7, 5.4], lid: 0.16, slant: 3.6, wet: true }); mouth = 'down'; break;
    case 'smug': eyes = both({ look: [1.6, 0.8], pupil: [2.2, 5], lid: 0.5, slant: -0.8 }); mouth = 'smirk'; break;
    default: eyes = both({});
  }
  const M = {
    w: `<path d="M60 91.4 Q58.6 94.6 55.6 93.4 M60 91.4 Q61.4 94.6 64.4 93.4" stroke="#8a7f9c" stroke-width="1.15" fill="none" stroke-linecap="round"/>`,
    open: `<path d="M55.4 92.6 Q60 101 64.6 92.6 Q60 94.6 55.4 92.6Z" fill="#7e3b4c"/><path d="M57.6 96 Q60 98.8 62.4 96 Q60 95 57.6 96Z" fill="#e58f9c"/>`,
    o: `<ellipse cx="60" cy="95" rx="2.6" ry="3" fill="#7e3b4c"/>`,
    side: `<path d="M60 91.4 Q61.6 94 64.6 93" stroke="#8a7f9c" stroke-width="1.15" fill="none" stroke-linecap="round"/>`,
    down: `<path d="M56.4 95 Q60 92 63.6 95" stroke="#8a7f9c" stroke-width="1.15" fill="none" stroke-linecap="round"/>`,
    smirk: `<path d="M60 91.4 Q58.6 94 56 93.2 M60 91.4 Q62.6 94.4 65.6 92" stroke="#8a7f9c" stroke-width="1.15" fill="none" stroke-linecap="round"/>`,
  }[mouth];
  return { eyes, mouth: M };
}

export function jijiGroup(mood = 'idle', { animate = false } = {}) {
  const k = (++uid).toString(36);
  const { eyes, mouth } = face(mood, k);
  return `
  <g class="jiji-art ${animate ? 'animate' : ''}">
    <defs>
      <radialGradient id="jf${k}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#2c293a"/><stop offset=".55" stop-color="${FUR}"/><stop offset="1" stop-color="${FUR_LO}"/></radialGradient>
      <radialGradient id="ji${k}a" cx=".5" cy=".72" r=".75"><stop offset="0" stop-color="${IRIS[0]}"/><stop offset=".55" stop-color="${IRIS[1]}"/><stop offset="1" stop-color="${IRIS[2]}"/></radialGradient>
      <radialGradient id="ji${k}b" href="#ji${k}a"/>
      <linearGradient id="jh${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${HAT_HI}"/><stop offset=".55" stop-color="${HAT}"/><stop offset="1" stop-color="${HAT_LO}"/></linearGradient>
      <linearGradient id="jr${k}" x1="0" y1="0" x2=".75" y2="1"><stop offset="0" stop-color="${RIM}"/><stop offset=".45" stop-color="${RIM}" stop-opacity=".75"/><stop offset="1" stop-color="${RIM}" stop-opacity="0"/></linearGradient>
      <linearGradient id="jn${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4560"/><stop offset="1" stop-color="#3a2738"/></linearGradient>
    </defs>
    <ellipse cx="60" cy="146.5" rx="31" ry="3.6" fill="#000" opacity=".2"/>
    <g class="tail">
      <path d="M79 141 C97 143 107 131 105 115 C104 105 96.5 99 98.5 92.5" stroke="${RIM}" stroke-width="8.3" fill="none" stroke-linecap="round" opacity=".4" transform="translate(-.7 -.6)"/>
      <path d="M79 141 C97 143 107 131 105 115 C104 105 96.5 99 98.5 92.5" stroke="${FUR}" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>
    ${rimmed(BODY, `url(#jf${k})`, `${k}-b`)}
    <path d="M38.8 127 C43 131 45 138 44.6 146 M81.2 127 C77 131 75 138 75.4 146" stroke="${FUR_HI}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    
    <path d="M60 121 V145.5" stroke="${FUR_LO}" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>
    <path d="M47.5 147 C46.5 143 49 140.6 53.6 140.6 C58.2 140.6 60 143 59.4 147Z M60.6 147 C60 143 61.8 140.6 66.4 140.6 C71 140.6 73.5 143 72.5 147Z" fill="#2a2737"/>
    <path d="M51.5 143.6 v3 M55.3 143.4 v3.2 M64.7 143.4 v3.2 M68.5 143.6 v3" stroke="${FUR_LO}" stroke-width=".9" stroke-linecap="round"/>
    <path d="M51 101 L54 108.5 L56.5 104 L60 111 L63.5 104 L66 108.5 L69 101 Q60 104 51 101Z" fill="${FUR_HI}" opacity=".85"/>
    <g class="head">
      ${rimmed(EAR_L, FUR, `${k}-l`)}${rimmed(EAR_R, FUR, `${k}-r`, 0.8, 1.2)}
      <path d="${IN_L}" fill="url(#jn${k})"/><path d="${IN_R}" fill="url(#jn${k})"/>
      ${rimmed(HEAD, `url(#jf${k})`, `${k}-h`)}
      <path d="M38 94 Q48 99 54 99.5 M82 94 Q72 99 66 99.5" stroke="${FUR_LO}" stroke-width="1.2" fill="none" opacity=".8"/>
      <g class="eyes">${eyes}</g>
      <path d="M57.4 88.2 Q60 86.8 62.6 88.2 Q61.2 91.2 60 91.4 Q58.8 91.2 57.4 88.2Z" fill="#d397a6"/>
      ${mouth}
      <path d="M39 87.5 Q29 84.5 19.5 84.6 M39 90 Q28.5 89.6 20.5 91.8 M39.5 92.6 Q30.5 94.6 23 98.6 M81 87.5 Q91 84.5 100.5 84.6 M81 90 Q91.5 89.6 99.5 91.8 M80.5 92.6 Q89.5 94.6 97 98.6" stroke="#a9a3c4" stroke-width=".7" fill="none" opacity=".75" stroke-linecap="round"/>
      <g class="hat">
        <ellipse cx="60" cy="57.2" rx="31.5" ry="6.6" fill="${HAT_LO}"/>
        <ellipse cx="60" cy="55.6" rx="31.5" ry="6.2" fill="${HAT}"/>
        <path d="M30.5 56.4 Q60 64.6 89.5 56.4" stroke="${HAT_HI}" stroke-width="1.1" fill="none" opacity=".8"/>
        <path d="M45.4 54.6 C47 42.5 51.6 31 57.6 21.4 C61.6 14.6 67.6 9.4 75.4 8.2 C79.6 7.6 83 9.4 84.4 12.4 C79.4 11.4 74.6 14.2 71.6 20.2 C68.4 28 69.8 42 75.2 54.6 Q60 57.6 45.4 54.6Z" fill="url(#jh${k})"/>
        <path d="M50.4 47.5 C52 38.5 55.6 30 60.4 23" stroke="${HAT_HI}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M46.2 50.2 Q60 52.6 73.9 50.2 L75 54.7 Q60 57.6 45.3 54.7Z" fill="${BAND}"/>
        <path d="M45.3 54.7 Q60 57.6 75 54.7" stroke="#9c7c3e" stroke-width=".9" fill="none"/>
        <path d="M62.6 50.6 l1.1 2.2 2.4 .3 -1.8 1.6 .5 2.3 -2.2-1.2 -2.2 1.2 .5-2.3 -1.8-1.6 2.4-.3Z" fill="#fff4cf" transform="translate(-2.6 -1.4) scale(1)"/>
      </g>
    </g>
    <path d="M44 97.5 Q60 106.5 76 97.5" stroke="#6d4f74" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M61.6 101.8 a4.4 4.4 0 1 0 0 7.8 a3.4 3.4 0 1 1 0 -7.8Z" fill="${BAND}"/>
  </g>`;
}

export function jijiSVG(mood = 'idle', { size = 120, animate = true, label = '지지' } = {}) {
  return `<svg class="jiji" viewBox="0 0 120 150" width="${size}" height="${size * 1.25}" role="img" aria-label="${label}">${jijiGroup(mood, { animate })}</svg>`;
}
